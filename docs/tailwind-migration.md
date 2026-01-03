# Tailwind Migration Guide

## Quick Reference: Custom CSS → Tailwind

### Colors

**Old (Custom CSS):**

```css
.card {
  background: var(--color-bg-secondary);
  color: var(--color-ink-tertiary);
  border: 1px solid var(--color-graphite-faint);
}
```

**New (Tailwind):**

```tsx
<div className="bg-surface-2 text-text-muted border border-border">
```

### Common Replacements

| Old CSS Variable      | New Tailwind Class          |
| --------------------- | --------------------------- |
| `var(--bg)`           | `bg-bg`                     |
| `var(--surface)`      | `bg-surface`                |
| `var(--surface-2)`    | `bg-surface-2`              |
| `var(--text)`         | `text-text`                 |
| `var(--text-muted)`   | `text-text-muted`           |
| `var(--border)`       | `border-border`             |
| `var(--accent)`       | `bg-accent` / `text-accent` |
| `var(--accent-hover)` | `bg-accent-hover`           |
| `var(--success)`      | `text-success`              |
| `var(--warning)`      | `text-warning`              |
| `var(--error)`        | `text-error`                |

### Layout & Spacing

**Use Tailwind's default spacing scale instead of custom CSS:**

| Old                             | New Tailwind |
| ------------------------------- | ------------ |
| `padding: var(--space-4)`       | `p-4`        |
| `gap: var(--space-6)`           | `gap-6`      |
| `margin-bottom: var(--space-8)` | `mb-8`       |

### Border Radius

| Old                               | New Tailwind |
| --------------------------------- | ------------ |
| `border-radius: var(--radius)`    | `rounded-md` |
| `border-radius: var(--radius-lg)` | `rounded-lg` |
| `border-radius: var(--radius-xl)` | `rounded-xl` |

### Typography

| Old                                | New Tailwind   |
| ---------------------------------- | -------------- |
| `font-family: var(--font-display)` | `font-display` |
| `font-family: var(--font-body)`    | `font-body`    |
| `font-size: var(--text-sm)`        | `text-sm`      |
| `font-size: var(--text-lg)`        | `text-lg`      |

### Shadows

| Old                            | New Tailwind |
| ------------------------------ | ------------ |
| `box-shadow: var(--shadow)`    | `shadow-md`  |
| `box-shadow: var(--shadow-lg)` | `shadow-lg`  |

## Migration Strategy

### 1. Start with Components (Fastest Wins)

Replace component wrappers first:

**Before:**

```tsx
<div className="card-job-feed">
```

**After:**

```tsx
<div className="card"> {/* Uses global .card primitive */}
```

or fully Tailwind:

```tsx
<div className="bg-surface border border-border rounded-lg p-6 shadow-md">
```

### 2. Delete Route CSS as You Go

When a component is fully Tailwind, delete its CSS from route files:

- `applications.css` → Delete as Applications components migrate
- `dashboard-clarity.css` → Delete as Dashboard components migrate
- `jobs.css` → Delete as Jobs components migrate

### 3. Keep Only Brand Primitives in Custom CSS

**Keep in `globals.base.css`:**

- `.card`, `.btn`, `.input` (brand primitives)
- Button variants (`.btn--primary`, etc.)
- Modal, badge, table patterns

**Delete from globals.base.css:**

- Granular utilities (replaced by Tailwind)
- Layout-specific classes (use Tailwind flex/grid)

## Example: Full Component Migration

**Before (Custom CSS + scattered utilities):**

```tsx
// Component
<div className="pipeline-stat is-active">
  <div className="pipeline-stat-icon">
    <Icon name="check" />
  </div>
  <div className="pipeline-stat-content">
    <span className="pipeline-stat-label">Applied</span>
    <span className="pipeline-stat-value">12</span>
  </div>
</div>

/* dashboard-clarity.css */
.pipeline-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-graphite-faint);
  border-radius: var(--radius-xl);
  transition: all var(--transition-base);
}
.pipeline-stat.is-active {
  border-color: var(--color-accent);
  background: var(--color-surface-hover);
}
/* ... etc */
```

**After (Tailwind-first):**

```tsx
<div className="flex flex-col gap-4 p-6 bg-surface border border-border rounded-xl transition-all hover:shadow-md data-[active=true]:border-accent data-[active=true]:bg-surface-2">
  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-2 text-accent">
    <Icon name="check" />
  </div>
  <div className="flex-1">
    <span className="block text-xs font-semibold text-text-muted mb-1">
      Applied
    </span>
    <span className="block text-lg font-bold text-text font-display">12</span>
  </div>
</div>
```

**CSS deleted:** 50+ lines from `dashboard-clarity.css` ✓

## Priority Order

1. **Dashboard** — Lots of repeated patterns, good candidate
2. **Jobs** — Card grids, filters
3. **Applications** — Status pills, cards
4. **Resume Builder** — Already minimal CSS

## Success Metrics

- [ ] Route CSS files under 200 lines each (or deleted)
- [ ] <10 custom CSS classes per component
- [ ] 80%+ of styling via Tailwind classes
- [ ] `globals.base.css` under 400 lines (primitives only)
