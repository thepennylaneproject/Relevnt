/**
 * API Utility - Centralized fetch wrapper for all backend calls
 * 
 * 🎓 LEARNING NOTE: This pattern keeps API logic in one place,
 * making it easier to add auth, error handling, retry logic, etc.
 */

export interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  token?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * Make an API request with automatic auth and error handling
 * 
 * Usage:
 *   const result = await api<JobMatch[]>('/.netlify/functions/ai', {
 *     method: 'POST',
 *     body: { task: 'match-jobs', input: { ... } },
 *     token: authToken,
 *   });
 */
export async function api<T = unknown>(
  endpoint: string,
  options: APIRequestOptions = {}
): Promise<APIResponse<T>> {
  const { method = 'GET', token, body } = options;

  try {
    // FIX: Properly type headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // FIX: Add auth token if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
      status: 0,
    };
  }
}

/**
 * Fetch helper specifically for AI tasks
 */
export async function callAITask<T = unknown>(
  taskName: string,
  input: unknown,
  token: string
): Promise<T> {
  const response = await api('/.netlify/functions/ai', {
    method: 'POST',
    body: { task: taskName, input },
    token,
  });

  if (!response.success) {
    throw new Error(response.error || 'AI task failed');
  }

  return response.data as T;
}