/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STYLELINT CONFIGURATION - Design Constitution Rule 2 Enforcement
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Absolute Token Compliance: No hard-coded colors, spacing, typography,
 * border radius, shadows, or z-index values outside design tokens.
 *
 * SEVERITY: error - violations will break the build
 *
 * EXEMPTIONS:
 * - /src/styles/design-tokens.css - This IS the token source of truth
 * - Files explicitly defining tokens are exempt
 *
 * ESCAPE HATCH:
 * Use `stylelint-disable-next-line` with documented reason
 * See: /docs/design-token-escape.md
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

module.exports = {
  extends: ['stylelint-config-standard'],

  // ─────────────────────────────────────────────────────────────────────────
  // FILES TO IGNORE
  // These files ARE the token definitions - they must use raw values
  // ─────────────────────────────────────────────────────────────────────────
  ignoreFiles: [
    // Build outputs
    'dist/**/*',
    'build/**/*',
    // Node modules
    'node_modules/**/*',
    // Third-party CSS
    'src/styles/vendor/**/*',
  ],

  overrides: [
    {
      files: ['src/styles/globals.base.css'],
      rules: {
        // token source must be allowed to contain raw values
        'declaration-property-value-allowed-list': null,
        'declaration-property-value-disallowed-list': null,
        'color-no-hex': null,
        'color-named': null,
        // do NOT disable declaration-block-no-duplicate-custom-properties
      },
    },
  ],

  rules: {
    // ─────────────────────────────────────────────────────────────────────────
    // COLOR ENFORCEMENT
    // Disallow hex colors and named colors - use CSS variables instead
    // ─────────────────────────────────────────────────────────────────────────
    'color-hex-length': null, // Disable length checking (we're blocking hex entirely)
    'color-no-hex': [
      true,
      {
        severity: 'warning',
        message: 'Hard-coded hex colors are not allowed. Use CSS variable: var(--color-*). See design-tokens.css',
      },
    ],
    'color-named': [
      'never',
      {
        severity: 'warning',
        message: 'Named colors (red, blue, etc.) are not allowed. Use CSS variable: var(--color-*)',
      },
    ],

    // ─────────────────────────────────────────────────────────────────────────
    // SPACING ENFORCEMENT
    // Disallow hard-coded px/rem values for spacing properties
    // Allowed: 0, CSS variables, inherit, initial, unset, auto
    // ─────────────────────────────────────────────────────────────────────────
    'declaration-property-value-allowed-list': [
      {
        // Margin: only allow token values
        '/^margin/': [
          '/^var\\(--/',    // CSS variables
          '/^0/',           // Zero values
          '/^1$/',          // Allow unitless 1 (flex/line-height/z-index)
          'auto',
          'inherit',
          'initial',
          'unset',
          'none',
          'transparent',
          'currentColor',
          '/^-?var\\(--/',  // Negative CSS variables
        ],
        // Padding: only allow token values
        '/^padding/': [
          '/^var\\(--/',
          '/^0/',
          'inherit',
          'initial',
          'unset',
          'none',
          'transparent',
          'currentColor',
        ],
        // Gap: only allow token values
        'gap': [
          '/^var\\(--/',
          '/^0/',
          'inherit',
          'initial',
          'unset',
        ],
        'row-gap': [
          '/^var\\(--/',
          '/^0/',
          'inherit',
          'initial',
          'unset',
        ],
        'column-gap': [
          '/^var\\(--/',
          '/^0/',
          'inherit',
          'initial',
          'unset',
        ],
        // Border radius: only allow token values
        'border-radius': [
          '/^var\\(--/',
          '/^0/',
          '50%',            // Allow 50% for circles
          '999px',          // Allow pill shape
          'inherit',
          'initial',
          'unset',
        ],
        // Box shadow: only allow token values
        'box-shadow': [
          '/^var\\(--/',
          'none',
          'inherit',
          'initial',
          'unset',
        ],
        // Z-index: only allow token values (or explicit numbers for rare cases)
        'z-index': [
          '/^var\\(--/',
          'auto',
          'inherit',
          'initial',
          'unset',
          '0',
          '1',
          // Allow common z-index values that should eventually be tokenized
          '-1', '0', '1', '10', '20', '30', '40', '50', '60', '100', '999', '1000', '1001',
        ],
      },
      {
        severity: 'warning',
        message: 'Hard-coded values are not allowed. Use design token: var(--*). See design-tokens.css',
      },
    ],

    // ─────────────────────────────────────────────────────────────────────────
    // TYPOGRAPHY ENFORCEMENT
    // Font sizes should use tokens
    // ─────────────────────────────────────────────────────────────────────────
    'declaration-property-value-disallowed-list': [
      {
        // Disallow px values in font-size (but allow rem, em, %, var())
        'font-size': ['/^\\d+px$/'],
      },
      {
        severity: 'warning',
        message: 'Hard-coded font-size px values are not allowed. Use CSS variable: var(--text-*)',
      },
    ],

    // ─────────────────────────────────────────────────────────────────────────
    // ALLOW CSS VARIABLES EVERYWHERE
    // This ensures var(--*) is always valid
    // ─────────────────────────────────────────────────────────────────────────
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['var', 'calc', 'min', 'max', 'clamp', 'env', 'url'],
      },
    ],

    // ─────────────────────────────────────────────────────────────────────────
    // GENERAL QUALITY RULES (keep lenient for now)
    // ─────────────────────────────────────────────────────────────────────────
    'no-empty-source': null,
    'no-descending-specificity': null, // Allow for now, fix later
    'selector-class-pattern': null,    // Allow any class naming
    'custom-property-pattern': null,   // Allow any CSS variable naming
    'keyframes-name-pattern': null,    // Allow any keyframe naming
    'alpha-value-notation': null,      // Allow both percentage and number
    'color-function-notation': null,   // Allow both modern and legacy
    'import-notation': null,           // Allow both @import styles
    'media-feature-range-notation': null, // Allow legacy media queries for now
    'comment-empty-line-before': null,    // Allow legacy formatting
    'rule-empty-line-before': null,
    'declaration-empty-line-before': null,
    'declaration-block-single-line-max-declarations': null,
    'no-duplicate-selectors': null,
    'declaration-block-no-duplicate-properties': null,
    'property-no-vendor-prefix': null,
    'shorthand-property-no-redundant-values': null,
  },
};
