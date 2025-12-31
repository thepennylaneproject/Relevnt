# DESIGN SYSTEM LOCKDOWN SPECIFICATION

**Status**: CANONICAL - All new code MUST comply
**Date**: 2025-12-31
**Enforcement**: Immediate for new code; phased migration for existing

---

## PRINCIPLES

1. **One family** - Source Sans 3 for everything (Fraunces relegated to logo only)
2. **Three weights** - Regular (400), Medium (500), Semibold (600)
3. **Four text roles** - Page title, Section heading, Body, Label
4. **8px rhythm** - All spacing multiples of 8px
5. **Gold is sacred** - Primary CTA only, nothing else

---

## A) TYPOGRAPHY LOCKDOWN

### Final Specification

| Role | Token | Size | Weight | Line Height | Letter Spacing | Usage |
|------|-------|------|--------|-------------|----------------|-------|
| **Page Title** | `--text-title` | 32px (2rem) | 600 | 1.2 | -0.01em | One per page, describes the page |
| **Section Heading** | `--text-heading` | 20px (1.25rem) | 600 | 1.3 | 0 | Card headers, section dividers |
| **Body** | `--text-body` | 16px (1rem) | 400 | 1.5 | 0 | Paragraphs, descriptions |
| **Label** | `--text-label` | 14px (0.875rem) | 500 | 1.4 | 0.01em | Form labels, metadata, captions |

### Font Stack (Single Family)

```css
:root {
  --font-sans: 'Source Sans 3', 'Segoe UI', system-ui, sans-serif;
}
```

**Fraunces** is REMOVED from the design system. It may only appear in the logo/brand mark, not in UI.

### Canonical CSS Implementation

```css
/* TYPOGRAPHY TOKENS - FINAL */
:root {
  /* The only font */
  --font-sans: 'Source Sans 3', 'Segoe UI', system-ui, sans-serif;

  /* The only weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;

  /* The only sizes */
  --text-title: 2rem;      /* 32px - page titles */
  --text-heading: 1.25rem; /* 20px - section headings */
  --text-body: 1rem;       /* 16px - body text */
  --text-label: 0.875rem;  /* 14px - labels, meta */
}

/* Semantic classes */
.text-title {
  font-family: var(--font-sans);
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--color-ink);
}

.text-heading {
  font-family: var(--font-sans);
  font-size: var(--text-heading);
  font-weight: var(--weight-semibold);
  line-height: 1.3;
  color: var(--color-ink);
}

.text-body {
  font-family: var(--font-sans);
  font-size: var(--text-body);
  font-weight: var(--weight-regular);
  line-height: 1.5;
  color: var(--color-ink);
}

.text-label {
  font-family: var(--font-sans);
  font-size: var(--text-label);
  font-weight: var(--weight-medium);
  line-height: 1.4;
  letter-spacing: 0.01em;
  color: var(--color-ink-secondary);
}

/* Muted variant (any role) */
.text-muted {
  color: var(--color-ink-tertiary);
}
```

### Typography to DELETE

| Current Token/Class | Replacement | Action |
|---------------------|-------------|--------|
| `--font-display` | Remove | DELETE |
| `--font-body` | `--font-sans` | RENAME |
| `--font-mono` | Keep (code only) | KEEP |
| `--text-xs` (12px) | `--text-label` | MERGE |
| `--text-sm` (14px) | `--text-label` | MERGE |
| `--text-base` (16px) | `--text-body` | RENAME |
| `--text-lg` (18px) | Remove | DELETE |
| `--text-xl` (20px) | `--text-heading` | RENAME |
| `--text-2xl` (24px) | Remove | DELETE |
| `--text-3xl` (30px) | Remove | DELETE |
| `--text-4xl` (36px) | `--text-title` (use 32px) | MERGE |
| `--text-5xl` (48px) | Remove | DELETE |
| `--font-bold` (700) | Remove | DELETE |
| `--font-normal` | `--weight-regular` | RENAME |
| `--font-medium` | `--weight-medium` | RENAME |
| `--font-semibold` | `--weight-semibold` | RENAME |
| `--leading-tight` | Inline in role | DELETE |
| `--leading-snug` | Inline in role | DELETE |
| `--leading-normal` | Inline in role | DELETE |
| `--leading-relaxed` | Inline in role | DELETE |

---

## B) SPACING LOCKDOWN

### Final Specification (8px Rhythm)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 8px | Tight gaps (icon-to-text, inline elements) |
| `--space-2` | 16px | Component internal padding, form field padding |
| `--space-3` | 24px | Card padding, section gaps |
| `--space-4` | 32px | Page section gaps |
| `--space-5` | 48px | Major section breaks |
| `--space-6` | 64px | Page margins, hero spacing |

### Canonical CSS Implementation

```css
/* SPACING TOKENS - FINAL (8px rhythm only) */
:root {
  --space-1: 8px;   /* Tight */
  --space-2: 16px;  /* Component padding */
  --space-3: 24px;  /* Card padding */
  --space-4: 32px;  /* Section gaps */
  --space-5: 48px;  /* Major breaks */
  --space-6: 64px;  /* Page margins */
}
```

### Canonical Component Spacing

| Component | Property | Token |
|-----------|----------|-------|
| **Card** | padding | `--space-3` (24px) |
| **Card** | gap (internal) | `--space-2` (16px) |
| **Form field** | padding | `--space-1` (8px) vertical, `--space-2` (16px) horizontal |
| **Button** | padding | `--space-1` (8px) vertical, `--space-2` (16px) horizontal |
| **Section gap** | margin-bottom | `--space-4` (32px) |
| **Page content** | padding | `--space-3` (24px) mobile, `--space-4` (32px) desktop |
| **Modal** | padding | `--space-3` (24px) |
| **List items** | gap | `--space-1` (8px) |

### Spacing to DELETE

| Current Token | Replacement | Action |
|---------------|-------------|--------|
| `--space-1` (4px) | Remove | DELETE (not 8px rhythm) |
| `--space-2` (8px) | `--space-1` | RENAME |
| `--space-3` (12px) | Remove | DELETE (not 8px rhythm) |
| `--space-4` (16px) | `--space-2` | RENAME |
| `--space-5` (20px) | Remove | DELETE (not 8px rhythm) |
| `--space-6` (24px) | `--space-3` | RENAME |
| `--space-8` (32px) | `--space-4` | RENAME |
| `--space-10` (40px) | Remove | DELETE (not 8px rhythm) |
| `--space-12` (48px) | `--space-5` | RENAME |
| `--space-16` (64px) | `--space-6` | RENAME |
| `--space-20` (80px) | Remove | DELETE |
| `--space-24` (96px) | Remove | DELETE |

### Illegal Spacing Patterns

**BANNED - Will fail lint:**

```css
/* Raw pixel values */
padding: 12px;           /* ❌ Not 8px rhythm */
margin: 20px;            /* ❌ Not 8px rhythm */
gap: 14px;               /* ❌ Not 8px rhythm */

/* Random rem values */
padding: 0.75rem;        /* ❌ Use token */
margin-bottom: 1.5rem;   /* ❌ Use token */

/* Tailwind arbitrary values */
className="p-[12px]"     /* ❌ Not 8px rhythm */
className="gap-[20px]"   /* ❌ Not 8px rhythm */
className="m-[1.25rem]"  /* ❌ Use semantic class */
```

**ALLOWED:**

```css
/* CSS tokens */
padding: var(--space-2);
gap: var(--space-1);

/* Tailwind semantic classes */
className="p-4"          /* ✓ 16px = --space-2 */
className="gap-2"        /* ✓ 8px = --space-1 */
className="mb-8"         /* ✓ 32px = --space-4 */
```

---

## C) ACCENT RULES (GOLD)

### ALLOWED Usage (Exhaustive List)

| Use Case | CSS | Why Allowed |
|----------|-----|-------------|
| Primary button background | `background: var(--color-accent)` | THE primary CTA |
| Primary button hover | `background: var(--color-accent-hover)` | CTA feedback |
| Focus ring | `box-shadow: 0 0 0 3px var(--color-focus-ring)` | Accessibility critical |
| Text selection | `::selection { background: var(--color-selection) }` | System behavior |
| Active nav indicator (border only) | `border-left: 3px solid var(--color-accent)` | Navigation state |

### BANNED Usage (Accent Ban List)

| Component/State | Current Usage | Required Replacement |
|-----------------|---------------|---------------------|
| **Headings** | `color: var(--color-accent)` | `color: var(--color-ink)` |
| **Stat values** | `color: var(--color-accent)` | `color: var(--color-ink)` |
| **Icons (non-interactive)** | `color: var(--color-accent)` | `color: var(--color-ink-secondary)` |
| **Card borders (decorative)** | `border-left: 4px solid var(--color-accent)` | `border-left: 4px solid var(--color-graphite-faint)` |
| **Progress bars** | `background: var(--color-accent)` | `background: var(--color-graphite)` |
| **Tab backgrounds** | `background: var(--color-accent-glow)` | `background: var(--color-surface-hover)` |
| **Chip/pill active** | `background: var(--color-accent-glow)` | `background: var(--color-surface-hover)` |
| **Links (body text)** | `color: var(--color-accent)` | `color: var(--color-ink); text-decoration: underline` |
| **Tooltips** | Any accent usage | Neutral only |
| **Badges** | Any accent usage | Semantic colors only (success/warning/error/info) |
| **Empty states** | `color: var(--color-accent)` | `color: var(--color-ink-tertiary)` |
| **Gold dust animation** | Entire pattern | DELETE |
| **Slider thumbs** | `background: var(--color-accent)` | `background: var(--color-graphite)` |
| **Checkboxes** | `accent-color: var(--color-accent)` | `accent-color: var(--color-graphite)` |

### Selection States WITHOUT Accent

| State | Old Pattern | New Pattern |
|-------|-------------|-------------|
| **Hover** | `background: var(--color-accent-glow)` | `background: var(--color-surface-hover)` |
| **Active/Selected** | `border-color: var(--color-accent)` | `background: var(--color-surface-hover); border-color: var(--color-graphite)` |
| **Focus** | Keep gold ring | Keep gold ring (accessibility) |
| **Pressed** | N/A | `background: var(--color-bg-alt)` |

### Canonical Accent CSS

```css
/* THE ONLY ACCENT USAGE */
:root {
  --color-accent: #B8965C;
  --color-accent-hover: #CBA76A;
  --color-focus-ring: rgba(184, 150, 92, 0.4);
  --color-selection: rgba(184, 150, 92, 0.12);
}

/* Primary button - THE gold usage */
.btn--primary {
  background-color: var(--color-accent);
  color: var(--color-ink-inverse);
}

.btn--primary:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
}

/* Focus ring - accessibility critical */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

/* Selection - browser behavior */
::selection {
  background-color: var(--color-selection);
}

/* Active nav - border only, no background */
.nav-item--active {
  border-left: 3px solid var(--color-accent);
  background: transparent;  /* NOT accent-glow */
  color: var(--color-ink);  /* NOT accent */
}
```

---

## D) DELETION LIST

### Tokens to DELETE from `design-tokens.css`

```css
/* REMOVE THESE LINES */

/* Typography - consolidating to 4 roles */
--font-display: /* DELETE - Fraunces removed */
--text-xs: /* DELETE - merged to --text-label */
--text-sm: /* DELETE - merged to --text-label */
--text-lg: /* DELETE - no role */
--text-2xl: /* DELETE - no role */
--text-3xl: /* DELETE - no role */
--text-4xl: /* DELETE - use --text-title */
--text-5xl: /* DELETE - no role */
--font-bold: /* DELETE - max weight is 600 */
--leading-tight: /* DELETE - inline in role */
--leading-snug: /* DELETE - inline in role */
--leading-normal: /* DELETE - inline in role */
--leading-relaxed: /* DELETE - inline in role */

/* Spacing - not 8px rhythm */
--space-1: 4px; /* DELETE */
--space-3: 12px; /* DELETE */
--space-5: 20px; /* DELETE */
--space-10: 40px; /* DELETE */
--space-20: 80px; /* DELETE */
--space-24: 96px; /* DELETE */

/* Accent - reducing glow/soft variants */
--color-accent-glow: /* DELETE - only allowed in focus-ring */
--accent-soft: /* DELETE */
--color-accent-soft: /* DELETE */
```

### Classes to DELETE

```css
/* REMOVE THESE CLASS DEFINITIONS */

/* From design-tokens.css */
.gold-dust { } /* DELETE entire pattern */
.nav-item--active { background-color: var(--color-accent-glow) } /* MODIFY */
.font-display { } /* DELETE */

/* From index.css */
.primary-button { } /* DELETE - use .btn--primary */
.secondary-button { } /* DELETE - use .btn--secondary */
.ghost-button { } /* DELETE - use .btn--ghost */
.option-button { } /* DELETE - use .btn--ghost */
.link-pill { } /* DELETE */
.link-accent { } /* DELETE */
.pill--accent { } /* DELETE */
.pill--networking { } /* MODIFY to remove gold */

/* From jobs.css */
.btn { } /* DELETE - duplicate */
.btn-primary { } /* DELETE - duplicate */
.btn-secondary { } /* DELETE - duplicate */
.btn-ghost { } /* DELETE - duplicate */
.page-header h1 { color: var(--color-accent) } /* MODIFY */
.card-job-feed h3 { color: var(--color-accent) } /* MODIFY */
.card-job-grid h3 { color: var(--color-accent) } /* MODIFY */

/* From applications.css */
.apps-page h1 { color: var(--color-accent) } /* MODIFY */
.stat-value { color: var(--color-accent) } /* MODIFY */

/* From dashboard-clarity.css */
All .btn-* definitions /* DELETE - duplicates */
All gold-colored elements /* MODIFY */
```

### Files to DELETE

| File | Reason | Action |
|------|--------|--------|
| `src/styles/app-theme.css` | Redundant with design-tokens | DELETE after migrating 20 lines |
| `src/retired/styles/networking.css` | Already retired | DELETE |

### Files to QUARANTINE (freeze, then migrate)

| File | Lines | Migration Target |
|------|-------|------------------|
| `src/styles/dashboard-clarity.css` | 1219 | Extract to design-tokens, then delete |
| `src/styles/jobs.css` | 1313 | Extract to design-tokens, then delete |

---

## E) MIGRATION GUIDANCE

### For Engineers: How to Apply This

#### Step 1: Typography Migration

```tsx
// BEFORE
<h1 className="text-4xl font-display font-bold text-accent">
  Jobs For You
</h1>

// AFTER
<h1 className="text-title">
  Jobs For You
</h1>
```

```tsx
// BEFORE
<span className="text-xs text-muted uppercase tracking-wide">
  Application Status
</span>

// AFTER
<span className="text-label text-muted">
  Application Status
</span>
```

#### Step 2: Spacing Migration

```tsx
// BEFORE (arbitrary values)
<div className="p-[20px] gap-[12px] mb-[40px]">

// AFTER (8px rhythm)
<div className="p-6 gap-2 mb-12">  /* 24px, 8px, 48px */
```

```css
/* BEFORE (raw pixels) */
.card {
  padding: 22px 26px;
  margin-bottom: 20px;
}

/* AFTER (tokens) */
.card {
  padding: var(--space-3); /* 24px */
  margin-bottom: var(--space-3); /* 24px */
}
```

#### Step 3: Accent Removal

```tsx
// BEFORE
<h3 className="text-accent font-semibold">
  Senior Developer
</h3>
<div className="border-l-4 border-accent bg-accent-glow/10">

// AFTER
<h3 className="text-heading">
  Senior Developer
</h3>
<div className="border-l-4 border-graphite-faint bg-surface-hover">
```

```tsx
// BEFORE (icon with accent)
<Briefcase className="text-accent" />

// AFTER (icon with neutral)
<Briefcase className="text-ink-secondary" />
```

#### Step 4: Button Migration

```tsx
// BEFORE (legacy classes)
<button className="primary-button">Apply Now</button>
<button className="ghost-button">Cancel</button>
<button className="btn btn-secondary btn-sm">Save</button>

// AFTER (canonical component)
import { Button } from '@/components/ui/Button';

<Button variant="primary">Apply Now</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="secondary" size="sm">Save</Button>
```

### Checklist for PR Review

- [ ] No `font-display` or Fraunces usage
- [ ] No font sizes outside the 4 roles (32, 20, 16, 14)
- [ ] No font weight 700 (bold)
- [ ] All spacing is 8px multiples (8, 16, 24, 32, 48, 64)
- [ ] No arbitrary Tailwind values for spacing
- [ ] Gold accent only on `.btn--primary` and focus rings
- [ ] No `text-accent` on headings, icons, or stats
- [ ] No `bg-accent-glow` on tabs, pills, or selections
- [ ] Using `<Button>` component, not raw `.btn` classes
- [ ] No new CSS files added

### ESLint Rules to Add

```js
// eslint-rules/design-lockdown.js
module.exports = {
  rules: {
    // Disallow Fraunces
    'no-font-display': {
      pattern: /font-display|Fraunces/,
      message: 'Fraunces is not part of the design system. Use --font-sans.'
    },

    // Disallow non-8px spacing
    'spacing-8px-rhythm': {
      pattern: /\b(4|12|20|40|80|96)px\b/,
      message: 'Spacing must be 8px multiples: 8, 16, 24, 32, 48, 64'
    },

    // Disallow accent on text
    'no-accent-text': {
      pattern: /text-accent|color:\s*var\(--color-accent\)/,
      message: 'Accent color is reserved for primary buttons only.'
    },

    // Disallow legacy button classes
    'use-button-component': {
      pattern: /className=["'][^"']*primary-button|ghost-button|secondary-button/,
      message: 'Use <Button variant="..."> component instead.'
    }
  }
};
```

---

## SUMMARY

### Before (Current State)

- 2 font families, 4 weights, 9 sizes
- 12 spacing tokens (4px base, inconsistent)
- Gold on ~60 elements
- 7 competing button systems

### After (Lockdown State)

- **1 font family** (Source Sans 3)
- **3 weights** (400, 500, 600)
- **4 text roles** (title, heading, body, label)
- **6 spacing tokens** (8px rhythm: 8, 16, 24, 32, 48, 64)
- **Gold on 4 things only** (primary button, hover, focus ring, selection)
- **1 button system** (`<Button>` component)

### Token Count Reduction

| Domain | Before | After | Reduction |
|--------|--------|-------|-----------|
| Font families | 3 | 1 | -67% |
| Font weights | 4 | 3 | -25% |
| Font sizes | 9 | 4 | -56% |
| Line heights | 4 | 0 (inline) | -100% |
| Spacing | 12 | 6 | -50% |
| Accent variants | 5 | 2 | -60% |

---

*This specification is FINAL. Deviations require explicit approval and documentation.*
