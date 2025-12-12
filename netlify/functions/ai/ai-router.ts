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
import { callAimlApi, AimlApiMessage } from './providers/aimlapi';

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

  // Special handling for extract-resume to inject the correct system prompt if not provided
  if (task === 'extract-resume' && !options.systemPrompt) {
    options.systemPrompt = `
You are a deterministic resume parsing engine.

Convert the raw resume text into a SINGLE JSON object with this exact shape:

{
  "fullName": string,
  "email": string,
  "phone": string,
  "location": string,
  "summary": string,
  "skills": string[],
  "experience": [
    {
      "title": string,
      "company": string,
      "location": string,
      "startDate": string,
      "endDate": string,
      "current": boolean,
      "bullets": string[]
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string,
      "fieldOfStudy": string,
      "startDate": string,
      "endDate": string
    }
  ],
  "certifications": [
    {
      "name": string,
      "issuer": string,
      "year": string
    }
  ],
  "brainstorming": {
    "suggestedSkills": string[],
    "alternateTitles": string[],
    "relatedKeywords": string[],
    "positioningNotes": string
  }
}

Rules:
- If something is missing in the resume, use an empty string or an empty array, not null.
- "skills" must be SHORT skill phrases, not full bullet sentences.
- "experience" must capture each job separately, including bullets where possible.
- "education" should list degrees, licenses, or formal training.
- "certifications" should list named certifications, licenses, or credentials.
- Do NOT invent jobs, schools, or certifications. Use best-effort extraction only.
- The "brainstorming" block is OPTIONAL. You may fill it with ideas that could help the candidate, or leave arrays empty.
- Output MUST be valid JSON. No comments, no markdown, no extra text.
`.trim();
  }

  for (const provider of fallbackChain) {
    try {
      console.log(`Attempting ${task} with provider: ${provider}`);

      const result = await callProvider(provider, task, processedInput, options);

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
  task: string,
  input: any,
  options: any
): Promise<AIResponse> {
  try {
    switch (provider) {
      // AIMLAPI - primary provider for resume extraction (50% cost savings)
      case 'aimlapi':
        const aimlMessages: AimlApiMessage[] = [
          { role: 'system', content: options.systemPrompt || 'You are a helpful career assistant.' },
          { role: 'user', content: typeof input === 'string' ? input : JSON.stringify(input) }
        ];

        // Use a capable model for extraction
        const aimlResult = await callAimlApi('gpt-4o-mini', aimlMessages, 0.1, 4000);

        if (!aimlResult.success) {
          return {
            success: false,
            error: aimlResult.error || 'AIMLAPI call failed',
            tokensUsed: 0,
            costEstimate: 0,
          };
        }

        // Parse JSON for structured response tasks
        let parsedAimlData: any = aimlResult.content;
        if (task === 'extract-resume') {
          try {
            let cleanedResult = aimlResult.content.trim();
            if (cleanedResult.startsWith('```json')) {
              cleanedResult = cleanedResult.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedResult.startsWith('```')) {
              cleanedResult = cleanedResult.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            parsedAimlData = JSON.parse(cleanedResult);
            console.log('✅ Successfully parsed AIMLAPI JSON response for extract-resume');
          } catch (parseError) {
            console.error('❌ Failed to parse AIMLAPI response as JSON:', parseError);
            console.error('Raw AIMLAPI response:', aimlResult.content);
            return {
              success: false,
              error: 'AI returned invalid JSON. Please try again.',
              tokensUsed: 0,
              costEstimate: 0,
            };
          }
        }

        return {
          success: true,
          data: parsedAimlData,
          tokensUsed: 0,
          costEstimate: 0,
        };

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

        // Parse JSON for structured response tasks
        let parsedData = openaiResult;
        if (task === 'extract-resume') {
          try {
            // Clean the response - remove markdown code blocks if present
            let cleanedResult = openaiResult.trim();
            if (cleanedResult.startsWith('```json')) {
              cleanedResult = cleanedResult.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedResult.startsWith('```')) {
              cleanedResult = cleanedResult.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            parsedData = JSON.parse(cleanedResult);
            console.log('✅ Successfully parsed AI JSON response for extract-resume');
          } catch (parseError) {
            console.error('❌ Failed to parse AI response as JSON:', parseError);
            console.error('Raw AI response:', openaiResult);
            return {
              success: false,
              error: 'AI returned invalid JSON. Please try again.',
              tokensUsed: 0,
              costEstimate: 0,
            };
          }
        }

        return {
          success: true,
          data: parsedData,
          tokensUsed: 0,
          costEstimate: 0,
        };

      case 'anthropic-sonnet4':
        const anthropicResult = await callAnthropic(
          input,
          options.systemPrompt || 'You are a helpful career assistant.'
        );

        // Parse JSON for structured response tasks
        let parsedAnthropicData = anthropicResult;
        if (task === 'extract-resume') {
          try {
            // Clean the response - remove markdown code blocks if present
            let cleanedResult = String(anthropicResult).trim();
            if (cleanedResult.startsWith('```json')) {
              cleanedResult = cleanedResult.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedResult.startsWith('```')) {
              cleanedResult = cleanedResult.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            parsedAnthropicData = JSON.parse(cleanedResult);
            console.log('✅ Successfully parsed Anthropic JSON response for extract-resume');
          } catch (parseError) {
            console.error('❌ Failed to parse Anthropic response as JSON:', parseError);
            console.error('Raw Anthropic response:', anthropicResult);
            return {
              success: false,
              error: 'AI returned invalid JSON. Please try again.',
              tokensUsed: 0,
              costEstimate: 0,
            };
          }
        }

        return {
          success: true,
          data: parsedAnthropicData,
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

  return taskConfig.estimatedCost[tier as keyof typeof taskConfig.estimatedCost] || 0;
}