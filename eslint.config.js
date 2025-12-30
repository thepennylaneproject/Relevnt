/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ESLINT CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Includes Design Constitution Rule 2 enforcement:
 * - relevnt-design/no-hardcoded-styles: Warns on inline styles with hard-coded values
 *
 * Escape hatch: Add comment before style prop:
 *   // token-escape: <reason>
 *   style={{ color: '#fff' }}
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import { createRequire } from 'module'

// Load custom design system rules
const require = createRequire(import.meta.url)
const relevntDesignPlugin = require('./eslint-rules/index.cjs')

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      'relevnt-design': relevntDesignPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // ─────────────────────────────────────────────────────────────────────
      // Design Constitution Rule 2: Absolute Token Compliance
      // Inline styles must use design tokens (CSS variables)
      // ─────────────────────────────────────────────────────────────────────
      'relevnt-design/no-hardcoded-styles': 'warn',
    },
  },
])
