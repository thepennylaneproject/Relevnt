# Relevnt Icon & Illustration System

## North Star

> "All Relevnt icons are hand-drawn editorial sketches that prioritize human imperfection, restraint, and emotional clarity over traditional UI precision."

---

## Core Principle

Relevnt does not use traditional UI iconography. All icons are **editorial sketch illustrations** rendered at icon scale.

Think:

- Marginalia in a notebook
- Pencil sketches in a field guide
- Human marks, not machine glyphs

**Icons must feel drawn, not designed.**

If an icon looks like it belongs in Lucide, Material, Heroicons, or Feather, it is **incorrect**.

---

## Icon Tiers

### Tier 1: Navigation Icons

Used in primary navigation, tabs, and key entry points.

- Simple symbolic forms
- Minimal detail
- Recognizable at small sizes
- Still hand-drawn, never geometric

**Examples:** Compass (Dashboard), Briefcase (Jobs), Paper airplane (Applications), Bell (Notifications)

### Tier 2: Functional / Utility Icons

Used for actions, states, and UI affordances.

- Slightly looser than nav icons
- Still restrained
- No visual noise

**Examples:** Check, Plus, Chevron, Bookmark, Alert

### Tier 3: Illustrative / Empty State Assets

Used for empty states, onboarding, and emotional moments.

- More expressive
- More narrative
- Still minimal
- One focal idea per illustration

---

## Line Style Rules (Non-Negotiable)

All icons must follow:

- Hand-drawn pencil or charcoal appearance
- Imperfect strokes with subtle pressure variation
- No perfectly straight lines
- No perfect circles
- No hard symmetry
- No filled shapes (except gold accents)

Stroke feel: Graphite, Charcoal, Mechanical pencil, Notebook sketch

**Never:**

- Flat vector fills
- Uniform stroke weight
- Pixel-perfect geometry

---

## Color System

### Charcoal Lines

- Visual equivalent of `#333333`
- CSS inversion compatible
- No baked-in dark backgrounds

### Champagne Gold Accent

- Color: `#C7A56A` (CSS: `var(--color-accent)`)
- Used sparingly
- Never outlines, gradients, or dominant

**Acceptable gold usage:** A dot, a heart, a needle, a clasp, a small halo

Gold must always be **visually separable** from charcoal lines.

---

## Dark Mode Compatibility

Icons must support automatic inversion:

- Charcoal lines invert via CSS filters
- Gold accents remain unchanged
- No merged gold/charcoal strokes
- No baked background tones
- No contrast tricks

**Icons must remain legible when charcoal becomes chalk.**

---

## Anti-Patterns (Invalid)

- Flat monochrome UI icons
- Lucide-style stroke icons
- Material Design geometry
- Emoji-like simplifications
- Highly detailed realism
- Shaded or painterly illustrations
- Heavy textures, drop shadows, gradients

---

## Success Criteria

A correct Relevnt icon should:

- Look like it belongs in a sketchbook
- Feel human and thoughtful
- Be immediately recognizable
- Scale down gracefully
- Still feel intentional, not messy

**If it looks like it could ship in a generic SaaS product, it has failed.**
