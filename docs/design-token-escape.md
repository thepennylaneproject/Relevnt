# Design Token Escape Hatch Policy

> **Design Constitution Rule 2**: Absolute Token Compliance

This document defines when and how hard-coded visual values may be used outside the design token system.

## The Rule

**All visual values must use design tokens.**

This includes:
- Colors (use `var(--color-*)`)
- Spacing (use `var(--space-*)`)
- Typography (use `var(--text-*)`, `var(--font-*)`)
- Border radius (use `var(--radius-*)`)
- Shadows (use `var(--shadow-*)`)
- Z-index (use `var(--z-*)` or Tailwind's z-index tokens)

## When Escapes Are Allowed

Escapes are permitted only in these rare cases:

### 1. Third-Party Library Integration
When integrating a third-party library that requires specific values.

### 2. One-Off Animations
Keyframe animations that use intermediate values not worth tokenizing.

### 3. Truly Unique Components
Components with visual requirements that genuinely don't fit the token system (extremely rare).

### 4. Browser Compatibility Hacks
Fallback values for browsers that don't support CSS variables.

### 5. Performance-Critical Paths
Where CSS variable lookups measurably impact performance (very rare).

## Escape Hatch Formats

### CSS Files (Stylelint)

```css
/* stylelint-disable-next-line color-no-hex -- third-party chart library requirement */
.chart-axis { color: #666; }
```

### Inline Styles (ESLint)

```tsx
// token-escape: Animation keyframe intermediate value
const animationStyle = { opacity: 0.5 };
```

### Tailwind Arbitrary Values

```tsx
{/* Escape: Browser-specific webkit override */}
<div className="bg-[var(--color-surface)] [-webkit-backdrop-filter:blur(10px)]">
```

## Required Format

Every escape must include:

1. **The escape comment** (one of the formats above)
2. **A reason** explaining why tokens can't be used
3. **Expectation of removal** - escapes are temporary by default

## Escape Audit Process

1. Escapes are tracked via lint warnings (not errors)
2. During code review, escapes must be justified
3. Quarterly audit of all escapes to evaluate if they can be removed
4. New tokens can be added if patterns emerge

## Adding New Tokens

If you find yourself needing the same escape repeatedly:

1. **Don't add more escapes** - this indicates a missing token
2. Open a discussion about adding a new token
3. Add the token to `/src/styles/design-tokens.css`
4. Update the TypeScript mirror in `/src/styles/designTokens.ts`
5. Remove all related escapes

## Token Source of Truth

The following files are exempt from token compliance (they ARE the tokens):

- `/src/styles/design-tokens.css` - CSS custom properties
- `/src/styles/designTokens.ts` - TypeScript mirror
- `/tailwind.config.ts` - Tailwind theme extensions

## Enforcement Tools

| Tool | Scope | Severity |
|------|-------|----------|
| Stylelint | CSS files | Warning |
| ESLint (relevnt-design/no-hardcoded-styles) | Inline styles | Warning |
| Code review | All files | Human judgment |

## Examples

### Bad - No Escape Comment
```css
.button { padding: 12px; } /* Will trigger warning */
```

### Good - Proper Escape
```css
/* stylelint-disable-next-line declaration-property-value-allowed-list -- iOS Safari fix */
.button { padding: 12px; }
```

### Best - Use Tokens
```css
.button { padding: var(--space-3); } /* No warning */
```

---

*Last updated: December 2024*
*Owner: Design System Team*
