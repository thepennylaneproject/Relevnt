/**
 * Anthropic Provider for Relevnt AI System
 * 
 * Handles Claude API calls with proper error handling and cost tracking
 */

export interface AnthropicOptions {
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  model?: string
}

export interface AnthropicResponse {
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
 * Call Anthropic Claude API
 */
export async function callAnthropic(
  model: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: AnthropicOptions = {}
): Promise<AnthropicResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      success: false,
      content: '',
      error: 'ANTHROPIC_API_KEY not configured',
    }
  }

  const systemPrompt = options.systemPrompt || 'You are a helpful assistant.'
  const maxTokens = options.maxTokens || 2000

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // Extract content from response
    const content = data.content[0]?.text || ''
    const inputTokens = data.usage?.input_tokens || 0
    const outputTokens = data.usage?.output_tokens || 0

    // Calculate cost: $3/1M input, $15/1M output (Sonnet 4)
    const inputCost = (inputTokens / 1000000) * 3
    const outputCost = (outputTokens / 1000000) * 15
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

export default { callAnthropic }