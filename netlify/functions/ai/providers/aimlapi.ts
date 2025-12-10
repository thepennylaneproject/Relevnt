// providers/aimlapi.ts
// Helper for calling AI/ML API (chat/completion endpoint) from Node.js / TypeScript
// Requires AIMLAPI_API_KEY in env vars.
// Based on AI/ML API docs at https://docs.aimlapi.com/quickstart/setting-up  [oai_citation:0‡AI/ML API Documentation](https://docs.aimlapi.com/quickstart/setting-up?utm_source=chatgpt.com)

export interface AimlApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AimlApiResponse {
  success: boolean;
  content: string;
  error?: string;
}

export async function callAimlApi(
  model: string,
  messages: AimlApiMessage[],
  temperature = 0.2,
  max_tokens = 512
): Promise<AimlApiResponse> {
  const apiKey = process.env.AIMLAPI_API_KEY;
  if (!apiKey) {
    return { success: false, content: '', error: 'AIMLAPI_API_KEY not set' };
  }

  const url = 'https://api.aimlapi.com/v1/chat/completions';

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { success: false, content: '', error: `HTTP ${resp.status}: ${text}` };
    }

    const data = await resp.json() as any;

    const choices = data?.choices;
    if (!choices || !Array.isArray(choices) || choices.length === 0) {
      return { success: false, content: '', error: 'No choices returned' };
    }

    // If API returns messages (chat format)
    const msg = choices[0].message?.content ?? choices[0].text;
    if (typeof msg !== 'string') {
      return { success: false, content: '', error: 'Invalid response format' };
    }

    return { success: true, content: msg };
  } catch (err) {
    return {
      success: false,
      content: '',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}