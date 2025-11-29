// src/services/aiClient.ts

import type { AITaskResponse, TaskName } from '../types/ai-responses.types'

export interface AIClientOptions {
  baseUrl?: string
}

/**
 * Very small client that just calls the Netlify AI function.
 * No per-task config, so it cannot throw "reading 'analyze-resume'" anymore.
 */
class AIClient {
  private token: string | null = null
  private baseUrl: string

  constructor(opts?: AIClientOptions) {
    this.baseUrl = opts?.baseUrl || '/.netlify/functions/ai'
  }

  setToken(token: string) {
    this.token = token
  }

  async call(params: {
    task: TaskName
    input: unknown
    voiceProfile?: unknown
    taskType?: unknown
    systemPrompt?: string
  }): Promise<AITaskResponse> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`AI endpoint error ${res.status}: ${text}`)
    }

    const data = await res.json()
    return data as AITaskResponse
  }
}

let singleton: AIClient | null = null

export const getAIClient = (opts?: AIClientOptions): AIClient => {
  if (!singleton) {
    singleton = new AIClient(opts)
  }
  return singleton
}