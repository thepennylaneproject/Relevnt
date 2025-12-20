/**
 * ============================================================================
 * AI CLIENT - HTTP COMMUNICATION WITH BACKEND
 * ============================================================================
 * Handles all communication with Netlify Functions AI endpoints
 * Integrates unified voice engine for consistent user voice across all AI tasks
 * ============================================================================
 */

import { AIResponse } from './aiTypes';
import {
  buildUserVoiceSystemPrompt,
  UserVoiceProfile,
  VoiceTaskType,
  VoicePromptOptions,
} from '../lib/voicePrompt';

export interface AICallOptions {
  task: string;
  input?: string;

  // Voice engine integration
  voiceProfile?: UserVoiceProfile;
  taskType?: VoiceTaskType;
  systemPrompt?: string; // Manual override if needed

  // Other parameters
  [key: string]: unknown;
}

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
   * Execute an AI task via the backend with optional voice profile integration
   */
  async call<T = unknown>(options: AICallOptions): Promise<AIResponse<T>> {
    const url = `${this.baseUrl}/ai`;

    const {
      task,
      input,
      voiceProfile,
      taskType,
      systemPrompt: manualSystemPrompt,
      ...otherOptions
    } = options;

    // Build system prompt from voice profile if provided
    let systemPrompt = manualSystemPrompt;

    if (voiceProfile && !systemPrompt) {
      const voiceOptions: VoicePromptOptions = taskType ? { taskType } : {};
      systemPrompt = buildUserVoiceSystemPrompt(voiceProfile, voiceOptions);
    }

    // Prepare request data
    const requestData = {
      task,
      input,
      systemPrompt, // Pass system prompt to backend
      ...otherOptions,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: JSON.stringify(requestData),
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
   * Execute a task with just task name and input (legacy method)
   * For voice-aware tasks, use call() with voiceProfile instead
   */
  async executeTask(
    taskName: string,
    input: string,
    options?: Record<string, unknown>
  ): Promise<AIResponse> {
    return this.call({ task: taskName, input, ...options });
  }

  /**
   * Execute a task with voice profile integration
   */
  async executeWithVoice<T = unknown>(
    taskName: string,
    input: string,
    voiceProfile: UserVoiceProfile,
    taskType: VoiceTaskType,
    additionalOptions?: Record<string, unknown>
  ): Promise<AIResponse<T>> {
    return this.call<T>({
      task: taskName,
      input,
      voiceProfile,
      taskType,
      ...additionalOptions,
    });
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