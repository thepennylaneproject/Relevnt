// At top
import OpenAI from 'openai'

export interface OpenAIOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  forceJson?: boolean
}

export interface OpenAIResponse {
  success: boolean
  content?: string
  cost?: number
  usage?: { inputTokens: number; outputTokens: number }
  error?: string
}

export async function callOpenAI(
  prompt: string,
  systemPrompt: string,
  options: OpenAIOptions = {}
): Promise<OpenAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { success: false, error: 'OPENAI_API_KEY not configured' }
  }

  const client = new OpenAI({ apiKey })
  try {
    const completion = await client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens,
      response_format: options.forceJson ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    })

    const choice = completion.choices[0]
    const content = choice?.message?.content || ''
    const inputTokens = completion.usage?.prompt_tokens || 0
    const outputTokens = completion.usage?.completion_tokens || 0
    const cost = estimateOpenAICost(options.model || 'gpt-4o-mini', inputTokens, outputTokens)

    return {
      success: true,
      content,
      cost,
      usage: { inputTokens, outputTokens },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'OpenAI call failed',
    }
  }
}

function estimateOpenAICost(model: string, inputTokens: number, outputTokens: number) {
  const pricingPer1k: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
  }
  const fallback = { input: 0.002, output: 0.006 }
  const pricing = pricingPer1k[model] || fallback
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output
}
