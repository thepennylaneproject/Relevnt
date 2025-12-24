# Relevnt Dark Academia Design System Specification

**Version:** 1.0
**Status:** Design Specification (Ready for Implementation)
**Target Aesthetic:** Dark Academia / Dark Cottage Core / Old Library
**Philosophy:** Quiet yet bold. Sophisticated, calm, intentional. Like studying in a 200-year-old library at midnight.

---

## 1. COLOR SYSTEM

### 1.1 Primary Palette

#### Backgrounds (Neutral Base)
| Token | Color | Usage | Hex |
|-------|-------|-------|-----|
| `--color-bg-primary` | Deep Navy | Main background, page surfaces | `#0F1419` |
| `--color-bg-secondary` | Dark Charcoal | Cards, elevated surfaces | `#1A1F2E` |
| `--color-bg-tertiary` | Slate Gray | Hover states, slight elevation | `#252D3D` |
| `--color-bg-hover` | Dark Taupe | Interactive hover states | `#2F3740` |
| `--color-bg-input` | Dark Navy with tint | Form inputs | `#111622` |

#### Text (Neutral Foreground)
| Token | Color | Usage | Hex |
|-------|-------|-------|-----|
| `--color-text-primary` | Off-White | Headings, primary text | `#F5F3F0` |
| `--color-text-secondary` | Light Gray | Secondary text, labels | `#B8B5B0` |
| `--color-text-tertiary` | Medium Gray | Muted text, hints | `#8B8681` |
| `--color-text-inverse` | Near Black | On light accent backgrounds | `#0F1419` |

#### Accent Colors (Rich & Jewel-toned)
| Token | Color | Usage | Hex | Notes |
|-------|-------|-------|-----|-------|
| `--color-accent-primary` | Warm Gold | Primary CTAs, highlights, brand | `#D4A574` | Worn gold, not bright |
| `--color-accent-secondary` | Copper | Secondary CTAs, borders | `#A0826D` | Older copper, subtle |
| `--color-accent-tertiary` | Deep Emerald | Accents, success indicators | `#2D5A4A` | Rich, dark jewel tone |
| `--color-accent-blue` | Slate Blue | Links, interactive | `#5B7C99` | Muted blue-gray |

#### Semantic Colors
| Token | Color | Usage | Hex |
|-------|-------|-------|-----|
| `--color-success` | Muted Sage | Success states, confirmations | `#7A9B6B` |
| `--color-warning` | Burnt Orange | Warnings, caution | `#B8743F` |
| `--color-error` | Muted Red | Errors, destructive | `#A85545` |
| `--color-info` | Slate Blue | Informational | `#5B7C99` |

#### Borders & Dividers
| Token | Color | Usage | Hex |
|-------|-------|-------|-----|
| `--color-border-subtle` | Very Dark Gray | Subtle dividers | `#3A3F4A` |
| `--color-border-default` | Dark Gray | Standard borders | `#4A505B` |
| `--color-border-accent` | Warm Gold | Accent borders, focus rings | `#D4A574` |

---

## 2. TYPOGRAPHY SYSTEM

### 2.1 Font Stacks

#### Headings (Brand, Serif)
```css
--font-heading: "Crimson Text", "Playfair Display", "Lora", serif;
```
- **Desktop Usage:** Main headings (H1, H2), hero text, feature names
- **Weight:** 400 (regular) for H1/H2; 600 (semibold) for smaller headings
- **Size Scale:**
  - H1: 48px / 56px (desktop/mobile)
  - H2: 32px / 28px
  - H3: 24px / 20px
  - H4: 18px / 16px
- **Characteristics:** Elegant, classic, gives "old library" feel

#### Body Text (Clean, Sans-serif)
```css
--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif;
```
- **Desktop Usage:** Body text, labels, descriptions
- **Weight:** 400 (regular) body; 500 (medium) labels; 600 (semibold) emphasis
- **Size Scale:**
  - Body: 15px / 14px (desktop/mobile)
  - Small: 13px / 12px
  - XSmall: 11px / 10px
- **Line Height:** 1.6 (body), 1.4 (labels), 1.2 (headings)

#### Monospace (Code, Data)
```css
--font-mono: "SF Mono", "Monaco", "Inconsolata", monospace;
```
- **Usage:** Timestamps, salary displays, code snippets
- **Size:** 12px
- **Color:** `--color-accent-secondary` (copper)

### 2.2 Typography Scale & Hierarchy

| Element | Font | Size | Weight | Color | Line Height |
|---------|------|------|--------|-------|-------------|
| Page Title (H1) | Crimson Text | 48px | 400 | `--color-text-primary` | 1.2 |
| Section Title (H2) | Crimson Text | 32px | 400 | `--color-text-primary` | 1.3 |
| Card Title (H3) | Crimson Text | 20px | 500 | `--color-text-primary` | 1.3 |
| Label/Button | Body | 13px | 600 | `--color-text-secondary` | 1.4 |
| Body Text | Body | 15px | 400 | `--color-text-primary` | 1.6 |
| Caption/Helper | Body | 12px | 400 | `--color-text-tertiary` | 1.4 |
| Timestamp | Monospace | 11px | 400 | `--color-accent-secondary` | 1.4 |

---

## 3. COMPONENT LIBRARY UPDATES

### 3.1 Cards & Surfaces

#### Surface Card (Primary Container)
```css
background: var(--color-bg-secondary);
border: 1px solid var(--color-border-subtle);
border-radius: 12px;
padding: 24px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
transition: all 0.2s ease;
```
- **On Hover:** Border becomes `--color-border-accent` (gold)
- **Active State:** Box shadow deepens to `0 8px 24px rgba(212, 165, 116, 0.15)`

#### Job Card (Specific)
```css
background: var(--color-bg-secondary);
border-left: 3px solid var(--color-accent-secondary);
padding: 16px 20px;
```
- **Title:** Crimson Text, 16px, 500, `--color-text-primary`
- **Company:** Body, 13px, 400, `--color-text-secondary`
- **Tags:** Small background `var(--color-bg-tertiary)`, text `--color-text-secondary`

#### Application Card (Status Indicator)
```css
background: var(--color-bg-secondary);
border-top: 4px solid [status-color];
```
- Status colors:
  - Applied: `--color-accent-blue` (#5B7C99)
  - Interviewing: `--color-accent-primary` (#D4A574)
  - Offer: `--color-success` (#7A9B6B)
  - Rejected: `--color-error` (#A85545)

---

### 3.2 Buttons

#### Primary Button
```css
background: var(--color-accent-primary);
color: var(--color-text-inverse);
border: none;
border-radius: 8px;
padding: 12px 24px;
font-weight: 600;
font-size: 14px;
cursor: pointer;
transition: all 0.2s ease;
```
- **Hover:**
  - Background: Lighten by 10% (`#E5B589`)
  - Box shadow: `0 4px 12px rgba(212, 165, 116, 0.3)`
  - Transform: translateY(-2px)
- **Active:** Darken by 15% (`#C49559`)
- **Disabled:** Opacity 50%, cursor not-allowed

#### Secondary Button (Outline)
```css
background: transparent;
border: 1px solid var(--color-border-default);
color: var(--color-text-primary);
border-radius: 8px;
padding: 11px 23px;
```
- **Hover:**
  - Border color: `--color-accent-primary`
  - Background: `var(--color-bg-tertiary)`

#### Ghost Button (Minimal)
```css
background: transparent;
border: none;
color: var(--color-accent-secondary);
text-decoration: underline;
```
- **Hover:** Color becomes `--color-accent-primary`

---

### 3.3 Forms & Inputs

#### Text Input
```css
background: var(--color-bg-input);
border: 1px solid var(--color-border-subtle);
border-radius: 8px;
padding: 12px 14px;
color: var(--color-text-primary);
font-size: 14px;
font-family: var(--font-body);
```
- **Focus:** Border becomes `--color-accent-primary`, box-shadow: `0 0 0 3px rgba(212, 165, 116, 0.1)`
- **Placeholder:** Color `--color-text-tertiary`

#### Checkbox & Radio
```css
accent-color: var(--color-accent-primary);
width: 18px;
height: 18px;
```
- **Label:** Body text, 14px, `--color-text-primary`

#### Select Dropdown
```css
background: var(--color-bg-input);
color: var(--color-text-primary);
border: 1px solid var(--color-border-subtle);
border-radius: 8px;
padding: 10px 14px;
font-size: 13px;
```
- **Focus:** Border `--color-accent-primary`, box-shadow as input

#### Slider
```css
accent-color: var(--color-accent-primary);
height: 4px;
border-radius: 2px;
```
- **Track:** Background `var(--color-bg-tertiary)`
- **Thumb:** Background `var(--color-accent-primary)`, size 18px x 18px

---

### 3.4 Navigation & Tabs

#### Sidebar Navigation
```css
background: var(--color-bg-secondary);
border-right: 1px solid var(--color-border-subtle);
```
- **Navigation Item (Default):**
  - Padding: 12px 16px
  - Color: `--color-text-secondary`
  - Icon: Opacity 60%
- **Navigation Item (Active):**
  - Background: `var(--color-bg-tertiary)`
  - Color: `--color-accent-primary`
  - Border-left: 3px solid `--color-accent-primary`
  - Icon: Opacity 100%

#### Tab Navigation
```css
border-bottom: 1px solid var(--color-border-subtle);
```
- **Tab Button:**
  - Background: transparent
  - Color: `--color-text-secondary`
  - Padding: 12px 20px
  - Border-bottom: 2px solid transparent
  - Font: Body 14px, 500
- **Tab Button (Active):**
  - Color: `--color-accent-primary`
  - Border-bottom: 2px solid `--color-accent-primary`

---

### 3.5 Badges & Pills

#### Status Badge
```css
background: [status-color] with 20% opacity
color: [status-color-light]
border-radius: 4px
padding: 4px 8px
font-size: 11px
font-weight: 600
text-transform: uppercase
letter-spacing: 0.05em
```

#### Feature Pill
```css
background: var(--color-bg-tertiary)
border: 1px solid var(--color-border-subtle)
color: var(--color-text-secondary)
border-radius: 6px
padding: 6px 12px
font-size: 12px
```
- **On Remove:** Opacity 0.6, cursor pointer
- **Hover:** Border becomes `--color-accent-secondary`

---

### 3.6 Modals & Overlays

#### Modal Container
```css
background: var(--color-bg-secondary);
border: 1px solid var(--color-border-default);
border-radius: 12px;
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
padding: 32px;
max-width: 500px;
```

#### Overlay (Backdrop)
```css
background: rgba(0, 0, 0, 0.6);
backdrop-filter: blur(4px);
```

---

## 4. SPACING & LAYOUT

### 4.1 Spacing Scale
```
--space-xs: 4px
--space-sm: 8px
--space-md: 12px
--space-lg: 16px
--space-xl: 24px
--space-2xl: 32px
--space-3xl: 48px
--space-4xl: 64px
```

### 4.2 Container & Grid
- **Max Width:** 1200px (large screens), 100% - 32px (mobile)
- **Grid Gutter:** 16px (desktop), 12px (mobile)
- **Card Grid:** `repeat(auto-fit, minmax(320px, 1fr))` for job/application cards
- **Sidebar Width:** 280px (desktop), 100vw (mobile, overlay)

### 4.3 Page Padding
- **Desktop:** 32px top/bottom, 40px left/right
- **Mobile:** 16px top/bottom, 16px left/right

---

## 5. DARK MODE IMPLEMENTATION

### 5.1 CSS Variables Mapping

Create a new stylesheet: `src/styles/theme-dark-academia.css`

```css
:root {
  /* Backgrounds */
  --color-bg: #0F1419;
  --color-bg-alt: #1A1F2E;
  --color-surface: #252D3D;
  --color-surface-soft: #1A1F2E;

  /* Text */
  --color-ink: #F5F3F0;
  --color-ink-secondary: #B8B5B0;
  --color-ink-tertiary: #8B8681;

  /* Accent */
  --color-accent: #D4A574;
  --color-accent-primary: #D4A574;
  --color-accent-secondary: #A0826D;
  --color-accent-light: #E5B589;
  --color-accent-glow: rgba(212, 165, 116, 0.1);

  /* Borders */
  --border: 1px solid #3A3F4A;
  --border-accent: 1px solid #D4A574;
  --border-subtle: 1px solid #2F3740;

  /* Semantic */
  --color-success: #7A9B6B;
  --color-warning: #B8743F;
  --color-error: #A85545;
  --color-info: #5B7C99;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.5);

  /* Fonts */
  --font-display: "Crimson Text", serif;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

### 5.2 Existing Component Updates

Update `/src/contexts/RelevntThemeProvider.tsx` to include dark academia theme:

```tsx
const darkAcademiaTheme = {
  colors: {
    bg: '#0F1419',
    bgSecondary: '#1A1F2E',
    text: '#F5F3F0',
    textSecondary: '#B8B5B0',
    accent: '#D4A574',
    border: '#3A3F4A',
  },
  // ... rest of theme
};
```

---

## 6. SPECIFIC PAGE UPDATES

### 6.1 Dashboard / Clarity Hub
- **Hero Section Background:** `--color-bg-primary`
- **Stat Cards:** Gold accent on top border (3px)
- **Quick Actions Panel:** Cards with gold hover border
- **Sidebar (Wellness, Market Pulse):** Copper text for insights
- **Charts/Graphs:** Use accent colors (gold for primary, emerald for success)

### 6.2 Jobs Page
- **Header:** Large Crimson Text title
- **Filter Panel:** Dark navy background, gold accent on active filter
- **Job Cards:** Gold left border (3px), copper company name, sage green tags
- **Match Scores:** Copper monospace text

### 6.3 Applications Tracker
- **Hero Title:** Crimson Text, 48px
- **Kanban/List View:** Card borders colored by status (blue for applied, gold for interviewing, sage for offer)
- **Status Badges:** Jewel-toned, subtle backgrounds
- **Timeline:** Copper connecting line with emerald milestones

### 6.4 Resume Workspace
- **Section Titles:** Crimson Text, 20px
- **AI Suggestion Highlight:** Subtle gold background (`rgba(212, 165, 116, 0.08)`)
- **Score Display:** Copper monospace, large bold number
- **Edit Buttons:** Gold with hover effect

### 6.5 Settings Pages
- **Tab Navigation:** Gold underline on active
- **Section Headers:** Crimson Text, 20px
- **Toggle Switches:** Gold accent color
- **Help Text:** Light gray, 12px

### 6.6 Interview Prep Center
- **Header:** Crimson Text
- **Template Cards:** Gold left border, copper subtitle
- **Mode Selection Buttons:** Gold active state
- **Feedback Areas:** Muted emerald for success, burnt orange for areas to improve

### 6.7 Profile Analyzer
- **Score Cards:** Large Crimson Text number, copper label
- **Share Section:** Gold "Enable Sharing" button
- **Suggestion Cards:** Gold accent bar on left, copper heading

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Files to Update)
- [ ] `src/styles/theme-dark-academia.css` (NEW) - CSS variables
- [ ] `src/contexts/RelevntThemeProvider.tsx` - Add theme object
- [ ] `src/styles/index.css` - Import new theme stylesheet
- [ ] `src/styles/globals.css` - Update body background, text color

### Phase 2: Components (Batch Update)
- [ ] Buttons: `src/components/ui/Button.tsx` (if exists) or component styles
- [ ] Cards: All surface-card elements
- [ ] Forms: Inputs, selects, checkboxes in `src/components/settings/`
- [ ] Navigation: Sidebar in `src/components/layout/`
- [ ] Badges: Status indicators throughout app

### Phase 3: Page Layouts
- [ ] Dashboard: `src/pages/DashboardPage.tsx`
- [ ] Jobs: `src/pages/JobsPage.tsx`
- [ ] Applications: `src/pages/ApplicationsPage.tsx`
- [ ] Resume: `src/pages/ResumeWorkspacePage.tsx`
- [ ] Settings: `src/pages/SettingsHub.tsx` + tabs
- [ ] Interview Prep: `src/pages/InterviewPrepCenter.tsx`
- [ ] Profile Analyzer: `src/pages/ProfileAnalyzer.tsx`

### Phase 4: Refinement
- [ ] Test contrast ratios (WCAG AA minimum 4.5:1 for body text)
- [ ] Test on light/dark OS settings
- [ ] Animation & transition smoothness
- [ ] Mobile breakpoints (ensure spacing is preserved)

---

## 8. DESIGN TOKENS REFERENCE

### Color Palette Hex Codes (Copy-Paste Ready)
```
Primary Black:    #0F1419
Charcoal:         #1A1F2E
Dark Gray:        #252D3D
Medium Gray:      #3A3F4A
Light Gray:       #8B8681
Off-White:        #F5F3F0
Gold (Accent):    #D4A574
Copper:           #A0826D
Emerald:          #2D5A4A
Blue-Gray:        #5B7C99
Sage:             #7A9B6B
Burnt Orange:     #B8743F
Muted Red:        #A85545
```

### CSS Variable Export (Copy-Paste Ready)
```css
/* Use in any component */
background-color: var(--color-bg-primary);
color: var(--color-text-primary);
border: var(--border-accent);
box-shadow: var(--shadow-md);
font-family: var(--font-heading);
padding: var(--space-lg);
```

---

## 9. VISUAL REFERENCES & INSPIRATION

**Aesthetic Goals:**
- Dark academia: Old library, 200-year-old study room at midnight
- Quiet yet bold: Minimalist layout, rich color accents (not overwhelming)
- Worn gold, not bright: Muted metallics that feel authentic, not cheap
- Sophisticated simplicity: Serif headings + clean sans-serif body
- Calm under pressure: Warm neutral backgrounds, soft shadows

**Reference Palettes:**
- Dark: Deep navy (#0F1419) like a library ceiling
- Warm Accent: Gold (#D4A574) like old book spines and desk lamps
- Jewel Tones: Emerald (#2D5A4A), sage (#7A9B6B) for subtle richness
- Text: Off-white (#F5F3F0) that's easy on the eyes at night

---

## 10. CHECKLIST FOR IMPLEMENTATION

- [ ] Install Crimson Text font via Google Fonts or self-hosted
- [ ] Create theme CSS file with all variables
- [ ] Update ThemeProvider context
- [ ] Test on all major components (buttons, cards, forms, nav)
- [ ] Test contrast ratios with WCAG checker
- [ ] Screenshot each major page in dark academia
- [ ] Test mobile responsiveness
- [ ] Test focus states and keyboard navigation
- [ ] Get visual designer approval
- [ ] Merge to main branch
- [ ] Deploy to production

---

**Next Step:** Hand this spec to engineering team for Phase 1 implementation (foundation CSS + theme). Estimated effort: 4-6 hours for Phase 1, 8-12 hours for full implementation across all pages.
