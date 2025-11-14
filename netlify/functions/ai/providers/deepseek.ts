/**
 * DeepSeek Provider for Relevnt AI System
 * 
 * Handles DeepSeek API calls with proper error handling and cost tracking
 * DeepSeek is the primary provider for cost optimization
 */

export interface DeepSeekOptions {
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  model?: string
}

export interface DeepSeekResponse {
  success: boolean
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  cost?: number
  error?: string
}

/**
 * Call DeepSeek API
 * 
 * DeepSeek offers exceptional value:
 * - Input: $0.14/1M tokens
 * - Output: $0.28/1M tokens
 * - Much cheaper than competitors while maintaining quality
 */
export async function callDeepSeek(
  model: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: DeepSeekOptions = {}
): Promise<DeepSeekResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return {
      success: false,
      content: '',
      error: 'DEEPSEEK_API_KEY not configured',
    }
  }

  const systemPrompt = options.systemPrompt || 'You are a helpful assistant.'
  const maxTokens = options.maxTokens || 2000
  const temperature = options.temperature || 0.7

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // Extract content from response
    const content = data.choices[0]?.message?.content || ''
    const inputTokens = data.usage?.prompt_tokens || 0
    const outputTokens = data.usage?.completion_tokens || 0

    // Calculate cost: DeepSeek pricing (very affordable)
    // Input: $0.14/1M tokens
    // Output: $0.28/1M tokens
    const inputCost = (inputTokens / 1000000) * 0.14
    const outputCost = (outputTokens / 1000000) * 0.28
    const totalCost = inputCost + outputCost

    return {
      success: true,
      content,
      usage: {
        inputTokens,
        outputTokens,
      },
      cost: totalCost,
    }
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export default { callDeepSeek }