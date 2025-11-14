/**
 * Google Gemini Provider for Relevnt AI System
 * 
 * Handles Google Gemini API calls with proper error handling and cost tracking
 */

export interface GoogleGeminiOptions {
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  model?: string
}

export interface GoogleGeminiResponse {
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
 * Call Google Gemini API
 */
export async function callGoogleGemini(
  model: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: GoogleGeminiOptions = {}
): Promise<GoogleGeminiResponse> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return {
      success: false,
      content: '',
      error: 'GOOGLE_API_KEY not configured',
    }
  }

  const maxTokens = options.maxTokens || 2000
  const temperature = options.temperature || 0.7

  try {
    // Format messages for Gemini API
    const contents = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: temperature,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Gemini API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // Extract content from response
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const usageData = data.usageMetadata || {}
    const inputTokens = usageData.promptTokenCount || 0
    const outputTokens = usageData.candidatesTokenCount || 0

    // Calculate cost: Gemini 1.5 Flash pricing
    // Input: $0.075/1M tokens
    // Output: $0.3/1M tokens
    const inputCost = (inputTokens / 1000000) * 0.075
    const outputCost = (outputTokens / 1000000) * 0.3
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

export default { callGoogleGemini }