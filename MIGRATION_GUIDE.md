# Global CSS Consolidation Migration Guide

## Overview

You now have a **single source of truth** for all styling: `src/styles/global.css`

This guide walks through:
1. What changed
2. How to verify the migration
3. Which old files can be deleted
4. How to update any custom component styles

---

## ✅ What's Changed

### Before
```
src/
├── styles/
│   ├── design-tokens.css          ← Primary tokens
│   ├── jobs.css                    ← Feature overrides (hardcoded colors)
│   ├── dashboard-clarity.css       ← Feature overrides
│   ├── applications.css            ← Feature overrides
│   ├── interview-prep.css          ← Feature overrides
│   ├── linkedin-optimizer.css      ← Feature overrides
│   ├── settings-hub.css            ← Feature overrides
│   ├── notification-center.css     ← Feature overrides
│   ├── textures.css                ← Texture definitions
│   └── ...
├── index.css                       ← Imports 6+ files
└── App.css                         ← Additional overrides
```

### After
```
src/
├── styles/
│   └── global.css                  ← SINGLE SOURCE OF TRUTH
│       ├── Font imports
│       ├── Design tokens (colors, typography, spacing)
│       ├── Light/dark mode
│       ├── Base styles
│       ├── Component patterns (buttons, cards, badges)
│       ├── Textures & visual effects
│       └── Utilities
└── index.css                       ← Imports only global.css
```

---

## 🎯 The New System

### Structure of `src/styles/global.css`

All styling is organized into 9 sections:

| Section | Contains |
|---------|----------|
| 1. Font Imports | Google Font imports (Bebas, Lora, Crimson, JetBrains) |
| 2. Design Tokens | Color scales (Ink, Ivory, Terracotta, Sage), typography, spacing |
| 3. Dark Mode | Color inversions for dark mode support |
| 4. Base Styles | HTML, body, headings, selections, focus states |
| 5. Typography | Heading styles, body text, poetic text, code blocks |
| 6. Components | Buttons, cards, badges, inputs, alerts, navigation |
| 7. Textures | Watercolor washes, paper grain, canvas weave patterns |
| 8. Utilities | Spacing, text, flex, color helpers |
| 9. Responsive | Mobile and desktop breakpoints |

### To Modify Any Style

1. Open `src/styles/global.css`
2. Find the section (see above)
3. Make your change
4. Save and test

That's it. No hunting through 15 files.

---

## 🗑️ Files to Delete

The following files can now be safely deleted. Before you delete, verify they're not imported anywhere else:

| File | Status | Notes |
|------|--------|-------|
| `src/styles/design-tokens.css` | ✅ DELETE | All tokens now in global.css |
| `src/styles/textures.css` | ✅ DELETE | All textures now in global.css |
| `src/styles/jobs.css` | ✅ DELETE | Styles moved to global.css, hardcoded colors removed |
| `src/styles/dashboard-clarity.css` | ✅ DELETE | If no unique styles |
| `src/styles/applications.css` | ✅ DELETE | If no unique styles |
| `src/styles/interview-prep.css` | ✅ DELETE | If no unique styles |
| `src/styles/linkedin-optimizer.css` | ✅ DELETE | If no unique styles |
| `src/styles/settings-hub.css` | ✅ DELETE | If no unique styles |
| `src/styles/notification-center.css` | ✅ DELETE | If no unique styles |
| `src/styles/icon-kit.css` | ✅ DELETE | If no unique styles |
| `src/styles/haiku-container.css` | ✅ DELETE | If no unique styles |
| `src/styles/verse-container.css` | ✅ DELETE | If no unique styles |
| `src/styles/margin-nav.css` | ✅ DELETE | If no unique styles |
| `src/App.css` | ✅ DELETE | All styles now in global.css |
| `src/components/layout/header.css` | ✓ MAYBE | Keep if it has unique styles |
| `src/components/onboarding/onboarding-wizard.css` | ✓ MAYBE | Keep if it has unique styles |

### Deletion Checklist

Before deleting each file:

1. **Search for imports**: Use your editor's find-in-files to search for the filename
   ```
   grep -r "import.*jobs.css" src/
   grep -r "@import.*jobs.css" src/
   ```

2. **Remove imports from index.css** (already done ✓)

3. **Search component imports**:
   ```
   grep -r "import.*css" src/components/
   ```

4. **Test the app** to ensure nothing breaks

5. **Delete the file**

---

## 🔍 Verification Checklist

After migration, verify everything works:

- [ ] App builds without errors: `npm run build`
- [ ] App runs locally: `npm run dev`
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] All buttons have correct colors (Terracotta, not gold)
- [ ] All components use correct tokens
- [ ] Spacing looks consistent
- [ ] Typography hierarchy is correct
- [ ] No hardcoded hex colors in component files
- [ ] No broken imports or console errors

---

## 📝 Component-Specific CSS

If a feature needs **unique**, **non-reusable** styles, keep them in a module-scoped CSS file:

**Keep this pattern:**
```
src/components/jobs/
├── JobCard.tsx
├── JobCard.module.css    ← Only unique styles for this component
└── ...
```

**Example JobCard.module.css** (minimal, reusable styles in global.css):
```css
/* Only custom layout or unique animations, NOT colors/tokens */
.jobCardGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);  /* Reuse token from global.css */
}

.jobCardAnimated {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Don't do this:**
```css
/* ❌ NO hardcoded colors */
.customButton {
  color: #d6a65c;  /* Should use var(--color-accent) */
  background: #f7ecda;  /* Should use var(--color-accent-soft) */
}
```

---

## 🎨 Token Reference

### Colors

**Primary Accent (Use for CTAs, highlights):**
```css
color: var(--color-accent);           /* Terracotta #a0715c */
background-color: var(--color-accent-hover);  /* Darker #8a5a42 */
background-color: var(--color-accent-soft);   /* Very soft #f5e5dc */
```

**Supporting Accent (Use for secondary actions):**
```css
color: var(--color-support);          /* Sage #5c7a6a */
color: var(--color-support-hover);    /* Darker sage #3d5a4c */
background-color: var(--color-support-soft);  /* Very soft #eaf3ef */
```

**Backgrounds:**
```css
background-color: var(--color-bg);              /* Ivory #f5f1e8 */
background-color: var(--color-surface);        /* Ivory-200 #ede8de */
background-color: var(--color-surface-hover);  /* Ivory-400 #d9d3c7 */
```

**Text:**
```css
color: var(--color-ink);              /* Primary text #1a1a1a */
color: var(--color-ink-secondary);    /* Secondary text #4a4a4a */
color: var(--color-ink-tertiary);     /* Muted text #8a8a8a */
color: var(--color-ink-inverse);      /* Text on colored bg */
```

**Status Colors:**
```css
color: var(--color-success);          /* Success #5c7a6a (sage) */
color: var(--color-warning);          /* Warning #a0715c (terracotta) */
color: var(--color-error);            /* Error #8b5c5c (dusty rose) */
color: var(--color-info);             /* Info #4a4a4a (ink) */
```

### Typography

**Font Families:**
```css
font-family: var(--font-display);     /* Bebas Neue - headings */
font-family: var(--font-body);        /* Lora - body text */
font-family: var(--font-poetic);      /* Crimson Text - poetic text */
font-family: var(--font-mono);        /* JetBrains Mono - code */
```

**Font Sizes:**
```css
font-size: var(--text-xs);    /* 12px */
font-size: var(--text-sm);    /* 14px */
font-size: var(--text-base);  /* 16px */
font-size: var(--text-lg);    /* 18px */
font-size: var(--text-xl);    /* 20px */
font-size: var(--text-2xl);   /* 24px */
/* ... up to --text-6xl (60px) */
```

**Line Heights:**
```css
line-height: var(--leading-tight);    /* 1.1 */
line-height: var(--leading-snug);     /* 1.3 */
line-height: var(--leading-normal);   /* 1.6 (default) */
line-height: var(--leading-relaxed);  /* 1.75 */
line-height: var(--leading-loose);    /* 2 */
```

### Spacing

**Scale (all multiples of 4px):**
```css
gap: var(--space-1);   /* 4px */
gap: var(--space-2);   /* 8px */
gap: var(--space-3);   /* 12px */
gap: var(--space-4);   /* 16px - DEFAULT */
gap: var(--space-5);   /* 20px */
gap: var(--space-6);   /* 24px */
gap: var(--space-8);   /* 32px */
gap: var(--space-10);  /* 40px */
/* ... up to --space-24 (96px) */
```

**Semantic Spacing:**
```css
padding: var(--space-component-inner);  /* 16px - internal padding */
padding: var(--space-component-pad);    /* 24px - standard padding */
gap: var(--space-element-gap);          /* 16px - items in a row */
gap: var(--space-row-gap);              /* 24px - gaps between rows */
gap: var(--space-section-gap);          /* 40px - between sections */
```

### Borders & Shadows

```css
border: var(--border-default);         /* 1px solid #c4c4c4 */
border: var(--border-strong);          /* 1px solid #8a8a8a */
border: var(--border-accent);          /* 2px solid terracotta */

box-shadow: var(--shadow-sm);          /* Subtle card shadow */
box-shadow: var(--shadow-md);          /* Medium hover shadow */
box-shadow: var(--shadow-lg);          /* Large modal shadow */
box-shadow: var(--shadow-glow);        /* Accent glow effect */
```

### Border Radius

```css
border-radius: var(--radius-sm);       /* 4px */
border-radius: var(--radius-md);       /* 8px */
border-radius: var(--radius-lg);       /* 12px */
border-radius: var(--radius-xl);       /* 16px - DEFAULT */
border-radius: var(--radius-2xl);      /* 24px */
border-radius: var(--radius-full);     /* 9999px - pills */
```

---

## 🛠️ Updating Tailwind Config

If you use Tailwind CSS, your `tailwind.config.ts` already extends global CSS variables.

**Nothing to change** – it already maps to `var(--color-accent)` etc.

Just ensure you use:
```tsx
<button className="bg-accent hover:bg-accent-hover text-white">
  Click me
</button>
```

Not:
```tsx
<button className="bg-[#d6a65c]">  {/* ❌ Never hardcode hex */}
  Click me
</button>
```

---

## 🚀 Going Forward

**When adding new styles:**

1. Ask: "Is this a reusable component pattern?"
   - **Yes**: Add to `src/styles/global.css` (appropriate section)
   - **No**: Add to component-scoped CSS file

2. Ask: "Do I need a new token?"
   - **Colors, spacing, shadows, etc.**: Add to global.css `:root`
   - **Document it** in this guide

3. Ask: "Should this be in Tailwind?"
   - **Keep it in global.css** – the single source of truth
   - Tailwind extends from global.css variables

4. **Always use tokens**, never hardcode values:
   ```css
   /* ✅ RIGHT */
   color: var(--color-accent);
   background: var(--color-surface);
   padding: var(--space-4);

   /* ❌ WRONG */
   color: #a0715c;
   background: #ede8de;
   padding: 16px;
   ```

---

## 📚 Quick Reference

| I want to... | Edit... | Location |
|--------------|---------|----------|
| Change button colors | `global.css` | Section 6, `.btn--primary` |
| Add a new component | `global.css` | Section 6, add new class |
| Adjust spacing scale | `global.css` | Section 2, `--space-*` tokens |
| Modify typography | `global.css` | Section 2 & 5 |
| Add dark mode colors | `global.css` | Section 3 |
| Add texture patterns | `global.css` | Section 7 |
| Component-specific style | `MyComponent.module.css` | Component directory |

---

## ✨ Benefits You Now Have

✅ **Single source of truth** – One place to find all styling
✅ **No conflicting definitions** – Tokens defined once
✅ **Easy to search** – Find styles in minutes, not hours
✅ **Consistent team patterns** – Everyone uses same tokens
✅ **Easier onboarding** – New devs understand system immediately
✅ **Reduced bundle size** – No scattered CSS files
✅ **Light/dark mode** – Works everywhere consistently
✅ **Terracotta + Sage** – Correct accent colors (no gold)

---

## 🆘 Troubleshooting

**Problem**: Colors look wrong after migration
**Solution**: Check `global.css` Section 2 for token definitions. Verify Terracotta (not gold).

**Problem**: Some styles aren't applying
**Solution**: Verify `src/index.css` imports `global.css`. Clear browser cache.

**Problem**: Dark mode looks off
**Solution**: Check Section 3 of `global.css` for dark mode overrides.

**Problem**: Components styling inconsistently
**Solution**: Ensure all CSS uses `var(--*)` tokens, not hardcoded values.

**Problem**: Can't find where a style is defined
**Solution**: Search `global.css` for the class name or use browser DevTools to inspect.

---

## Questions?

Refer to:
- `src/styles/global.css` – The authoritative source
- This guide – For token reference and patterns
- `src/themes/tokens.ts` – For TypeScript token exports (optional)

**Remember**: Everything is in one place. Check `global.css` first.
