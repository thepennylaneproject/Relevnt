# RELEVNT DESIGN SYSTEM: NON-NEGOTIABLE RULES

## Overview

These rules are **enforceable, system-level constraints** that prevent design drift and eliminate decision fatigue. They are the minimum viable consistency guardrails for maintaining Relevnt's premium, trustworthy aesthetic.

**Philosophy:** Consistency through constraint. Every designer and developer should be able to answer visual questions without subjective debate.

---

## NON-NEGOTIABLE RULES

### 1. ⚠️ ACCENT COLOR RULE
**Rule:** Only Terracotta (#A0715C / #B8965C) and Sage (#5C7A6A / #6B9A78) are permitted for interactive elements, highlights, and CTAs.

**What this prevents:**
- Color creep (drift toward custom blues, purples, reds for CTAs)
- Loss of brand consistency across features
- Accessibility issues from unapproved color choices
- Decision fatigue ("what color should this button be?")

**Scope:** Primary buttons, secondary actions, badges, focus rings, active states, success/warning/error messaging
- Primary CTAs → Always Terracotta
- Secondary actions → Always Sage or neutrals
- Feedback states (error, warning, success) → Semantic palette only (no custom colors)

**Enforcement:**
- Code review checklist: "Does this use only `--color-accent` or `--color-success` CSS vars?"
- Figma constraint: Lock all color swatches; disable custom color picker
- Linting: Flag any `background-color`, `color`, or `border-color` values that aren't CSS variables

**Violation Example:** ❌ `background: #6366F1` (indigo button)
**Correct:** ✓ `background: var(--color-accent)` (Terracotta)

---

### 2. 📏 TYPOGRAPHY SCALE RULE
**Rule:** Use only 5 predefined type sizes. No other font sizes are permitted.

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 48px (3rem) | 600 | Page titles, hero headings, major announcements |
| Heading | 24px (1.5rem) | 600 | Section headers, card titles, subsections |
| Body | 16px (1rem) | 400 | Standard content, paragraphs, descriptions |
| Caption | 14px (0.875rem) | 400 | Labels, metadata, small text, placeholder text |
| Small | 12px (0.75rem) | 500 | Badges, tags, timestamps, UI microcopy |

**What this prevents:**
- Typography hierarchy decay (13px, 15px, 17px, 22px, 26px drift)
- Illegibility at small sizes
- Inconsistent information hierarchy across pages
- "Just this once" one-off sizes that compound into chaos

**Font Families:**
- Headlines (Display, Heading) → `font-display` (Fraunces/Spectral)
- Body text (Body, Caption, Small) → `font-body` (Source Sans 3/Inter)
- Code/data → `font-mono` (JetBrains Mono)

**Enforcement:**
- CSS classes: `.text-display`, `.text-heading`, `.text-body`, `.text-caption`, `.text-small`
- Tailwind: Only these predefined sizes; no `text-[15px]` arbitrary values
- Figma: Create typographic styles; lock all text sizes
- Code review: Flag any `font-size` that isn't a CSS variable reference

**Violation Example:** ❌ `<h3 style="font-size: 18px;">Subtitle</h3>`
**Correct:** ✓ `<h3 class="text-heading">Subtitle</h3>`

---

### 3. 🎯 SPACING SCALE RULE
**Rule:** Padding, margin, and gap values must come from the predefined spacing scale only.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Minimal gaps (icon padding, tight spacing) |
| `space-2` | 8px | Small spacing (form field padding, button padding) |
| `space-3` | 12px | Small/medium spacing |
| `space-4` | 16px | Default spacing between elements |
| `space-5` | 20px | Medium spacing |
| `space-6` | 24px | Large spacing between components |
| `space-8` | 32px | Extra large spacing (section margins) |
| `space-12` | 48px | Page-level spacing, hero gutters |

**What this prevents:**
- Random margins destroying visual rhythm (17px, 19px, 22px gaps)
- Inconsistent breathing room between sections
- Misaligned grids and awkward whitespace
- Decision fatigue on padding/margin values

**Scope:** All padding, margin, gap, top, bottom, left, right CSS properties

**Enforcement:**
- Tailwind: Use only predefined spacing classes (`p-2`, `m-4`, `gap-6`)
- CSS: Reference only `var(--space-*)` variables
- Code review: Flag any `padding`, `margin`, `gap` with pixel values that don't match scale
- Linting: Warn on hardcoded spacing values; suggest nearest token

**Violation Example:** ❌ `<div style="padding: 18px; margin-bottom: 30px;">`
**Correct:** ✓ `<div className="p-4 mb-8">`

---

### 4. 🔲 BORDER RADIUS RULE
**Rule:** Border radius must use only 4 predefined values. 16px (xl) is the primary default.

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Subtle rounding (small interactive elements, minimal visual softness) |
| `radius-md` | 8px | Standard rounding (form controls, badges, small cards) |
| `radius-lg` | 12px | Medium rounding (cards, medium-sized containers) |
| `radius-xl` | 16px | **PRIMARY** (buttons, major containers, primary CTA surfaces) |

**What this prevents:**
- Rounding hierarchy collapse (5px, 7px, 10px, 15px, 18px mix)
- Visual inconsistency between buttons and cards
- Loss of premium, cohesive aesthetic
- "Rounded" vs. "very rounded" subjective decisions

**Scope:** `border-radius` on all interactive and structural elements

**Enforcement:**
- Tailwind: Use only `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`
- CSS: Only `var(--radius-*)` values
- Code review: Confirm all buttons are `rounded-xl` (16px), cards are `rounded-lg` (12px)
- Figma: Set component properties to enforce rounding values; disable arbitrary values

**Violation Example:** ❌ `border-radius: 10px` or `rounded-[10px]` in Tailwind
**Correct:** ✓ `class="rounded-xl"` (16px for buttons) or `rounded-lg` (12px for cards)

---

### 5. 🌑 SHADOW SYSTEM RULE
**Rule:** Only 3 predefined shadow depths are permitted. No custom shadows, no filter: drop-shadow().

| Token | Usage |
|-------|-------|
| `shadow-sm` | Cards, buttons on hover — subtle lift |
| `shadow-md` | Modals, dropdowns, floating elements — medium elevation |
| `shadow-lg` | Critical overlays, tooltips — strong elevation |

**Additional:** Shadow-glow (gold accent glow) for high-emphasis CTAs only.

**What this prevents:**
- Shadow proliferation (5px, 8px, 12px, 15px, 20px custom shadows)
- Depth hierarchy confusion
- Loss of subtle, premium aesthetic (excessive shadows = cheap look)
- Inconsistent elevation semantics

**Scope:** All box-shadow and filter: drop-shadow() properties

**Enforcement:**
- CSS/Tailwind: `box-shadow: var(--shadow-sm)`, `box-shadow: var(--shadow-md)`, `box-shadow: var(--shadow-lg)`
- No `filter: drop-shadow()` (exception: SVG icons, requires pre-approval)
- Code review: Confirm only `shadow-sm`, `shadow-md`, `shadow-lg` classes or CSS vars used
- Linting: Flag any custom box-shadow values; suggest nearest token

**Violation Example:** ❌ `box-shadow: 0 6px 20px rgba(0,0,0,0.1)`
**Correct:** ✓ `class="shadow-md"` or `box-shadow: var(--shadow-md)`

---

### 6. ⚡ ANIMATION DURATION RULE
**Rule:** Only 3 predefined animation durations are permitted.

| Duration | Usage | Easing |
|----------|-------|--------|
| `150ms` (fast) | Hover states, quick toggles, icon interactions | ease-out |
| `200ms` (normal) | Standard transitions, page navigations, state changes | ease-out |
| `300-500ms` (slow) | Modals, overlays, gentle deliberate motion | ease-out |

**What this prevents:**
- Arbitrary animation timings (180ms, 220ms, 350ms scattered throughout)
- Janky, inconsistent interaction feel
- Motion overload (animations too slow) or jittery feel (too fast)
- Decision fatigue on "how long should this fade?"

**Scope:** `transition-duration`, `animation-duration`, CSS `animation` properties

**Enforcement:**
- CSS/Tailwind: Use only `duration-fast`, `duration-base`, `duration-slow` (or 150ms, 200ms, 300ms)
- All animations default to `ease-out` cubic-bezier
- Code review: Confirm animations use predefined durations
- Linting: Flag any `transition`, `animation-duration` values outside the permitted range

**Violation Example:** ❌ `transition: all 180ms ease-in-out`
**Correct:** ✓ `transition: all 200ms ease-out` or `class="transition duration-base"`

---

### 7. 📍 Z-INDEX SCALE RULE
**Rule:** Z-index values must come from a predefined scale only. No arbitrary z-index values.

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Dropdown | 10 | Dropdowns, popovers |
| Sticky | 20 | Sticky headers, persistent sidebars |
| Modal Backdrop | 30 | Modal overlay/scrim |
| Modal | 40 | Modal dialogs, full-screen overlays |
| Toast | 50 | Toast notifications, alerts |
| Tooltip | 60 | Tooltips, popovers above modals |

**What this prevents:**
- Z-index inflation wars (21, 999, 9999, 10000 sprawl)
- Modal appearing behind toast notifications (stacking context confusion)
- Elements layering in unpredictable order
- "Quick fix" z-index hacks that break on next feature

**Scope:** All `z-index` CSS properties

**Enforcement:**
- CSS/Tailwind: Use only predefined z-classes (`z-dropdown`, `z-sticky`, `z-modal`, `z-toast`, `z-tooltip`)
- Never use arbitrary z-index values (no `z-[999]` in Tailwind)
- Code review: Confirm z-index comes from the approved scale
- Linting: Block any `z-index` value not in the defined range

**Violation Example:** ❌ `z-index: 999` or `z-index: 100`
**Correct:** ✓ `z-index: var(--z-modal)` (40) or Tailwind `z-modal`

---

## ENFORCEMENT STRATEGY

### Code Review Checklist
- [ ] All color values reference `--color-accent`, `--color-success`, or semantic tokens (no custom colors)
- [ ] All text uses predefined sizes: `.text-display`, `.text-heading`, `.text-body`, `.text-caption`, `.text-small`
- [ ] All spacing uses scale tokens: `var(--space-*)` or Tailwind `p-*`, `m-*`, `gap-*`
- [ ] All border-radius is from scale: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`
- [ ] All shadows use only: `shadow-sm`, `shadow-md`, `shadow-lg`
- [ ] All animations use only: `150ms`, `200ms`, `300-500ms`
- [ ] All z-index comes from scale: `z-dropdown`, `z-sticky`, `z-modal`, `z-toast`, `z-tooltip`

### Design Tools (Figma) Rules
- Lock color swatches to approved palette
- Create component properties for spacing, shadow, border-radius
- Generate type styles from scale; disable custom sizing
- Document z-index stacking order in design system file

### Automated Linting (ESLint + Stylelint)
```
ESLint:
- Flag inline styles with hardcoded values (recommend refactoring to classes)

Stylelint:
- Warn on font-size not matching scale
- Warn on padding/margin not matching spacing tokens
- Warn on border-radius outside scale
- Warn on custom box-shadow (suggest token)
- Warn on z-index outside scale
- Warn on animation-duration outside permitted values
```

### Git Pre-Commit Hook
Run linting on staged CSS/SCSS/TSX files to catch violations before commit.

---

## FAQ

**Q: What if a design genuinely needs a different value?**
A: Bring it to design system governance. The rules can evolve, but changes must be documented and applied everywhere.

**Q: Can I use arbitrary Tailwind values like `text-[15px]`?**
A: No. Only predefined scales. If you need a size not on the scale, that's a signal to question the design.

**Q: What about responsive spacing (e.g., `p-4 md:p-6`)?**
A: Fully supported. Both values must come from the scale (`space-4` and `space-6`).

**Q: Can third-party libraries use different shadows/colors?**
A: No. All UI components, including third-party integrations, must conform. Wrap/customize them to match the system.

**Q: How do we handle dark mode?**
A: CSS custom properties handle it automatically. Light and dark modes use the same token names; values change via `:root.dark`.

---

## MAINTENANCE

**Owners:** Design System Lead, Lead Engineer
**Review Cadence:** Quarterly
**Change Log:** Document all rule updates with rationale and migration strategy

---

## SUMMARY TABLE

| Rule | Constraint | Enforcement |
|------|-----------|------------|
| **Accent Color** | Terracotta + Sage only | CSS vars, Figma constraints |
| **Typography** | 5 sizes only | Type styles, linting |
| **Spacing** | 4, 8, 12, 16, 20, 24, 32, 48px | Spacing tokens, linting |
| **Border Radius** | 4, 8, 12, 16px (primary: 16px) | Component properties, linting |
| **Shadows** | 3 depths only | Shadow tokens, linting |
| **Animation** | 150ms, 200ms, 300-500ms | Duration classes, linting |
| **Z-Index** | Scale of 7 values (10–60) | Z-index tokens, linting |

---

**Version:** 1.0
**Last Updated:** 2025-12-30
**Status:** Active & Enforceable
