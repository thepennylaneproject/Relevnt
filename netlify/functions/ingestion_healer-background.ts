// netlify/functions/ingestion_healer-background.ts
/**
 * Background function for automatic ingestion healing
 * 
 * Runs every 15 minutes to:
 * 1. Fix stuck runs (running > 15 min)
 * 2. Retry failed sources with backoff
 * 3. Reset cursors for parse errors
 * 4. Escalate persistent failures
 */

// Cron schedule: every 15 minutes

import type { BackgroundHandler } from '@netlify/functions'
import { createAdminClient, createResponse } from './utils/supabase'

// Healing configuration
const STUCK_RUN_THRESHOLD_MINUTES = 15
const MAX_RETRY_ATTEMPTS = 3
const DISABLE_THRESHOLD = 5
const RATE_LIMIT_BACKOFF_MINUTES = 30

type FailureType = 
  | 'stuck_run' 
  | 'timeout' 
  | 'http_error' 
  | 'auth_error' 
  | 'parse_error' 
  | 'rate_limit' 
  | 'consecutive_failures'

type HealingAction = 
  | 'retry' 
  | 'reset_cursor' 
  | 'skip_batch' 
  | 'disable_source' 
  | 'mark_failed' 
  | 'increase_delay' 
  | 'escalate'

type HealingResult = 'success' | 'failed' | 'escalated' | 'pending'

interface HealingAttempt {
  source: string
  failureType: FailureType
  action: HealingAction
  originalError?: string
  result: HealingResult
  runId?: string
  meta?: Record<string, any>
}

/**
 * Classify error message into failure type
 */
function classifyError(errorMessage: string | null | undefined): FailureType {
  if (!errorMessage) return 'http_error'
  
  const lower = errorMessage.toLowerCase()
  
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('econnreset')) {
    return 'timeout'
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('forbidden')) {
    return 'auth_error'
  }
  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'rate_limit'
  }
  if (lower.includes('parse') || lower.includes('json') || lower.includes('unexpected token')) {
    return 'parse_error'
  }
  
  return 'http_error'
}

/**
 * Determine the appropriate healing action for a failure type
 */
function determineHealingAction(
  failureType: FailureType, 
  consecutiveFailures: number,
  healAttempts24h: number
): HealingAction {
  // Check if we should escalate due to too many heal attempts
  if (healAttempts24h >= MAX_RETRY_ATTEMPTS) {
    return 'escalate'
  }
  
  // Check if source should be disabled
  if (consecutiveFailures >= DISABLE_THRESHOLD) {
    return 'disable_source'
  }
  
  switch (failureType) {
    case 'stuck_run':
      return 'mark_failed'
    case 'timeout':
    case 'http_error':
      return 'retry'
    case 'rate_limit':
      return 'increase_delay'
    case 'auth_error':
      return 'escalate' // Can't fix auth issues automatically
    case 'parse_error':
      return 'reset_cursor'
    case 'consecutive_failures':
      return consecutiveFailures >= DISABLE_THRESHOLD ? 'disable_source' : 'retry'
    default:
      return 'escalate'
  }
}

/**
 * Log a healing attempt to the database
 */
async function logHealingAttempt(
  supabase: ReturnType<typeof createAdminClient>,
  attempt: HealingAttempt
): Promise<void> {
  const { error } = await supabase
    .from('ingestion_healing_log')
    .insert({
      source: attempt.source,
      failure_type: attempt.failureType,
      healing_action: attempt.action,
      original_error: attempt.originalError,
      healing_result: attempt.result,
      run_id: attempt.runId,
      resolved_at: attempt.result === 'success' ? new Date().toISOString() : null,
      meta: attempt.meta || {},
    })
  
  if (error) {
    console.error('ingestion_healer: failed to log healing attempt', error)
  }
}

/**
 * Create an admin alert for escalated issues
 */
async function createEscalationAlert(
  supabase: ReturnType<typeof createAdminClient>,
  source: string,
  reason: string
): Promise<void> {
  await supabase.from('admin_alerts').insert({
    alert_type: 'healing_escalation',
    severity: 'high',
    title: `Auto-healing escalated for ${source}`,
    description: reason,
    source_slug: source,
    triggered_at: new Date().toISOString(),
  })
}

/**
 * Handle stuck runs - mark them as failed and reset cursor
 */
async function healStuckRuns(
  supabase: ReturnType<typeof createAdminClient>
): Promise<HealingAttempt[]> {
  const attempts: HealingAttempt[] = []
  
  const cutoffTime = new Date(Date.now() - STUCK_RUN_THRESHOLD_MINUTES * 60 * 1000).toISOString()
  
  // Find stuck runs
  const { data: stuckRuns, error } = await supabase
    .from('job_ingestion_runs')
    .select('id, sources_requested, started_at')
    .eq('status', 'running')
    .lt('started_at', cutoffTime)
  
  if (error) {
    console.error('ingestion_healer: failed to query stuck runs', error)
    return attempts
  }
  
  if (!stuckRuns || stuckRuns.length === 0) {
    console.log('ingestion_healer: no stuck runs found')
    return attempts
  }
  
  console.log(`ingestion_healer: found ${stuckRuns.length} stuck runs`)
  
  for (const run of stuckRuns) {
    // Mark run as failed
    const { error: updateError } = await supabase
      .from('job_ingestion_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: 'failed',
        error_summary: 'Auto-healed: Function timed out before completion',
      })
      .eq('id', run.id)
    
    const success = !updateError
    
    // Log healing attempt for each source in the run
    const sources = run.sources_requested || []
    for (const source of sources) {
      const attempt: HealingAttempt = {
        source,
        failureType: 'stuck_run',
        action: 'mark_failed',
        originalError: 'Function timed out before completion',
        result: success ? 'success' : 'failed',
        runId: run.id,
        meta: { started_at: run.started_at },
      }
      
      await logHealingAttempt(supabase, attempt)
      attempts.push(attempt)
    }
    
    if (updateError) {
      console.error('ingestion_healer: failed to update stuck run', run.id, updateError)
    }
  }
  
  return attempts
}

/**
 * Handle sources with consecutive failures
 */
async function healFailingSources(
  supabase: ReturnType<typeof createAdminClient>
): Promise<HealingAttempt[]> {
  const attempts: HealingAttempt[] = []
  
  // Find sources with failures that have auto-heal enabled
  // Note: The ingestion sets is_degraded=true on failure, not is_healthy=false
  const { data: unhealthySources, error } = await supabase
    .from('job_source_health')
    .select('source, consecutive_failures, last_error_at, last_error_message, heal_attempts_24h')
    .eq('is_degraded', true)
    .gt('consecutive_failures', 0)
    .lt('consecutive_failures', DISABLE_THRESHOLD)
  
  if (error) {
    console.error('ingestion_healer: failed to query unhealthy sources', error)
    return attempts
  }
  
  if (!unhealthySources || unhealthySources.length === 0) {
    console.log('ingestion_healer: no healable sources found')
    return attempts
  }
  
  console.log(`ingestion_healer: found ${unhealthySources.length} sources to heal`)
  
  for (const source of unhealthySources) {
    // Classify error from stored error message if available
    const errorMessage = (source as any).last_error_message as string | null
    const failureType: FailureType = errorMessage ? classifyError(errorMessage) : 'consecutive_failures'
    const healAttempts = source.heal_attempts_24h || 0
    const action = determineHealingAction(failureType, source.consecutive_failures, healAttempts)
    
    let result: HealingResult = 'pending'
    
    try {
      switch (action) {
        case 'retry':
          // Trigger a retry by calling the ingest trigger
          const retryResponse = await fetch(
            `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/admin_ingest_trigger`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': process.env.ADMIN_SECRET || '',
              },
              body: JSON.stringify({ source: source.source }),
            }
          )
          result = retryResponse.ok ? 'success' : 'failed'
          break
          
        case 'reset_cursor':
          // Reset the cursor to page 1
          await supabase
            .from('job_ingestion_state')
            .upsert({
              source: source.source,
              cursor: { page: 1, since: null },
              last_run_at: new Date().toISOString(),
            }, { onConflict: 'source' })
          result = 'success'
          break
          
        case 'increase_delay':
          // For rate limits, we just wait - mark as pending and skip retry
          result = 'pending'
          break
          
        case 'disable_source':
          // Disable the source
          await supabase
            .from('job_source_health')
            .update({
              is_degraded: false, // Reset degraded status when disabling
              updated_at: new Date().toISOString(),
            })
            .eq('source', source.source)

          await createEscalationAlert(
            supabase,
            source.source,
            `Source disabled after ${source.consecutive_failures} consecutive failures. Last error at: ${source.last_error_at}`
          )
          result = 'escalated'
          break

        case 'escalate':
          await createEscalationAlert(
            supabase,
            source.source,
            `Auto-healing unable to recover source. Failure type: ${failureType}. Consecutive failures: ${source.consecutive_failures}`
          )
          result = 'escalated'
          break
      }
      
      // Update heal attempts counter
      await supabase
        .from('job_source_health')
        .update({
          heal_attempts_24h: healAttempts + 1,
          last_heal_attempt_at: new Date().toISOString(),
        })
        .eq('source', source.source)
        
    } catch (err) {
      console.error(`ingestion_healer: error healing source ${source.source}`, err)
      result = 'failed'
    }
    
    const attempt: HealingAttempt = {
      source: source.source,
      failureType,
      action,
      originalError: errorMessage || `Consecutive failures: ${source.consecutive_failures}`,
      result,
      meta: {
        consecutive_failures: source.consecutive_failures,
        heal_attempts_24h: healAttempts,
        last_error_at: source.last_error_at,
      },
    }
    
    await logHealingAttempt(supabase, attempt)
    attempts.push(attempt)
  }
  
  return attempts
}

/**
 * Reset daily heal attempt counters (should run at midnight)
 */
async function resetDailyCounters(
  supabase: ReturnType<typeof createAdminClient>
): Promise<void> {
  const now = new Date()
  const hour = now.getUTCHours()
  
  // Only reset at midnight UTC
  if (hour !== 0) return
  
  const { error } = await supabase
    .from('job_source_health')
    .update({ heal_attempts_24h: 0 })
    .gt('heal_attempts_24h', 0)
  
  if (error) {
    console.error('ingestion_healer: failed to reset daily counters', error)
  } else {
    console.log('ingestion_healer: reset daily heal attempt counters')
  }
}

/**
 * Main background handler
 */
export const handler: BackgroundHandler = async (event) => {
  console.log('ingestion_healer: starting healing run')
  
  const startTime = Date.now()
  const supabase = createAdminClient()
  
  const allAttempts: HealingAttempt[] = []
  
  try {
    // Step 1: Heal stuck runs
    const stuckRunAttempts = await healStuckRuns(supabase)
    allAttempts.push(...stuckRunAttempts)
    
    // Step 2: Heal failing sources
    const sourceAttempts = await healFailingSources(supabase)
    allAttempts.push(...sourceAttempts)
    
    // Step 3: Reset daily counters if needed
    await resetDailyCounters(supabase)
    
    const duration = Date.now() - startTime
    
    console.log('ingestion_healer: healing run complete', {
      duration_ms: duration,
      total_attempts: allAttempts.length,
      successful: allAttempts.filter(a => a.result === 'success').length,
      failed: allAttempts.filter(a => a.result === 'failed').length,
      escalated: allAttempts.filter(a => a.result === 'escalated').length,
    })
    
  } catch (err) {
    console.error('ingestion_healer: unexpected error', err)
  }
}
