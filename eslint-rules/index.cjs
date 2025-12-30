/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT ESLINT PLUGIN - Design System Rules
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Custom ESLint rules for enforcing design system compliance.
 *
 * Rules:
 * - no-hardcoded-styles: Flags inline styles with hard-coded visual values
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const noHardcodedStyles = require('./no-hardcoded-styles.cjs');

module.exports = {
  meta: {
    name: 'eslint-plugin-relevnt-design',
    version: '1.0.0',
  },
  rules: {
    'no-hardcoded-styles': noHardcodedStyles,
  },
};
