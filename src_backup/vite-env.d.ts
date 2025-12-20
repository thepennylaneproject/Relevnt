/**
 * ðŸŽ" LEARNING NOTE: Vite needs type definitions for import.meta.env
 * This file tells TypeScript about all environment variables available at build time
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}