# Dark Academia Refactoring Prompts - Page-by-Page Instructions

Use these detailed prompts with an agent to refactor each page. Each prompt is designed to be comprehensive and precise so an agent can execute refactoring without ambiguity.

---

## PROMPT 1: Dashboard Page Complete Refactor

### File: `src/pages/Dashboard.tsx`

You are refactoring the Dashboard page to match the Dark Academia Design System (see DARK_ACADEMIA_DESIGN_SYSTEM.md). This page currently has:
- Inconsistent card styles (stat cards, standard cards, news feed cards)
- Multiple button styles that don't match
- Broken emoji mood selector (doesn't fit aesthetic)
- Inconsistent icons

### Changes Required:

#### 1. Hero Section ("Clarity Hub" / Top Cards)
**Current Issues:**
- Inconsistent card borders and styling
- "RELEVNT" header position varies
- Mixing different card backgrounds

**Refactor to:**
- Keep the three stat cards (Active applications, In interviews, Saved opportunities)
- Apply `card card-stat` class to each
- Each card gets:
  - `border: 2px solid var(--color-border)`
  - `border-left: 4px solid var(--color-accent-secondary)` (copper)
  - `background: var(--color-bg-secondary)`
  - `padding: 24px`
  - Stat label: `font-size: 0.875rem; text-transform: uppercase; color: var(--color-text-secondary)`
  - Stat value: `font-size: 2.5rem; font-weight: 700; color: var(--color-accent-primary)`
  - Stat description: `font-size: 0.875rem; color: var(--color-text-secondary)`

#### 2. Emotion/Mood Selector (REMOVE)
**Current state:** "How are you feeling today?" section with emoji buttons

**Action:** This does NOT fit the Dark Academia aesthetic. Options:
- Option A: Remove entirely
- Option B: Replace with a simple wellness check-in text without emojis
- Recommend: Option A - Remove this section

#### 3. Success Rates Section
**Current Issues:**
- Stat boxes with different background colors (purple, gray, beige)
- Inconsistent styling

**Refactor to:**
- Use card cards with `border-left: 4px solid var(--color-accent-secondary)`
- All backgrounds: `var(--color-bg-secondary)`
- All stat labels: uppercase, 0.875rem, `var(--color-text-secondary)`
- All stat values: 2rem+, font-weight: 700, gold color

#### 4. Quick Actions Section
**Current Issues:**
- Mixed button colors (blue AI badges, different styles)
- Inconsistent card appearance

**Refactor to:**
- Each quick action card: `card` with gold left border
- Title: H3 style
- Description: small gray text
- Action button: `btn btn-secondary` OR `btn btn-primary` depending on CTA importance
- Remove all blue "AI" badges - integrate AI messaging into description instead

#### 5. Market Pulse / Today's Insights Cards
**Current Issues:**
- Different card styling than others
- Inconsistent borders and colors

**Refactor to:**
- Apply standard `card` styling
- Use gold left border accent
- Typography: H4 for title, small text for content
- Action links: `btn btn-ghost`

#### 6. Bottom Footer Section
**Current state:** "Authentic intelligence for real people..." text + copyright

**Keep as-is** but update colors:
- Text: `var(--color-text-secondary)`
- Links: `var(--color-accent-primary)` with underline

### CSS Classes to Use
```
card - base card styling
card-stat - for stat cards specifically
btn btn-primary - primary actions
btn btn-secondary - secondary actions
btn btn-ghost - tertiary/link actions
```

### Icons to Update
- Dashboard icon in sidebar: Use briefcase or gauge icon (SVG, 20px)
- Replace all colorful icons with consistent stroke-based icons
- All icons: `currentColor` so they inherit text color

### Colors to Apply
- All backgrounds: `--color-bg-secondary`
- All borders: `--color-border` with `--color-accent-secondary` for left accents
- All text: `--color-text-primary` or `--color-text-secondary` depending on hierarchy
- All interactive elements: `--color-accent-primary` on hover

### Typography to Apply
- "Clarity Hub" heading: H1 (Crimson Text, 2.5rem, 700 weight)
- Greeting "Good evening...": Body text, `--color-text-secondary`
- Card titles: H3 (1.5rem)
- Stat labels: All uppercase, 0.875rem, letter-spacing 0.1em, `--color-text-secondary`
- Section headers: H2 (2rem)

### Responsive Considerations
- Stat cards: 3 columns on desktop, 2 on tablet, 1 on mobile
- Success rates cards: 4 cards in a row or grid
- All cards maintain same padding/spacing across breakpoints

### Testing Checklist
- [ ] No hardcoded colors (all use CSS variables)
- [ ] All buttons use design system classes
- [ ] All cards have consistent styling (2px border, left accent)
- [ ] Typography follows scale (no random sizes)
- [ ] Spacing uses grid (multiples of 8px)
- [ ] Icons are consistent (stroke-based, 20-24px)
- [ ] Responsive design works at 1200px and 768px
- [ ] Hover/focus states properly styled
- [ ] Emotion selector removed or completely redesigned

---

## PROMPT 2: Jobs Feed Page Refactor (Relevnt Feed Tab)

### File: `src/pages/Jobs.tsx` (Feed variant)

Currently has:
- Single-column feed layout (correct concept)
- Inconsistent job card styling
- Multiple button types not unified
- Poor icon system
- Inconsistent metadata presentation

### Changes Required:

#### 1. Page Header / Hero Section
**Current state:** "Let Relevnt bring the right roles to you" with persona dropdown

**Refactor to:**
```tsx
<div className="page-header">
  <h1>Track</h1>
  <p>Let Relevnt bring the right roles to you.</p>
  <p className="subtitle">Browse your ranked feed or explore the full stream when you're in that mood.</p>
</div>
```

- H1: Crimson Text, 2.5rem, 700 weight, gold color
- Subtitle: regular body text, secondary gray
- Add: TRACK label above (small badge style, `--color-text-secondary`)

#### 2. Persona Selector + Feed Tabs
**Current state:** Persona dropdown + Relevant Feed / All Jobs toggle buttons

**Refactor to:**
```tsx
<div className="feed-controls">
  <select className="form-select">
    <option>Content Strategist</option>
  </select>
  <div className="tabs">
    <button className="tab active">Relevant Feed</button>
    <button className="tab">All jobs</button>
  </div>
</div>
```

- Use unified tab system from design system
- Dropdown: form-select styling
- Tabs: Active tab has gold left border, gold text
- Spacing between controls: 16px gap

#### 3. Job Cards (Feed Layout)
**Current issues:**
- Inconsistent button placement
- Mixed metadata styling
- No clear visual hierarchy

**Refactor each job card to:**
```tsx
<div className="card card-job-feed">
  <div className="card-header">
    <h3>Senior Mechanical Design Engineer</h3>
    <span className="badge badge-match weak">Weak Match 44</span>
  </div>

  <div className="card-meta">
    <span className="meta-item">
      <IconBriefcase /> Full-time
    </span>
    <span className="meta-item">
      <IconLocation /> Bradford
    </span>
    <span className="meta-item">
      <IconDollar /> $45,000 - $55,000
    </span>
  </div>

  <ul className="card-reasons">
    <li>✓ Senior level matches your preference</li>
    <li>✓ Salary $55k fits your range perfectly</li>
    <li>Skill requirements not specified</li>
  </ul>

  <div className="card-footer">
    <button className="btn btn-secondary btn-with-icon">
      View posting <IconArrow />
    </button>
    <button className="btn btn-ghost btn-with-icon">
      <IconSave /> Save
    </button>
    <button className="btn btn-ghost">✕ Dismiss</button>
  </div>
</div>
```

**Card Styling:**
- Background: `var(--color-bg-secondary)`
- Border: `2px solid var(--color-border)`
- Border-left: `4px solid var(--color-accent-secondary)` (copper)
- Padding: 24px
- Margin-bottom: 16px
- Border-radius: 8px
- Max-width: 800px (contained width for readability)

**Header:**
- Job title: H3 (Crimson Text, 1.5rem, 700)
- Match badge: Small gray badge with warning color if weak

**Metadata:**
- Icons: 16px stroke-based icons
- Each meta item: Background `var(--color-bg-tertiary)`, padding 6px 12px, border-radius 4px
- Text: 0.875rem, `var(--color-text-secondary)`
- Display: flex with 16px gap

**Reasons List:**
- Font-size: 0.875rem
- Color: `var(--color-text-secondary)`
- Checkmarks: green (✓)
- Bullet points: tertiary gray (•)
- Padding-left: 20px for list indent

**Buttons:**
- "View posting": btn-secondary with arrow icon
- "Save": btn-ghost with bookmark icon
- "Dismiss": btn-ghost with ✕ symbol

#### 4. Filter Section (Below Header)
**Current state:** "Tune your ranking" collapse-able section

**Refactor to:**
- Hide by default or move to collapsible panel
- When open, show:
  - Minimum salary: form-input with label
  - Remote friendly: form-checkbox
  - Other filters: form-select dropdowns
- All form elements use design system styling

#### 5. Empty State
**Current state:** "We couldn't load your matches right now..." message

**Keep styling but update:**
- Message text: body, secondary color
- "Try again" button: btn-secondary

### Icons to Use
- Briefcase: Employment type
- Map-pin: Location
- Dollar: Salary
- Clock: Posted date
- Bookmark: Save action
- Chevron-right: Arrow for "View posting →"
- X: Dismiss action

### Colors
- Card borders: copper (`--color-accent-secondary`)
- Text: primary/secondary from palette
- Buttons: gold primary, copper secondary
- Match badge: warning color if weak match

### Responsive Design
- Max container width: 800px
- Center content on page
- On mobile: cards go full width
- Metadata items wrap naturally

### Testing Checklist
- [ ] All job cards have copper left border
- [ ] All buttons use design system classes
- [ ] No hardcoded colors
- [ ] Icons are consistent size (16px)
- [ ] Metadata styled with background pills
- [ ] Card padding/spacing consistent
- [ ] Feed can scroll smoothly
- [ ] Empty states styled correctly
- [ ] Responsive at 768px (full width, stacked)

---

## PROMPT 3: Jobs Grid Page Refactor (All Jobs Tab)

### File: `src/pages/Jobs.tsx` (Grid variant)

Currently has:
- 3-column grid layout (correct)
- Inconsistent card sizing
- Mixed metadata display
- Unclear visual hierarchy

### Changes Required:

#### 1. Page Header
**Refactor to:**
```tsx
<div className="page-header">
  <div className="header-top">
    <h1>Discover</h1>
    <span className="label">TRACK</span>
  </div>
  <p>Let Relevnt bring the right roles to you.</p>
</div>
```

- H1: 2.5rem, gold color, Crimson Text
- TRACK label: uppercase, secondary gray, 0.75rem

#### 2. Filter Section
**Current state:** Sidebar with filters on left

**Keep layout but refactor styling:**
- Section container: full-width or sidebar depending on layout
- Labels: uppercase, 0.875rem, letter-spacing 0.1em, secondary gray
- Form elements: use design system inputs/selects/checkboxes
- "Refresh jobs" button: btn-primary
- "Clear filters" button: btn-secondary

**Filters:**
- Location: form-input
- Source: form-select
- Employment type: form-select
- Posted within: form-select
- Min salary: form-input
- Remote friendly: form-checkbox
- Sort by: form-select

#### 3. Job Cards (Grid Layout)
**Current issues:**
- Inconsistent card heights
- Mixed information architecture
- Unclear button placement

**Refactor to:**
```tsx
<div className="card card-job-grid">
  <div className="card-header">
    <h3>Language teachers</h3>
  </div>

  <div className="card-company">AE Virtual Class S.A • Americas</div>

  <div className="card-meta">
    <span className="meta-item">
      <IconBriefcase /> part_time
    </span>
    <span className="meta-item">
      <IconClock /> Posted Dec 20
    </span>
  </div>

  <div className="card-tags">
    <span className="tag">remote</span>
  </div>

  <div className="card-footer">
    <button className="btn btn-secondary btn-sm btn-with-icon">
      View <IconArrow />
    </button>
    <button className="btn btn-ghost btn-sm btn-with-icon">
      <IconSave />
    </button>
  </div>
</div>
```

**Card Styling:**
- Width: calc(33.333% - 12px) on desktop, 50% - 8px on tablet, 100% on mobile
- Background: `var(--color-bg-secondary)`
- Border: `2px solid var(--color-border)`
- Border-left: `4px solid var(--color-accent-secondary)` (copper)
- Padding: 16px (smaller than feed cards)
- Border-radius: 8px
- Min-height: 240px (consistent height)
- Display: flex with flex-direction: column

**Header:**
- Job title: H4 (1.25rem, Crimson Text, 700)

**Company:**
- Font-size: 0.875rem
- Color: `var(--color-text-secondary)`
- Margin: 6px 0 12px

**Meta Items:**
- Size: 0.75rem
- Icons: 14px
- Display: inline-flex with gap
- Color: `var(--color-text-secondary)`

**Tags:**
- Display: flex with flex-wrap: wrap, gap 6px
- Each tag: background `var(--color-bg-tertiary)`, padding 4px 10px, border-radius 4px, 0.75rem text

**Buttons:**
- Smaller size (btn-sm): padding 8px 16px
- Icons: 14px
- Both: btn-secondary and btn-ghost for consistency

**Card Footer:**
- Flex: 1 (stick to bottom)
- Margin-top: auto
- Border-top: 1px solid `var(--color-border)`
- Padding-top: 12px
- Buttons: 2 items flex with gap 8px

#### 4. Grid Container
**Structure:**
```tsx
<div className="card-grid-3col">
  {/* Job cards */}
</div>
```

**Styling:**
```css
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 16px;

@media (max-width: 1200px) {
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

### Icons
- Briefcase: 14px
- Clock: 14px
- Arrow: 14px
- Save: 14px (use bookmark icon)

### Colors
- Card borders: copper left accent
- Text: primary/secondary
- Buttons: secondary (bordered) and ghost (text)

### Responsive
- Desktop: 3 columns
- Tablet (1200px): 2 columns
- Mobile (768px): 1 column
- All cards maintain aspect and padding

### Testing Checklist
- [ ] Grid layout responsive (3 → 2 → 1 column)
- [ ] All cards same height minimum
- [ ] Footer buttons stick to bottom
- [ ] All form elements styled consistently
- [ ] Icons are consistent (14px)
- [ ] Card padding: 16px (smaller than feed)
- [ ] No hardcoded colors
- [ ] Hover states work on cards
- [ ] Filter section styling matches design system

---

## PROMPT 4: Applications Page Refactor

### File: `src/pages/Applications.tsx`

Currently has:
- Multiple inconsistent card styles
- Mismatched button colors (teal/blue theme)
- Tonal/style mismatches in different sections
- Emoji mood selector that doesn't fit

### Changes Required:

#### 1. Page Header
**Current state:** "Track where you're at in each process, without losing the plot"

**Refactor to:**
```tsx
<div className="page-header">
  <div className="header-top">
    <span className="label">TRACK</span>
  </div>
  <h1>Track where you're at in each process, without losing the plot.</h1>
  <p className="subtitle">Keep cada role, status, and timeline in one place. Future You has the receipts.</p>
</div>

<div className="stats">
  <div className="stat-item">
    <span className="stat-value">0</span>
    <span className="stat-label">Total</span>
  </div>
  <div className="stat-item">
    <span className="stat-value">0</span>
    <span className="stat-label">Active</span>
  </div>
</div>
```

- TRACK label: badge style, uppercase, secondary gray
- H1: 2.5rem, Crimson Text, 700 weight, gold color
- Subtitle: body text, secondary gray
- Stats: simple "0" with label below, large number in gold

#### 2. Status Filter Buttons
**Current state:** "All 0 | Applied 0 | Interview 0 | Active 0 | Offer 0 | Accepted 0 | Rejected 0 | Withdrawn 0"

**Refactor to:**
```tsx
<div className="filter-buttons">
  <button className="filter-btn active">All <span className="count">0</span></button>
  <button className="filter-btn">Applied <span className="count">0</span></button>
  <button className="filter-btn">Interview <span className="count">0</span></button>
  {/* ... more */}
</div>
```

**Styling:**
```css
.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 24px 0;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  .count {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  &:hover {
    border-color: var(--color-accent-primary);
    background: var(--color-bg-tertiary);
  }

  &.active {
    border-color: var(--color-accent-primary);
    background: var(--color-bg-tertiary);
    color: var(--color-accent-primary);
  }
}
```

**Color:** All buttons start as secondary style, active gets gold text and border

#### 3. Empty State
**Current state:** Hand-drawn icon + "Your story starts here" message

**Refactor to:**
- Icon: Replace hand-drawn with consistent stroke-based icon (like paper-plane)
- Heading: H2, "Your story starts here"
- Description: body text, secondary gray
- CTA Button: "Log your first application" as btn-primary

```tsx
<div className="empty-state">
  <IconPaperPlane className="empty-icon" />
  <h2>Your story starts here</h2>
  <p>When you apply to your first role, we'll track every step together — no spreadsheets required.</p>
  <button className="btn btn-primary">Log your first application</button>
</div>
```

**Styling:**
```css
.empty-state {
  text-align: center;
  padding: 64px 32px;

  .empty-icon {
    width: 48px;
    height: 48px;
    color: var(--color-accent-primary);
    opacity: 0.6;
    margin-bottom: 24px;
  }

  h2 {
    margin: 0 0 12px;
  }

  p {
    color: var(--color-text-secondary);
    margin: 0 0 24px;
  }
}
```

#### 4. Application Question Helper
**Current state:** Section with textarea, buttons for context and tone options

**Refactor to:**
```tsx
<div className="card card-helper">
  <div className="card-header">
    <h3>Application Question Helper</h3>
    <p className="subtitle">Paste a question from an application, add some context, and get a tailored draft based on your experience.</p>
  </div>

  <div className="form-group">
    <label htmlFor="question" className="form-label">Question from application</label>
    <textarea
      id="question"
      className="form-textarea"
      placeholder="e.g., 'Describe a time you failed and what you learned from it.'"
      rows="4"
    />
  </div>

  <button className="btn btn-secondary">
    <IconPlus /> Add Context (Optional)
  </button>

  <div className="tone-options">
    <label className="form-label">Tone / Mode</label>
    <div className="button-group">
      <button className="btn-option">Standard</button>
      <button className="btn-option">Concise</button>
      <button className="btn-option">Confident</button>
      <button className="btn-option">Metrics</button>
      <button className="btn-option">Values</button>
    </div>
  </div>

  <button className="btn btn-primary btn-lg">Draft Answer</button>
</div>
```

**Card Styling:** Standard card with gold left border

**Tone Buttons:**
```css
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.btn-option {
  padding: 8px 16px;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-accent-primary);
  }

  &.active {
    background: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: var(--color-bg-primary);
  }
}
```

### Colors Throughout
- Primary buttons: gold
- Secondary buttons: bordered, not filled
- Card borders: copper left accent
- All text: primary/secondary from palette
- No teal/blue colors anywhere

### Typography
- Page title: H1, Crimson Text, 2.5rem, gold
- Section titles: H3, Crimson Text
- Labels: uppercase, secondary gray, 0.875rem
- Body: regular, primary or secondary gray

### Icons
- Paper-plane or send icon for empty state
- Plus icon for "Add context"
- Consistent stroke style, 16-20px

### Responsive
- Filter buttons stack on mobile
- Card helper: full width with padding
- Empty state: centered, responsive padding

### Testing Checklist
- [ ] No teal/blue colors (replace with gold/copper)
- [ ] All buttons use design system classes
- [ ] Filter buttons have count badges
- [ ] Empty state icon is consistent with design system
- [ ] Form textarea styled correctly
- [ ] Card has copper left border
- [ ] All spacing uses grid
- [ ] No hardcoded colors
- [ ] Responsive at 768px

---

## PROMPT 5: Profile Analyzer Page Refactor

### File: `src/pages/ProfileAnalyzer.tsx`

Currently has:
- Black buttons (completely different from rest of app)
- White background section (doesn't match dark academia)
- Tab styling inconsistency
- Form field label styling inconsistency

### Changes Required:

#### 1. Page Header
**Current state:** "Profile Analyzer" heading with description

**Refactor to:**
```tsx
<div className="page-header">
  <div className="icon-header">
    <IconAnalyze className="header-icon" />
    <span className="label">OPTIMIZE YOUR PRESENCE</span>
  </div>
  <h1>Profile Analyzer</h1>
  <p>Get AI-powered feedback on your LinkedIn profile and portfolio. Optimize for recruiters, improve your narrative, and stand out.</p>
</div>
```

- Label: uppercase, 0.75rem, secondary gray
- H1: Crimson Text, 2.5rem, gold, 700 weight
- Description: body text, secondary gray

#### 2. Tabs (LinkedIn / Portfolio)
**Current state:** Two tabs with different styling each time

**Refactor to unified tabs:**
```tsx
<div className="tabs">
  <button className="tab active">
    <IconLinkedin className="tab-icon" />
    <span>LinkedIn</span>
  </button>
  <button className="tab">
    <IconBriefcase className="tab-icon" />
    <span>Portfolio</span>
  </button>
</div>
```

- Use design system tabs styling from DARK_ACADEMIA_DESIGN_SYSTEM.md
- Active tab: gold text, gold left border
- Icons: 16px, consistent style

#### 3. Tab Content - LinkedIn Section
**Current issues:**
- Black "START ANALYSIS" button (remove)
- Form fields have white background (change to dark academia colors)
- Labels in all caps with different styling

**Refactor to:**
```tsx
<div className="tab-pane active">
  <div className="card">
    <div className="form-group">
      <label htmlFor="linkedin-url" className="form-label">LinkedIn Profile URL</label>
      <input
        type="url"
        id="linkedin-url"
        className="form-input"
        placeholder="https://www.linkedin.com/in/your-profile"
      />
    </div>
    <button className="btn btn-primary btn-lg">Start Analysis</button>
  </div>
</div>
```

- Card: standard styling with gold left border
- Label: uppercase, 0.875rem, letter-spacing 0.1em, secondary gray
- Input: form-input styling (dark background, border)
- Button: btn-primary (gold), NOT black

#### 4. Tab Content - Portfolio Section
**Same as LinkedIn but with:**
```tsx
<div className="form-group">
  <label htmlFor="portfolio-url" className="form-label">Portfolio URL</label>
  <input
    type="url"
    id="portfolio-url"
    className="form-input"
    placeholder="https://yourname.com or https://behance.net/you"
  />
</div>
<button className="btn btn-primary btn-lg">Evaluate Portfolio</button>
```

- All form styling same as LinkedIn section
- Button: btn-primary, NOT black

### Colors Throughout
- All card backgrounds: `var(--color-bg-secondary)`
- All card borders: `2px solid var(--color-border)` with `border-left: 4px solid var(--color-accent-primary)` (gold left accent, not copper)
- Form inputs: `var(--color-bg-tertiary)` background
- All form labels: uppercase, secondary gray
- Buttons: primary (gold) OR secondary (bordered)
- **REMOVE all black button styling**
- **REMOVE all white backgrounds**

### Typography
- Page title: H1, 2.5rem, gold, Crimson Text
- Tab labels: 1rem, 600 weight
- Form labels: 0.875rem, uppercase, letter-spacing 0.1em, secondary gray
- Body: regular, secondary gray

### Icons
- Analyze icon for header (brain or target icon)
- LinkedIn icon for LinkedIn tab
- Briefcase icon for Portfolio tab
- All: 16-20px, stroke-based, `currentColor`

### Layout
- Main container: max-width 1000px, centered
- Tabs: full width
- Tab content: card styling
- Form groups: margin-bottom 20px
- Button: full width or auto depending on context

### Responsive
- Tabs: stack on mobile if needed
- Form inputs: full width
- Cards: full width on mobile, padded on desktop

### Testing Checklist
- [ ] No black buttons (all use design system)
- [ ] No white backgrounds (all use dark academia colors)
- [ ] Form labels uppercase and styled correctly
- [ ] Tab styling unified across both tabs
- [ ] Form inputs have correct background color
- [ ] Cards have gold left border accent
- [ ] Icons are consistent (16-20px stroke)
- [ ] All buttons are btn-primary (gold) with transitions
- [ ] No hardcoded colors
- [ ] Responsive at 768px

---

## PROMPT 6: Resume Pages Refactor

### File: `src/pages/Resume.tsx` and `src/components/ResumeBuilder.tsx`

Currently has:
- Multiple inconsistent tab systems
- Different button sizes and styles
- Uneven form field styling
- "Resume Coach" sidebar doesn't fit aesthetic
- Emotion/AI badges mixed in

### Changes Required:

#### 1. Resume Library Page - Header
**Current state:** "Resumes" with "Build, refine, and keep multiple resumes organized"

**Refactor to:**
```tsx
<div className="page-header">
  <div className="icon-header">
    <IconDocument className="header-icon" />
    <span className="label">BUILD</span>
  </div>
  <h1>Resumes</h1>
  <p>Build, refine, and keep multiple resumes organized. Toggle between your builder and library without losing your place.</p>
</div>
```

#### 2. Resume Tabs (Builder, Library, Cover Letters)
**Current state:** Mixed styled tabs

**Refactor to unified design system tabs:**
```tsx
<div className="tabs">
  <button className="tab active">
    <IconEdit className="tab-icon" />
    <span>Builder</span>
  </button>
  <button className="tab">
    <IconLibrary className="tab-icon" />
    <span>Library</span>
  </button>
  <button className="tab">
    <IconMail className="tab-icon" />
    <span>Cover Letters</span>
  </button>
</div>
```

- Active tab: gold text, gold left border, gold background
- Inactive: secondary gray text
- Icons: 16px, consistent style

#### 3. Resume Library Tab
**Current issues:**
- "New Resume" button and "Open Builder" button styling inconsistent
- Resume list cards don't match card system

**Refactor to:**
```tsx
<div className="tab-pane active">
  <div className="section-header">
    <h2>Your Resumes</h2>
    <p>Create, edit, and organize multiple resumes.</p>
  </div>

  <div className="section-actions">
    <button className="btn btn-primary">New Resume</button>
    <button className="btn btn-secondary">Open Builder</button>
  </div>

  <div className="resume-list">
    <div className="card card-resume">
      <div className="card-header">
        <h3>Untitled Resume</h3>
        <span className="meta">Updated 12/16/2025, 1:06:41 PM</span>
      </div>
      <div className="card-actions">
        <button className="btn btn-destructive btn-sm">Delete</button>
        <button className="btn btn-secondary btn-sm">Edit</button>
        <button className="btn btn-ghost btn-sm">Open</button>
      </div>
    </div>
    {/* More resume cards */}
  </div>
</div>
```

**Button Styling:**
- "New Resume": btn-primary (gold)
- "Open Builder": btn-secondary (bordered)
- "Edit": btn-secondary
- "Open": btn-ghost
- "Delete": btn-destructive (red)

**Resume Card:**
```css
background: var(--color-bg-secondary);
border: 2px solid var(--color-border);
border-left: 4px solid var(--color-accent-primary);  // Gold for resume emphasis
padding: 16px;
margin-bottom: 12px;
border-radius: 8px;
display: flex;
justify-content: space-between;
align-items: center;

.meta {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
}
```

#### 4. Resume Builder Tab
**Current issues:**
- Multiple tab systems (Contact, Summary, Skills, etc.)
- Two-column layout not clearly defined
- "Resume Coach" sidebar aesthetic mismatch

**Refactor layout:**
```tsx
<div className="tab-pane resume-builder">
  <div className="builder-header">
    <h2>Build your resume</h2>
    <div className="builder-tabs">
      <button className="builder-tab active">
        <IconUser className="tab-icon" />
        Contact
      </button>
      <button className="builder-tab">
        <IconFileText className="tab-icon" />
        Summary
      </button>
      <button className="builder-tab">
        <IconBriefcase className="tab-icon" />
        Experience
      </button>
      {/* More tabs */}
    </div>
  </div>

  <div className="builder-container">
    <div className="builder-form">
      {/* Form content for selected tab */}
    </div>
    <div className="builder-preview">
      {/* Resume preview */}
    </div>
    <div className="builder-tips">
      {/* Tips sidebar */}
    </div>
  </div>
</div>
```

**Builder Tabs:**
```css
.builder-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 2px solid var(--color-border);
  margin-top: 16px;
  padding-bottom: 12px;
}

.builder-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  position: relative;

  &:hover {
    color: var(--color-text-primary);
  }

  &.active {
    color: var(--color-accent-primary);

    &::after {
      content: '';
      position: absolute;
      bottom: -14px;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--color-accent-primary);
    }
  }
}
```

**Form Section:**
- Use form-group, form-label, form-input classes
- Labels: uppercase, 0.875rem, secondary gray
- Inputs: form-input styling
- No "Resume Coach" sidebar with tips - REMOVE completely or integrate into form descriptions

**Tips/Coach Sidebar Refactor:**
- Replace with inline callout boxes when needed
- Use `card card-info` with gold left border
- Small text (0.875rem), secondary gray
- Optional: only show when relevant

#### 5. Form Fields (General Styling for All Tabs)
**Contact section example:**
```tsx
<div className="form-group">
  <label htmlFor="fullname" className="form-label">Full name</label>
  <input
    type="text"
    id="fullname"
    className="form-input"
    placeholder="Your name"
    value="Sarah Sahl"
  />
</div>

<div className="form-group">
  <label htmlFor="headline" className="form-label">Headline (optional)</label>
  <input
    type="text"
    id="headline"
    className="form-input"
    placeholder="e.g., Content Strategist"
    value="Content Strategist | Digital Marketing | B2B Campaign Development"
  />
</div>

<div className="form-group">
  <label htmlFor="email" className="form-label">Email</label>
  <input
    type="email"
    id="email"
    className="form-input"
    placeholder="your@email.com"
    value="sarah@thepennylaneproject.org"
  />
</div>

<div className="form-group">
  <label htmlFor="phone" className="form-label">Phone</label>
  <input
    type="tel"
    id="phone"
    className="form-input"
    placeholder="+1 (555) 123-4567"
    value="515.231.3688"
  />
</div>

<div className="form-group">
  <label htmlFor="location" className="form-label">Location</label>
  <input
    type="text"
    id="location"
    className="form-input"
    placeholder="City, State"
    value="Ankeny, Iowa"
  />
</div>
```

**All form inputs:**
- Background: `var(--color-bg-tertiary)`
- Border: `2px solid var(--color-border)`
- Focus: gold border, gold shadow
- Padding: 12px 16px
- Font-size: 1rem
- Color: primary text

#### 6. Action Buttons in Builder
**Current state:** "Add context", "Accept all", "Regenerate" buttons with mixed styling

**Refactor to:**
```tsx
<button className="btn btn-secondary btn-with-icon">
  <IconPlus /> Add link
</button>

<div className="action-group">
  <button className="btn btn-primary">✓ Accept all</button>
  <button className="btn btn-ghost btn-with-icon">
    <IconRefresh /> Regenerate
  </button>
</div>
```

- Primary actions: btn-primary
- Secondary actions: btn-secondary
- Tertiary actions: btn-ghost
- Icons: 16px, included inline

### Colors Throughout
- Card borders: gold left accent (primary) for resume library
- Form styling: dark academia colors
- Buttons: primary (gold), secondary (bordered), ghost (text)
- Text: primary and secondary from palette
- **REMOVE Resume Coach sidebar** or redesign as inline callouts

### Typography
- Section title: H2
- Tab labels: 1rem, 600 weight
- Form labels: 0.875rem, uppercase, letter-spacing 0.1em, secondary gray
- Meta text: 0.75rem, tertiary gray

### Icons
- Document: for builder
- Library: for library tab
- Mail: for cover letters
- User, FileText, Briefcase, etc.: for section tabs
- All: 16px, consistent stroke style

### Layout
- Builder: 3-column (form, preview, tips) OR 2-column (form, preview)
- Tips sidebar: REMOVE completely OR convert to inline cards
- Form: max-width 500px
- Preview: scrollable, maintains formatting

### Responsive
- On tablet: 2 columns (form/preview stacked)
- On mobile: single column, preview below form
- Builder tabs: scroll horizontally if needed

### Testing Checklist
- [ ] Tabs unified design (active = gold text + left border)
- [ ] All buttons use design system classes
- [ ] Resume cards have gold left border
- [ ] Form labels uppercase, secondary gray
- [ ] Form inputs dark academia colors
- [ ] No "Resume Coach" sidebar OR completely redesigned
- [ ] Builder tabs styled consistently
- [ ] Icons 16px, consistent style
- [ ] No hardcoded colors
- [ ] No white backgrounds
- [ ] Responsive at 768px

---

## PROMPT 7: Settings/Preferences Pages Refactor

### File: `src/pages/Settings.tsx`

Currently has:
- Multiple tab systems (different styles each page)
- Pill/chip buttons not unified
- Sliders (brand new component type)
- Radio card options with unclear styling
- Multiple button group styles

### Changes Required:

#### 1. Settings Page Header
**Refactor to:**
```tsx
<div className="page-header">
  <div className="icon-header">
    <IconSettings className="header-icon" />
    <span className="label">SETTINGS</span>
  </div>
  <h1>Preferences</h1>
  <p>Customize how Relevnt matches and applies for you.</p>
</div>
```

#### 2. Settings Tabs (Persona, Career Targets, Profile, Voice & Style, System, Auto-Apply)
**Current state:** Inconsistent tab styling across tabs

**Refactor to unified tabs:**
```tsx
<div className="tabs">
  <button className="tab active">
    <IconUser className="tab-icon" />
    <span>Persona</span>
  </button>
  <button className="tab">
    <IconTarget className="tab-icon" />
    <span>Career Targets</span>
  </button>
  <button className="tab">
    <IconProfile className="tab-icon" />
    <span>Profile</span>
  </button>
  <button className="tab">
    <IconVoice className="tab-icon" />
    <span>Voice & Style</span>
  </button>
  <button className="tab">
    <IconGear className="tab-icon" />
    <span>System</span>
  </button>
  <button className="tab">
    <IconRobot className="tab-icon" />
    <span>Auto-Apply</span>
  </button>
</div>
```

- Use design system tabs: active = gold text + gold left border on tab, gold background
- Icons: 16px, consistent style

#### 3. Persona Tab
**Current state:** Persona cards + "Add new persona" button grid

**Refactor to:**
```tsx
<div className="tab-pane">
  <h2>Your personas</h2>
  <p>Click a persona to activate it. Your active persona shapes how Relevnt matches and applies for you.</p>

  <div className="card-grid">
    <div className="card card-persona">
      <h3>Content Strategist</h3>
      <p className="card-description">
        This persona is unemployed and trying to find a remote social media content strategist or similar role quickly.
      </p>
      <button className="btn btn-ghost">Click to activate</button>
    </div>
    {/* More persona cards */}
  </div>

  <div className="card">
    <h3>Add a new persona</h3>
    <p>Which best describes this search?</p>
    <div className="persona-options">
      <button className="option-button">
        <span className="option-title">Actively looking</span>
        <span className="option-desc">Ready to apply and interview</span>
      </button>
      <button className="option-button">
        <span className="option-title">Casually browsing</span>
        <span className="option-desc">Exploring the right direction</span>
      </button>
      <button className="option-button">
        <span className="option-title">Career pivot</span>
        <span className="option-desc">Changing into a new field</span>
      </button>
      <button className="option-button">
        <span className="option-title">Exploration / learning</span>
        <span className="option-desc">Just seeing what's out there</span>
      </button>
    </div>
  </div>
</div>
```

**Persona Card Styling:**
```css
.card-persona {
  padding: 16px;
  cursor: pointer;

  h3 {
    margin: 0 0 8px;
  }

  .card-description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 8px 0 12px;
  }

  &:hover {
    border-color: var(--color-accent-primary);
  }

  &.active {
    border-left: 6px solid var(--color-accent-primary);
    background: var(--color-bg-tertiary);
    box-shadow: 0 0 12px rgba(212, 165, 116, 0.3);
  }
}
```

**Option Buttons:**
```css
.persona-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.option-button {
  padding: 16px;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-accent-primary);
  }

  .option-title {
    display: block;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .option-desc {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }
}
```

#### 4. Career Targets Tab
**Current state:** Pill buttons for job titles, seniority levels, skills

**Refactor to:**
```tsx
<div className="tab-pane">
  <div className="section">
    <h3>Target job titles</h3>
    <p>Pick up to 5 titles. Type to search or add your own.</p>
    <div className="pill-input">
      <span className="pill">
        Digital Marketing Manager
        <button className="pill-remove">✕</button>
      </span>
      <span className="pill">
        Social Media Specialist
        <button className="pill-remove">✕</button>
      </span>
      <input
        type="text"
        className="pill-input-field"
        placeholder="Add more titles..."
      />
    </div>
  </div>

  <div className="section">
    <h3>Seniority levels</h3>
    <div className="button-group">
      <button className="btn-option">Junior</button>
      <button className="btn-option">Mid level</button>
      <button className="btn-option">Senior</button>
      <button className="btn-option">Lead</button>
      <button className="btn-option">Director</button>
    </div>
  </div>

  <div className="section">
    <h3>Skills to highlight</h3>
    <p>Type to search or add your own. We'll suggest related skills.</p>
    <div className="pill-input">
      <span className="pill">
        Strategic Planning <span className="count">3</span>
        <button className="pill-remove">✕</button>
      </span>
      {/* More pills */}
      <input
        type="text"
        className="pill-input-field"
        placeholder="Add more skills..."
      />
    </div>
  </div>

  <div className="card">
    <h3>Work location</h3>
    <p>Remote preference</p>
    <div className="button-group">
      <button className="btn-option">Remote only</button>
      <button className="btn-option">Hybrid</button>
      <button className="btn-option">Onsite</button>
    </div>

    <div className="form-group">
      <div className="slider-header">
        <label className="form-label">Location radius</label>
        <span className="slider-value">50</span>
      </div>
      <input type="range" min="0" max="500" value="50" className="form-slider" />
      <div className="slider-labels">
        <span>LOCAL</span>
        <span>ANYWHERE</span>
      </div>
    </div>
  </div>

  <div className="card">
    <h3>Compensation</h3>
    <p>This is never shared with employers. We use it to filter out roles below your floor.</p>
    <div className="form-group">
      <label htmlFor="salary" className="form-label">Minimum base salary</label>
      <div className="salary-input">
        <input
          type="text"
          id="salary"
          className="form-input"
          value="$50K USD/yr"
        />
      </div>
    </div>
    <div className="button-group">
      <button className="btn-option">Conservative</button>
      <button className="btn-option">Market average</button>
      <button className="btn-option">Stretch</button>
    </div>
  </div>
</div>
```

**Pill Input:** (Design system styling)
- Display: flex, flex-wrap: wrap, gap 8px
- Pills: dark background, gold left border, 6px padding, small font
- Each pill has removable X button

**Button Group:**
```css
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.btn-option {
  padding: 8px 16px;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-accent-primary);
  }

  &.active {
    background: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    color: var(--color-bg-primary);
  }
}
```

#### 5. Voice & Style Tab
**Current state:** Voice card options + sliders + confirmation buttons

**Refactor to:**
```tsx
<div className="tab-pane">
  <div className="card">
    <h3>Choose your voice</h3>
    <p>This sets the base tone for all AI-generated content. Pick what feels most like you.</p>
    <div className="radio-card-group">
      <label className="radio-card">
        <input type="radio" name="voice" value="direct" />
        <div className="radio-card-content">
          <h4>Direct & confident</h4>
          <p>Clear, assertive, no fluff</p>
        </div>
      </label>
      <label className="radio-card active">
        <input type="radio" name="voice" value="warm" checked />
        <div className="radio-card-content">
          <h4>Warm & human</h4>
          <p>Approachable and personable</p>
        </div>
      </label>
      <label className="radio-card">
        <input type="radio" name="voice" value="strategic" />
        <div className="radio-card-content">
          <h4>Strategic & concise</h4>
          <p>Business-focused, efficient</p>
        </div>
      </label>
      <label className="radio-card">
        <input type="radio" name="voice" value="technical" />
        <div className="radio-card-content">
          <h4>Technical & precise</h4>
          <p>Detail-oriented, specific</p>
        </div>
      </label>
    </div>
  </div>

  <div className="card">
    <h3>Fine-tune your tone</h3>
    <p>Adjust these sliders to dial in exactly how you want to sound.</p>

    <div className="form-group">
      <div className="slider-header">
        <label className="form-label">Formality</label>
        <span className="slider-value">35</span>
      </div>
      <input type="range" min="0" max="100" value="35" className="form-slider" />
      <div className="slider-labels">
        <span>CASUAL</span>
        <span>FORMAL</span>
      </div>
    </div>

    <div className="form-group">
      <div className="slider-header">
        <label className="form-label">Boldness</label>
        <span className="slider-value">50</span>
      </div>
      <input type="range" min="0" max="100" value="50" className="form-slider" />
      <div className="slider-labels">
        <span>CONSERVATIVE</span>
        <span>BOLD</span>
      </div>
    </div>
  </div>

  <div className="card">
    <h3>Your headline</h3>
    <p>This is how you'll appear in applications. Does it look right?</p>
    <div className="form-group">
      <textarea
        className="form-textarea"
        rows="2"
        value="Content Strategist | Digital Marketing | B2B Campaign Development | Social Media Management | CRM Pipeline Management"
      />
    </div>
    <div className="action-group">
      <button className="btn btn-secondary btn-with-icon">
        <IconEdit /> Edit
      </button>
      <button className="btn btn-ghost btn-with-icon">
        <IconRefresh /> Regenerate
      </button>
    </div>
  </div>

  <div className="card">
    <h3>Key strengths</h3>
    <p>We extracted these from your resume. Use them as-is or tweak slightly.</p>
    <ul className="strengths-list">
      <li>Led cross-functional teams of 5-12 through complex product launches</li>
      <li>Increased user engagement 40% through data-driven feature prioritization</li>
      <li>Expert in translating stakeholder needs into actionable roadmaps</li>
    </ul>
    <div className="action-group">
      <button className="btn btn-primary">✓ Accept all</button>
      <button className="btn btn-ghost btn-with-icon">
        <IconRefresh /> Regenerate
      </button>
    </div>
  </div>

  <div className="card">
    <h3>Quick confirmations</h3>
    <p>These answers get reused across applications so you don't need to re-type them.</p>

    <div className="confirmation-group">
      <div className="confirmation-question">
        <h4>Do you require visa sponsorship?</h4>
        <div className="button-group">
          <button className="btn-option">No</button>
          <button className="btn-option">Yes</button>
        </div>
      </div>

      <div className="confirmation-question">
        <h4>Open to relocation?</h4>
        <div className="button-group">
          <button className="btn-option">No</button>
          <button className="btn-option active">Yes</button>
          <button className="btn-option">Depends on role</button>
        </div>
      </div>

      <div className="confirmation-question">
        <h4>Travel preference</h4>
        <div className="button-group">
          {/* Travel options */}
        </div>
      </div>
    </div>
  </div>

  <div className="card">
    <h3>Quick actions</h3>
    <button className="btn btn-secondary btn-with-icon">
      <IconRefresh /> Match my resume tone
    </button>
  </div>
</div>
```

**Radio Card Group:** (from design system)
- Grid layout: 4 columns, auto-fit
- Cards: 200px+ min-width
- Active state: gold border, gold shadow, different background
- Styling: padding 16px, border-radius 8px

**Slider:** (from design system)
- Input[type="range"]: 6px height, background dark
- Thumb: 18px gold circle
- Labels below: all-caps, 0.75rem, secondary gray
- Value display: large, gold, top right

**Confirmation Group:**
```css
.confirmation-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.confirmation-question {
  h4 {
    margin: 0 0 12px;
    font-size: 1rem;
    color: var(--color-text-primary);
  }
}
```

### Colors Throughout
- Card borders: gold left accent (primary actions) or copper secondary accent
- Buttons: primary (gold), secondary (bordered), ghost (text)
- Form elements: dark academia colors
- Text: primary and secondary palette
- Radio cards: gold when active

### Typography
- Section titles: H3 (1.5rem)
- Card titles: 1.125rem, 600 weight
- Labels: 0.875rem, uppercase, letter-spacing 0.05em, secondary gray
- Value displays: 1.25rem+, gold, bold
- Body text: regular, secondary gray

### Icons
- User: persona
- Target: career targets
- Profile: profile tab
- Voice: voice & style
- Gear: system
- Robot: auto-apply
- All: 16px, consistent stroke style

### Layout
- Full-width sections with consistent padding
- Cards: max-width 100%, padding 24px
- Form elements: consistent spacing (grid multiples)
- Button groups: flex wrap, 8px gap
- Responsive: single column on mobile, maintain structure on desktop

### Responsive
- All sections: full width on mobile
- Button groups: stack on small screens
- Sliders: full width
- Radio cards: 2 columns on tablet, 1 on mobile
- Tab navigation: scroll on mobile if needed

### Testing Checklist
- [ ] All tabs unified design (gold active indicator)
- [ ] Pills/chips have correct styling (gold left border)
- [ ] All buttons use design system classes
- [ ] Sliders functional and styled correctly
- [ ] Radio cards have gold active state
- [ ] Form inputs dark academia colors
- [ ] All form labels uppercase, secondary gray
- [ ] No hardcoded colors
- [ ] Icons 16px, consistent style
- [ ] Responsive at 768px
- [ ] Tab content scrolls properly on mobile

---

## Summary

These seven prompts cover every major page/component in Relevnt. Each prompt is designed to be:
1. **Specific** - Exact component names, classes, styling rules
2. **Complete** - All colors, typography, icons, sizing
3. **Actionable** - Can be given to an agent to execute
4. **Testable** - Includes testing checklist

Use them in order (Prompts 1-7) to systematically refactor the entire app to Dark Academia design system coherence.

