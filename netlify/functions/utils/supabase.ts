/**
 * ============================================================================
 * SUPABASE CLIENT UTILITIES
 * ============================================================================
 * Provides both admin and authenticated Supabase clients for backend functions
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

/**
 * Create admin client with full access
 * Used for backend functions that need to bypass RLS
 */
export function createAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      'Supabase credentials not configured. Using mock client for testing.'
    );
    return createMockClient();
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Create authenticated client using JWT token
 * Used for user-specific operations
 */
export function createAuthenticatedClient(token: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Using mock client.');
    return createMockClient();
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Create mock client for testing/development
 */
export function createMockClient() {
  const createMockQueryBuilder = () => ({
    // Chain-supporting methods
    select: function (_columns?: string) {  // Underscore = intentionally unused
      return this;
    },
    insert: function (_data: unknown) {
      return this;
    },
    update: function (_data: unknown) {
      return this;
    },
    delete: function () {
      return this;
    },

    // Filter methods
    eq: function (_column: string, _value: unknown) {
      return this;
    },
    neq: function (_column: string, _value: unknown) {
      return this;
    },
    gte: function (_column: string, _value: unknown) {
      return this;
    },
    lte: function (_column: string, _value: unknown) {
      return this;
    },
    gt: function (_column: string, _value: unknown) {
      return this;
    },
    lt: function (_column: string, _value: unknown) {
      return this;
    },
    in: function (_column: string, _value: unknown) {
      return this;
    },

    // Modifier methods
    limit: function (_count: number) {
      return this;
    },
    single: function () {
      return this;
    },
    order: function (_column: string, _options?: unknown) {
      return this;
    },

    // Make it thenable
    then: function (callback: (value: unknown) => unknown) {
      return Promise.resolve({ data: null, error: null }).then(callback);
    },
  });

  return {
    from: () => createMockQueryBuilder(),
    auth: {
      getUser: async () => ({ data: { user: null } }),
      getSession: async () => ({ data: { session: null } }),
    },
  };
}