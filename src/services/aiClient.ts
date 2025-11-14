/**
 * ============================================================================
 * AI CLIENT - HTTP COMMUNICATION WITH BACKEND
 * ============================================================================
 * Handles all communication with Netlify Functions AI endpoints
 * ============================================================================
 */

import { AIResponse } from './aiTypes';

export class AIClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/.netlify/functions') {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token for requests
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Execute an AI task via the backend
   */
  async call<T = unknown>(
    data: {
      task: string;
      input?: string;
      [key: string]: unknown;
    }
  ): Promise<AIResponse<T>> {
    const url = `${this.baseUrl}/ai`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`AI task failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result as AIResponse<T>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message,
      } as AIResponse<T>;
    }
  }

  /**
   * Execute a task with just task name and input
   */
  async executeTask(
    taskName: string,
    input: string,
    options?: Record<string, unknown>
  ): Promise<AIResponse> {
    return this.call({ task: taskName, input, ...options });
  }
}

let client: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!client) {
    client = new AIClient();
  }
  return client;
}

export function setAIClient(newClient: AIClient): void {
  client = newClient;
}