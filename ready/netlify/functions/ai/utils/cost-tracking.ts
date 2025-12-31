/**
 * ============================================================================
 * COST TRACKING & USAGE LIMITS
 * ============================================================================
 * Tracks AI usage costs and enforces tier-based limits
 * ============================================================================
 */

import { createAdminClient } from '../../utils/supabase';

export interface UsageLimitCheck {
  tier: string;
  limit: number;
  used: number;
  remaining: number;
  allowed: boolean;
  message: string;
}

/**
 * Tier-based usage limits
 */
const TIER_LIMITS = {
  free: 25,
  pro: 200,
  premium: 1000,
  coach: 1200,
};

/**
 * Cost per token for each provider (in dollars)
 */
const PROVIDER_COSTS = {
  'deepseek': {
    input: 0.00000014, // $0.14 per 1M tokens
    output: 0.00000042, // $0.42 per 1M tokens
  },
  'anthropic': {
    input: 0.000003, // $3 per 1M tokens (Sonnet 4)
    output: 0.000015, // $15 per 1M tokens
  },
  'openai': {
    input: 0.0000005, // $0.50 per 1M tokens
    output: 0.0000015, // $1.50 per 1M tokens
  },
};

/**
 * Calculate cost of an API call
 */
export function calculateCost(
  provider: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = PROVIDER_COSTS[provider as keyof typeof PROVIDER_COSTS];
  if (!costs) return 0;

  const inputCost = inputTokens * costs.input;
  const outputCost = outputTokens * costs.output;
  return inputCost + outputCost;
}

/**
 * Log AI usage to database
 */
export async function logAIUsage(
  userId: string,
  task: string,
  provider: string,
  inputTokens: number,
  outputTokens: number,
  cost: number
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  try {
    await supabase.from('ai_usage').insert({
      user_id: userId,
      task,
      provider,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging AI usage:', error);
    // Don't throw - logging should not block operations
  }
}

/**
 * Check if user can perform AI task based on tier limits
 */
export async function checkUserLimit(
  userId: string,
  userTier: string = 'free'
): Promise<UsageLimitCheck> {
  const limit = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  const supabase = createAdminClient();

  if (!supabase) {
    // In test/mock mode, allow unlimited
    return {
      tier: userTier,
      limit,
      used: 0,
      remaining: limit,
      allowed: true,
      message: 'Usage check OK (mock)',
    };
  }

  try {
    // Get current month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.error('Error checking usage limit:', error);
      // Fail open - allow request if we can't check
      return {
        tier: userTier,
        limit,
        used: 0,
        remaining: limit,
        allowed: true,
        message: 'Usage check unavailable (failing open)',
      };
    }

    const used = count || 0;
    const remaining = Math.max(0, limit - used);

    return {
      tier: userTier,
      limit,
      used,
      remaining,
      allowed: used < limit,
      message:
        used < limit
          ? `${remaining} analyses remaining this month`
          : 'Analysis limit reached for this month. Upgrade to continue.',
    };
  } catch (error) {
    console.error('Unexpected error checking usage limit:', error);
    // Fail open
    return {
      tier: userTier,
      limit: 5,
      used: 0,
      remaining: 5,
      allowed: true,
      message: 'Usage check unavailable (failing open)',
    };
  }
}

/**
 * Get usage statistics for user
 */
export async function getUsageStats(userId: string): Promise<{
  thisMonth: {
    totalCost: number;
    analysisCount: number;
    byProvider: Record<string, { count: number; cost: number }>;
  };
  allTime: {
    totalCost: number;
    analysisCount: number;
  };
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      thisMonth: { totalCost: 0, analysisCount: 0, byProvider: {} },
      allTime: { totalCost: 0, analysisCount: 0 },
    };
  }

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthResponse = await supabase.from('ai_usage').select('cost, provider').eq('user_id', userId).gte('created_at', startOfMonth.toISOString());
    const monthData = (monthResponse as any)?.data || [];

    const allResponse = await supabase.from('ai_usage').select('cost, provider').eq('user_id', userId);
    const allData = (allResponse as any)?.data || [];
    
    const monthByProvider: Record<string, { count: number; cost: number }> = {};
    let monthTotal = 0;
    let monthCount = 0;

    (monthData || []).forEach((item: any) => {
      monthTotal += item.cost || 0;
      monthCount += 1;
      if (!monthByProvider[item.provider]) {
        monthByProvider[item.provider] = { count: 0, cost: 0 };
      }
      monthByProvider[item.provider].count += 1;
      monthByProvider[item.provider].cost += item.cost || 0;
    });

    let allTotal = 0;
    let allCount = 0;

    (allData || []).forEach((item: any) => {
      allTotal += item.cost || 0;
      allCount += 1;
    });

    return {
      thisMonth: {
        totalCost: monthTotal,
        analysisCount: monthCount,
        byProvider: monthByProvider,
      },
      allTime: {
        totalCost: allTotal,
        analysisCount: allCount,
      },
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      thisMonth: { totalCost: 0, analysisCount: 0, byProvider: {} },
      allTime: { totalCost: 0, analysisCount: 0 },
    };
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return '$0.00';
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Get provider cost estimate
 */
export function estimateCost(
  provider: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): number {
  const costs = PROVIDER_COSTS[provider as keyof typeof PROVIDER_COSTS];
  if (!costs) return 0;

  return (
    estimatedInputTokens * costs.input +
    estimatedOutputTokens * costs.output
  );
}

/**
 * Tier pricing information
 */
export const TIER_PRICING = {
  free: {
    monthlyPrice: 0,
    analysisLimit: 25,
    features: ['Self-assessment', 'Basic practice questions'],
  },
  pro: {
    monthlyPrice: 19,
    analysisLimit: 200,
    features: [
      'Self-assessment',
      'Interview practice',
      'Skill gap analysis',
      'Learning recommendations',
    ],
  },
  premium: {
    monthlyPrice: 49,
    analysisLimit: 1000,
    features: [
      'Everything in Pro',
      'Unlimited practice sessions',
      'Advanced coaching',
      'Progress analytics',
    ],
  },
  coach: {
    monthlyPrice: 99,
    analysisLimit: 1200,
    features: ['Everything in Premium', '1:1 coaching support', 'Priority access'],
  },
};

export async function trackUsage(
  _userId: string,
  task: string,
  _tokens: number,
  _costUSD: number
): Promise<void> {
  console.log(`Usage tracked: ${task}`);
}

export async function checkUsageLimit(
  _userId: string,
  _tier: string
): Promise<boolean> {
  return true;
}
