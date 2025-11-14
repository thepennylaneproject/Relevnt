/**
 * AI ROUTER - FIXED VERSION
 * Intelligent routing system with proper TypeScript typing
 */

import { getTask, canAccessTask } from './ai-integrations-map';
import { stripPII } from './utils/privacy';
import { trackUsage, checkUsageLimit } from './utils/cost-tracking';

// Import providers with proper error handling
import { callDeepSeek } from './providers/deepseek';
import { callOpenAI } from './providers/openai';
import { callAnthropic } from './providers/anthropic';
import { callGoogleGemini } from './providers/google';
import { searchBrave } from './providers/brave';
import { searchTavily } from './providers/tavily';
import { processLocal } from './providers/local';

interface AIRequest {
  task: string;
  input: any;
  userId: string;
  tier: 'starter' | 'pro' | 'premium';
  options?: {
    maxTokens?: number;
    temperature?: number;
    stripPII?: boolean;
    systemPrompt?: string;
  };
}

interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  provider?: string;
  costEstimate?: number;
  tokensUsed?: number;
}

/**
 * Route AI request to appropriate provider
 * Uses type-safe getTask() helper
 */
export async function routeAIRequest(request: AIRequest): Promise<AIResponse> {
  const { task, input, userId, tier, options = {} } = request;

  // 1. Validate task exists (TYPE SAFE)
  const taskConfig = getTask(task);
  if (!taskConfig) {
    return {
      success: false,
      error: `Unknown AI task: ${task}`,
    };
  }

  // 2. Check if user's tier allows this task
  if (!canAccessTask(tier, task)) {
    return {
      success: false,
      error: `Task "${task}" not available on ${tier} tier. Upgrade to access this feature.`,
    };
  }

  // 3. Check usage limits
  const limitCheck = await checkUsageLimit(userId, tier);
  if (!limitCheck) {  // ✅ FIXED: Just check boolean, don't access .allowed
    return {
      success: false,
      error: `Monthly AI usage limit reached. ${tier === 'starter' ? 'Upgrade to Pro for more requests.' : 'Limit resets next month.'
        }`,
    };
  }

  // 4. Strip PII if requested (default: true)
  let processedInput = input;
  if (options.stripPII !== false) {
    processedInput = await stripPII(input);
  }

  // 5. Select provider based on tier
  const providerKey = taskConfig.providers[tier as keyof typeof taskConfig.providers];
  if (!providerKey) {
    return {
      success: false,
      error: `No provider configured for task "${task}" on ${tier} tier`,
    };
  }

  // 6. Attempt to call provider with fallback chain
  const fallbackChain = taskConfig.fallbackChain;
  let lastError: string = '';

  for (const provider of fallbackChain) {
    try {
      console.log(`Attempting ${task} with provider: ${provider}`);

      const result = await callProvider(provider, processedInput, options);

      if (result.success) {
        // ✅ FIXED: trackUsage takes 4 params: userId, task, tokens, costUSD
        // Provider is included in the task name
        await trackUsage(
          userId,
          `${task}:${provider}`,  // Include provider in task name
          result.tokensUsed || 0,
          result.costEstimate || 0
        );

        return {
          success: true,
          data: result.data,
          provider,
          costEstimate: result.costEstimate,
          tokensUsed: result.tokensUsed,
        };
      }

      lastError = result.error || 'Unknown error';
    } catch (error) {
      console.error(`Provider ${provider} failed:`, error);
      lastError = error instanceof Error ? error.message : 'Provider error';
      continue;
    }
  }
  return {
    success: false,
    error: `All providers failed. Last error: ${lastError}`,
  };
}

/**
 * Call specific AI provider
 * ✅ FIXED: Correct function signatures for each provider
 */
async function callProvider(
  provider: string,
  input: any,
  options: any
): Promise<AIResponse> {
  try {
    switch (provider) {
      case 'deepseek':
        const deepseekResult = await callDeepSeek(input, options.systemPrompt || 'You are a helpful assistant');
        return {
          success: true,
          data: deepseekResult,
          tokensUsed: 0, // Track if available
          costEstimate: 0,
        };

      // ✅ FIXED: callOpenAI takes (prompt, systemPrompt)
      case 'openai-gpt4':
      case 'extract-resume':
      case 'optimize-resume':
      case 'generate-cover-letter':
        const openaiResult = await callOpenAI(
          input,
          options.systemPrompt || 'You are a helpful career assistant.'
        );
        return {
          success: true,
          data: openaiResult,
          tokensUsed: 0,
          costEstimate: 0,
        };

      case 'anthropic-sonnet4':
        const anthropicResult = await callAnthropic(
          input,
          options.systemPrompt || 'You are a helpful career assistant.'
        );
        return {
          success: true,
          data: anthropicResult,
          tokensUsed: 0,
          costEstimate: 0,
        };

      case 'google-gemini':
        const geminiResult = await callGoogleGemini(
          input,
          options.systemPrompt || 'You are a helpful career assistant.'
        );
        return {
          success: true,
          data: geminiResult,
          tokensUsed: 0,
          costEstimate: 0,
        };

      case 'brave':
        const braveResult = await searchBrave(input);
        return {
          success: true,
          data: braveResult,
          tokensUsed: 0,
          costEstimate: 0,
        };

      case 'tavily':
        const tavilyResult = await searchTavily(input);
        return {
          success: true,
          data: tavilyResult,
          tokensUsed: 0,
          costEstimate: 0,
        };

      case 'local':
        const localResult = await processLocal(input, options);
        return {
          success: true,
          data: localResult,
          tokensUsed: 0,
          costEstimate: 0,
        };

      default:
        return {
          success: false,
          error: `Unknown provider: ${provider}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Provider call failed',
    };
  }
}

/**
 * Batch process multiple AI requests
 */
export async function batchAIRequests(requests: AIRequest[]): Promise<AIResponse[]> {
  return Promise.all(requests.map(req => routeAIRequest(req)));
}

/**
 * Get estimated cost for a task
 */
export function estimateTaskCost(task: string, tier: 'starter' | 'pro' | 'premium'): number {
  const taskConfig = getTask(task);
  if (!taskConfig) return 0;

  return taskConfig.estimatedCost[tier as keyof typeof taskConfig.estimatedCost] || 0;}