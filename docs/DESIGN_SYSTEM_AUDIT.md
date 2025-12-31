# DESIGN SYSTEM AUTHORITY AUDIT

**Date**: 2025-12-31
**Auditor**: Claude Code
**Branch**: `claude/audit-design-system-SIsTp`

---

## Executive Summary

The codebase has **24 CSS files totaling ~10,000+ lines** with severe authority fragmentation. The `ui/Button.tsx` component exists but is bypassed extensively. Gold accent is used decoratively in 60+ locations when it should be reserved for primary CTAs only. Typography has 3 competing heading definitions.

**Root Cause**: Incremental feature development without consolidation. Each page got its own CSS file that redefined core patterns.

---

## A) AUTHORITY MAP

| Domain | Canonical Source | Non-Canonical Duplicates | Recommendation |
|--------|-----------------|--------------------------|----------------|
| **Buttons** | `components/ui/Button.tsx` + `design-tokens.css:462-516` | `index.css:879-939`, `global.css:165-245`, `dashboard-clarity.css:956-987`, `jobs.css:204-263`, `.primary-button`/`.ghost-button` classes | **FREEZE** non-canonical; migrate to component |
| **Typography** | `design-tokens.css:96-125` | `global.css:60-105`, `index.css:26-78`, `jobs.css:18-36` (`'Crimson Text'` hardcoded) | **DELETE** duplicates; enforce tokens |
| **Spacing** | `design-tokens.css:78-93` (--space-*) | ~50 hardcoded values (`32px`, `24px`, etc.) across files | **QUARANTINE** then migrate |
| **Accent/Gold** | `design-tokens.css:46-48` (--color-accent) | Decorative usage in 60+ locations | **AUDIT** and remove violations |
| **Surfaces** | `design-tokens.css:28-33` + `tailwind.config.ts` | `.card`, `.surface-card`, `.card-shell` variants in 5 files | **MERGE** to single card pattern |

---

## B) DEBT HOTSPOTS (Ranked by Damage)

### CRITICAL

| Rank | File | Why It Causes Inconsistency | Fix Type |
|------|------|----------------------------|----------|
| 1 | `src/index.css` (3426 lines) | Redefines buttons (`.btn`, `.primary-button`, `.ghost-button`), headings, cards, inputs - competes with both `global.css` and `design-tokens.css`. Contains 3 different card patterns. | **REFACTOR** - extract, then delete redundancy |
| 2 | `src/styles/jobs.css` (1313 lines) | Redefines `.btn` completely at line 204. Uses `'Crimson Text'` bypassing `--font-display`. Gold on headings (decorative). | **REFACTOR** - remove local button system |
| 3 | `src/styles/dashboard-clarity.css` (1219 lines) | Defines separate `.btn-primary-glow`, `.btn-secondary-subtle` buttons. Massive gold abuse: borders, icons, stats, sections. | **QUARANTINE** then migrate |

### HIGH

| Rank | File | Why It Causes Inconsistency | Fix Type |
|------|------|----------------------------|----------|
| 4 | `src/styles/global.css` | Imports `design-tokens.css` but then redefines `.btn` at line 165 with different padding/font-size. Duplicates heading styles. | **MERGE** into design-tokens.css |
| 5 | `src/styles/applications.css` | Adds more `.btn--*` size variants. Gold on stats, headers. | **MERGE** button sizes into canonical |
| 6 | `src/App.css` | Feed-specific components with hardcoded colors (`#f0e1c4`, `#f7ecda`, `#d6a65c`). | **REFACTOR** to use tokens |

### MEDIUM

| Rank | File | Why It Causes Inconsistency | Fix Type |
|------|------|----------------------------|----------|
| 7 | `src/styles/app-theme.css` | Redundant `.card` definition. Hardcoded pixels. | **DELETE** after migration |
| 8 | `src/components/ResumeBuilder/SectionNavItem.tsx` | Hardcoded Tailwind arbitrary values: `bg-[#C7B68A]`, `text-[#1F2933]` | **REFACTOR** to semantic classes |
| 9 | `src/components/ui/WelcomeModal.tsx` | Inline styles with fallback hex colors | **REFACTOR** |
| 10 | `src/contexts/RelevntThemeProvider.tsx` | Hardcoded hex values in JS object (lines 82-149) | **QUARANTINE** - legacy theme bridge |

---

## C) ACCENT COLOR (GOLD) VIOLATIONS

### Allowed (Primary Action Only)
- `btn--primary` background
- Focus ring (`--color-focus-ring`)
- Selection highlight

### Disallowed - Decorative/Ambient (WORST OFFENDERS)

| File | Line(s) | Violation | Severity |
|------|---------|-----------|----------|
| `jobs.css` | 21-23, 127-129, 306-308 | **Gold on h3 headings** - pure decoration | Critical |
| `applications.css` | 27-29, 49-54 | **Gold on h1 and stat values** | Critical |
| `dashboard-clarity.css` | 79-84, 115-117 | **Gold momentum message, labels** | Critical |
| `dashboard-clarity.css` | 373-383 | **Gold foundation-card icons** | High |
| `index.css` | 713-717 | **Gold tab active background** | High |
| `design-tokens.css` | 631-634 | `.nav-item--active` gold background | Medium |

### Disallowed - Informational Highlight

| Pattern | Count | Examples |
|---------|-------|----------|
| `text-accent` on icons | 15+ | Dashboard icons, skill cards |
| `bg-accent/5` or `bg-accent-soft` | 20+ | Drafted outreach, priority sections |
| `border-accent` on non-interactive | 10+ | Card left borders |
| Progress bar fills | 5+ | Skills trajectory, profile completion |

---

## D) BUTTON CLASS CHAOS

**7 competing button class systems found:**

1. `.btn` + `.btn--primary` (design-tokens.css) - **CANONICAL**
2. `.btn` + `.btn--primary` (global.css) - different padding
3. `.btn` + `.btn-primary` (jobs.css) - different sizing
4. `.primary-button` (index.css) - completely separate
5. `.ghost-button` (index.css) - separate from `.btn--ghost`
6. `.btn-primary-glow` (dashboard-clarity.css) - gradient variant
7. Direct Tailwind (`bg-accent`, `bg-champagne`) - bypasses all

**Files using non-canonical button classes:**
- `SignupPage.tsx:344` - `primary-button`
- `LoginPage.tsx:201` - `btn btn--lg` (mixing systems)
- `ResumeBuilderPage.tsx:235-344` - `btn btn-secondary btn-sm` (jobs.css system)
- `WelcomeModal.tsx:157-178` - `primary-button`, `ghost-button`
- `HomePage.tsx:151-154` - `primary-button`, `ghost-button`
- ~30 more violations

---

## E) PHASE PLAN

### Phase 1: SAFETY + CANONICALIZATION

**Goal**: Establish single source of truth without breaking production

1. **Freeze non-canonical CSS**
   - Add `/* FROZEN - DO NOT MODIFY */` header to: `jobs.css`, `dashboard-clarity.css`, `applications.css`
   - ESLint rule to warn on edits to frozen files

2. **Consolidate button tokens**
   - Merge button size variants into `design-tokens.css`
   - Add `.btn--destructive` properly to canonical
   - Document: "All buttons MUST use `<Button>` component or `.btn` classes from design-tokens.css"

3. **Create migration tracking**
   - Add `data-migrate="button"` attribute to all non-canonical button usages
   - Create script to count remaining migrations

### Phase 2: MIGRATION + DELETION

**Goal**: Eliminate duplicates, fix gold violations

1. **Button component migration**
   - Convert all `primary-button` to `<Button variant="primary">`
   - Convert all `ghost-button` to `<Button variant="ghost">`
   - Convert all inline `btn btn-primary` to `<Button>`

2. **Gold violation fixes**
   - Remove `color: var(--color-accent)` from headings in `jobs.css`, `applications.css`
   - Replace decorative gold with `--color-graphite` or `--color-ink-secondary`
   - Keep gold ONLY on: primary buttons, focus states, active nav indicators

3. **CSS file consolidation**
   - Delete `app-theme.css` (merge 20 lines into design-tokens)
   - Delete `global.css` button/heading definitions (keep only imports)
   - Reduce `index.css` from 3426 to ~500 lines (layout only)

### Phase 3: ENFORCEMENT GUARDRAILS

**Goal**: Prevent regression

1. **ESLint rules**
   - `no-hardcoded-colors`: Disallow hex codes in TSX/CSS
   - `no-arbitrary-tailwind`: Warn on `bg-[#...]`, `text-[#...]`
   - `require-button-component`: Error on `className="btn..."` without component

2. **Stylelint rules**
   - Disallow `font-size:` without `var(--text-*)`
   - Disallow `color: var(--color-accent)` except in `.btn--primary`

3. **Component enforcement**
   - Primary Action Registry already exists - enable in production
   - Add Button import validation to PR checks

---

## IMMEDIATE ACTIONS

1. **STOP** adding new CSS files
2. **STOP** using `primary-button` class - use `<Button variant="primary">`
3. **STOP** coloring headings gold
4. **START** using `design-tokens.css` as the ONLY source for new styles

---

## FILES INVENTORY

### CSS Files (24 total)

| File | Lines | Status |
|------|-------|--------|
| `src/styles/design-tokens.css` | 689 | CANONICAL |
| `src/styles/global.css` | 450 | MERGE |
| `src/index.css` | 3426 | REFACTOR |
| `src/styles/dashboard-clarity.css` | 1219 | QUARANTINE |
| `src/styles/jobs.css` | 1313 | QUARANTINE |
| `src/styles/applications.css` | 300 | MERGE |
| `src/styles/resume-builder.css` | 116 | KEEP |
| `src/styles/app-theme.css` | 119 | DELETE |
| `src/App.css` | 266 | REFACTOR |
| `src/styles/interview-prep.css` | ~150 | AUDIT |
| `src/styles/settings-hub.css` | ~100 | AUDIT |
| `src/styles/notification-center.css` | ~100 | AUDIT |
| `src/styles/margin-nav.css` | ~50 | KEEP |
| `src/styles/textures.css` | ~50 | KEEP |
| `src/styles/icon-kit.css` | ~50 | KEEP |
| `src/styles/linkedin-optimizer.css` | ~100 | AUDIT |
| `src/styles/portfolio-optimizer.css` | ~100 | AUDIT |
| `src/styles/theme-automation.css` | ~50 | AUDIT |
| `src/components/layout/header.css` | ~50 | MERGE |
| `src/components/onboarding/onboarding-wizard.css` | ~100 | AUDIT |
| `src/retired/styles/networking.css` | ~50 | DELETE |
| `relevnt_icon_kit/*.css` | ~100 | EXTERNAL |
| `relevnt_final/*.css` | ~688 | EXTERNAL |

---

## NEXT STEPS

1. Review this audit with the team
2. Prioritize Phase 1 tasks
3. Create Jira/Linear tickets for each migration item
4. Establish code review checklist for design system compliance
