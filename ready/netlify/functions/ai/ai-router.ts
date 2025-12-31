import { runAI } from './run'
import type { AIRunInput } from '../../src/lib/ai/types'

type LegacyAIRequest = AIRunInput & { tier: any }

export async function routeAIRequest(request: LegacyAIRequest) {
  const result = await runAI({
    ...request,
    tier: request.tier as any,
  })

  return {
    success: result.ok,
    data: result.output,
    error: result.error_message || undefined,
    provider: result.provider,
    model: result.model,
    costEstimate: result.cost_estimate,
    trace_id: result.trace_id,
  }
}

export { runAI }
