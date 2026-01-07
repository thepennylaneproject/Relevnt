# Relevnt Visual Constitution v1.0

## 0. Core Principles (Non-Negotiable)

1. Calm beats clever.
2. Defaults over options.
3. Fewer surfaces, fewer colors, fewer sizes.
4. If it is not explicitly allowed here, it is forbidden.
5. Components must feel inevitable, not designed.

---

## 1. Typography (LOCKED)

### Type Ramp (Immutable)

Only the following typography classes may exist or be used.

| Class      | Size | Line Height | Usage                                          |
| ---------- | ---- | ----------- | ---------------------------------------------- |
| type-label | 11px | 1.2         | Section labels, field labels, metadata headers |
| type-meta  | 12px | 1.4         | Secondary info, helper text, inline actions    |
| type-body  | 15px | 1.6         | Primary readable content                       |
| type-title | 18px | 1.4         | Page titles only                               |
| type-hero  | 24px | 1.3         | Dashboard hero only                            |

Rules:

- No new font sizes may be introduced.
- No component may hardcode font-size, line-height, or font-weight.
- All text must use a type class.
- Headings beyond type-title are forbidden.

---

## 2. Color System (TOKEN ONLY)

### Allowed Tokens

- --bg
- --surface
- --text
- --text-muted
- --border
- --accent (champagne gold)
- --error

Rules:

- Raw hex colors are forbidden.
- RGB, HSL, or named colors are forbidden.
- Accent color may only be used for:

  - Primary action
  - Active state
  - Error state

- Accent color may never be used decoratively.

---

## 3. Spacing & Rhythm (STRICT SCALE)

### Approved Spacing Scale

Only these spacing tokens may be used:

- xs
- sm
- md
- lg
- xl

Rules:

- No px values in margin or padding.
- Vertical rhythm must be consistent within a page.
- Adjacent sections must share the same vertical spacing.
- Nested spacing must always be smaller than parent spacing.

---

## 4. Surfaces & Containers

Rules:

- Cards are the exception, not the default.
- Pages should feel like paper, not dashboards.
- White cards on ivory backgrounds are discouraged and must be justified.
- Shadows, elevation, and rounded containers are forbidden by default.
- If a surface exists, it must answer: “What boundary does this enforce?”

---

## 5. Buttons & Actions

### Action Hierarchy

1. Primary action: One per page maximum.
2. Secondary action: Text or outline only.
3. Tertiary action: Text link only.

Rules:

- Icon-only buttons must have aria-labels.
- Multiple filled buttons on one page are forbidden.
- Destructive actions must be explicit and calm.

---

## 6. Inputs & Forms

Rules:

- Labels must always be readable against background.
- Placeholder text is not a label.
- Helper text uses type-meta only.
- Inputs must never introduce new colors or borders.

---

## 7. Page Shell

### Header

- One global header system.
- No page-specific header inventions.

### Footer

- One footer design for the entire application.
- Dashboard footer and secondary footer must be unified.

### Scrolling

- Pages scroll vertically unless explicitly justified.
- Horizontal scroll is forbidden.
- Infinite or cyclical motion must not introduce visual noise.

---

## 8. Component Law

Rules:

- Components may not introduce new visual language.
- Components must inherit typography, spacing, and color.
- Inline helpers must feel like margin notes, not features.
- No component may require explanation to feel “correct”.

---

## 9. Enforcement Rules

Violations include:

- New font sizes
- Hard-coded colors or spacing
- Decorative accents
- Unjustified containers
- Inconsistent rhythm across pages

Violations must be fixed, not debated.

---

## 10. Cultural Rule

If a change makes the app louder, busier, or more impressive:
It is probably wrong.

### Metaphor Policy

Relevnt allows metaphor only when it is:

• Structural, not decorative
• Subtle, not illustrative
• Consistent, not page-specific
• Implemented via tokens or primitives, not one-off CSS

Allowed:
• Editorial rhythm (spacing, hierarchy, restraint)
• Material suggestion (paper, margin, gravity) via scale and contrast
• Quiet reference metaphors (ledger, notebook) expressed through layout behavior

Forbidden:
• Decorative borders, hand-drawn effects, or wobble purely for style
• Page-specific metaphors that do not generalize
• Metaphor implemented as raw CSS effects
• Visual elements that imply progress, completion, or gamification

If a metaphor cannot be expressed using the approved tokens and typography,
it is not allowed.
