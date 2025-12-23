# Dark Academia Design System - Complete Specification

## Overview

This document defines the unified Dark Academia design system for Relevnt. The app currently has **20+ inconsistent button styles, 5+ incompatible card systems, multiple tab implementations, broken icon system, and zero visual hierarchy**. This specification creates ONE cohesive system to implement across all pages.

---

## 1. COLOR PALETTE

### Primary Dark Academia Colors
```css
--color-bg-primary: #0F1419;         /* Deep navy - main background */
--color-bg-secondary: #1A1F2B;       /* Slightly lighter navy - cards */
--color-bg-tertiary: #242A3A;        /* Even lighter - hover states */

--color-accent-primary: #D4A574;     /* Warm gold - primary accent */
--color-accent-secondary: #A0826D;   /* Copper - secondary accent */

--color-text-primary: #F5F3F0;       /* Off-white - main text */
--color-text-secondary: #C8C6C3;     /* Muted beige - secondary text */
--color-text-tertiary: #9C9A97;      /* Gray - tertiary text */

--color-border: #3D4554;             /* Border color for cards/inputs */
--color-border-accent: #A0826D;      /* Copper borders for emphasis */
```

### Semantic Colors
```css
--color-success: #7A9B6B;            /* Muted sage green */
--color-warning: #C9A569;            /* Warm amber */
--color-error: #A87B7B;              /* Muted rust red */
--color-info: #6B8FA8;               /* Muted slate blue */

--color-highlight: #D4A574;          /* Gold highlight for active states */
```

### Deprecated Colors (REMOVE)
- Light theme beiges, multiple blues, blacks, grays
- Emoji colors from mood selector
- All non-dark-academia accent colors

---

## 2. TYPOGRAPHY SYSTEM

### Font Family
```css
--font-serif: 'Crimson Text', Georgia, serif;      /* Headings, display text */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;  /* Body */
```

### Type Scale
```
H1: 2.5rem (40px)  - 700 weight - Page titles, hero sections
H2: 2rem   (32px)  - 700 weight - Section headers
H3: 1.5rem (24px)  - 700 weight - Card titles
H4: 1.25rem (20px) - 700 weight - Subsection headers
H5: 1rem   (16px)  - 600 weight - Small headers, labels
H6: 0.875rem (14px) - 600 weight - Tiny labels, caps

Body: 1rem   (16px) - 400 weight - Regular text
Body small: 0.875rem (14px) - 400 weight - Secondary text
Body tiny: 0.75rem (12px) - 400 weight - Metadata
```

### Line Heights
- Headings: 1.2
- Body: 1.6
- Lists: 1.8

---

## 3. BUTTON SYSTEM

### Button Variants

#### Primary Button
```tsx
// Used for main actions: "Find jobs", "Log application", "Save", etc.
<button className="btn btn-primary">Action text</button>

CSS:
background: var(--color-accent-primary);    // Gold
color: var(--color-bg-primary);             // Navy text
padding: 12px 24px;
border: none;
border-radius: 4px;
font-weight: 600;
font-size: 1rem;
cursor: pointer;
transition: all 0.2s;

&:hover {
  background: var(--color-accent-secondary); // Copper
}

&:active {
  opacity: 0.9;
}

&:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Secondary Button
```tsx
// Used for secondary actions: "Cancel", "Edit", "View", etc.
<button className="btn btn-secondary">Action text</button>

CSS:
background: transparent;
color: var(--color-accent-primary);        // Gold text
border: 2px solid var(--color-accent-primary);
border-radius: 4px;
padding: 10px 22px;
font-weight: 600;
font-size: 1rem;
cursor: pointer;
transition: all 0.2s;

&:hover {
  background: var(--color-accent-primary);
  color: var(--color-bg-primary);
}

&:active {
  opacity: 0.9;
}
```

#### Ghost Button (Text-only)
```tsx
// Used for tertiary actions: "Try again", inline links
<button className="btn btn-ghost">Action text</button>

CSS:
background: transparent;
color: var(--color-accent-primary);
border: none;
padding: 8px 0;
font-weight: 600;
font-size: 1rem;
cursor: pointer;
text-decoration: underline;

&:hover {
  color: var(--color-accent-secondary);
  opacity: 0.8;
}
```

#### Button with Icon and Arrow
```tsx
// Special pattern for "View posting →" type buttons
<button className="btn btn-secondary btn-with-icon">
  View posting
  <svg class="btn-icon" width="16" height="16">
    <path d="M5 12l7-7M12 5H6v6" stroke="currentColor"/>
  </svg>
</button>

CSS:
display: inline-flex;
align-items: center;
gap: 8px;

.btn-icon {
  transition: transform 0.2s;
}

&:hover .btn-icon {
  transform: translateX(4px);
}
```

#### Destructive Button
```tsx
// Used for delete/remove actions
<button className="btn btn-destructive">Delete</button>

CSS:
background: var(--color-error);
color: var(--color-bg-primary);
border: none;
border-radius: 4px;
padding: 12px 24px;
font-weight: 600;

&:hover {
  opacity: 0.9;
  background: #8e6464;  // Darker rust
}
```

### Button Sizes
```css
.btn-sm: padding 8px 16px, font-size 0.875rem
.btn-md: padding 12px 24px, font-size 1rem (default)
.btn-lg: padding 16px 32px, font-size 1.125rem
```

### Button States
- **Default**: Full opacity
- **Hover**: 80% opacity OR background color shift
- **Active/Pressed**: 90% opacity
- **Disabled**: 50% opacity, cursor: not-allowed
- **Loading**: Spinner icon, disabled state

---

## 4. TAB SYSTEM (Unified)

### Implementation
```tsx
<div className="tabs">
  <button className="tab active" data-tab="personas">
    <IconPersona class="tab-icon" />
    <span>Persona</span>
  </button>
  <button className="tab" data-tab="targets">
    <IconTargets class="tab-icon" />
    <span>Career Targets</span>
  </button>
  <button className="tab" data-tab="profile">
    <IconProfile class="tab-icon" />
    <span>Profile</span>
  </button>
</div>

<div className="tab-content">
  <div id="personas" className="tab-pane active">
    {/* Content */}
  </div>
</div>
```

### Styling
```css
.tabs {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border: 2px solid var(--color-border);
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-tertiary);
  }

  &.active {
    color: var(--color-accent-primary);
    background: var(--color-bg-tertiary);
    border: 2px solid var(--color-accent-primary);
  }
}

.tab-icon {
  width: 18px;
  height: 18px;
}
```

---

## 5. CARD SYSTEM

### Standard Card
```tsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
  </div>
  <div className="card-body">
    {/* Content */}
  </div>
  <div className="card-footer">
    {/* Actions */}
  </div>
</div>

CSS:
background: var(--color-bg-secondary);
border: 2px solid var(--color-border);
border-left: 4px solid var(--color-accent-primary);  // Gold left accent
border-radius: 8px;
padding: 24px;
transition: all 0.2s;

&:hover {
  border-color: var(--color-accent-primary);
  box-shadow: 0 8px 16px rgba(0,0,0,0.3);
}
```

### Stat Card (Dashboard)
```tsx
<div className="stat-card">
  <div className="stat-label">Active applications</div>
  <div className="stat-value">0</div>
  <div className="stat-description">Roles you're currently in process for</div>
</div>

CSS:
background: var(--color-bg-secondary);
border: 2px solid var(--color-border);
border-left: 4px solid var(--color-accent-secondary);  // Copper accent
padding: 20px;
border-radius: 8px;

.stat-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-accent-primary);
  margin-bottom: 12px;
}

.stat-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}
```

### Job Card (Feed - Single Column)
```tsx
<div className="card card-job-feed">
  <div className="card-header">
    <h3>Senior Mechanical Design Engineer</h3>
    <span className="badge badge-match">Weak Match 44</span>
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

CSS:
background: var(--color-bg-secondary);
border: 2px solid var(--color-border);
border-left: 4px solid var(--color-accent-secondary);
padding: 24px;
margin-bottom: 16px;
border-radius: 8px;

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 12px 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-bg-tertiary);
  padding: 6px 12px;
  border-radius: 4px;
}

.card-reasons {
  list-style: none;
  padding: 12px 0;
  margin: 12px 0;

  li {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 6px 0;
    padding-left: 20px;
    position: relative;

    &:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: var(--color-success);
      font-weight: bold;
    }

    &:last-child:before {
      content: '•';
      color: var(--color-text-tertiary);
    }
  }
}

.card-footer {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
```

### Job Card (Grid)
```tsx
<div className="card card-job-grid">
  <div className="card-header">
    <h3>Language teachers</h3>
  </div>
  <div className="card-company">AE Virtual Class S.A • Americas</div>
  <div className="card-meta">
    <span><IconBriefcase /> part_time</span>
    <span><IconClock /> Posted Dec 20</span>
  </div>
  <div className="card-tags">
    <span className="tag">remote</span>
  </div>
  <div className="card-footer">
    <button className="btn btn-secondary btn-sm btn-with-icon">
      View posting <IconArrow />
    </button>
    <button className="btn btn-ghost btn-sm btn-with-icon">
      <IconSave /> Save
    </button>
  </div>
</div>

CSS:
width: calc(33.333% - 12px);
background: var(--color-bg-secondary);
border: 2px solid var(--color-border);
border-left: 4px solid var(--color-accent-secondary);
padding: 16px;
border-radius: 8px;

@media (max-width: 1200px) {
  width: calc(50% - 8px);
}

@media (max-width: 768px) {
  width: 100%;
}

.card-company {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 6px 0 12px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.tag {
  display: inline-block;
  background: var(--color-bg-tertiary);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
```

### Persona Card
```tsx
<div className="card card-persona">
  <h4 className="card-title">Content Strategist</h4>
  <p className="card-description">
    This persona is unemployed and trying to find a remote social media content strategist or similar role quickly.
  </p>
  <button className="card-action">Click to activate</button>
</div>

CSS:
background: var(--color-bg-secondary);
border: 2px solid var(--color-border);
border-left: 4px solid var(--color-accent-primary);
padding: 16px;
border-radius: 8px;
cursor: pointer;
transition: all 0.2s;

&:hover {
  border-color: var(--color-accent-primary);
  background: var(--color-bg-tertiary);
}

&.active {
  border-left: 6px solid var(--color-accent-primary);
  box-shadow: 0 0 12px rgba(212, 165, 116, 0.3);
}

.card-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 8px 0 12px;
  line-height: 1.5;
}

.card-action {
  background: transparent;
  border: none;
  color: var(--color-accent-primary);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: var(--color-accent-secondary);
  }
}
```

---

## 6. FORM ELEMENTS

### Text Input
```tsx
<div className="form-group">
  <label htmlFor="name" className="form-label">Full name</label>
  <input
    type="text"
    id="name"
    className="form-input"
    placeholder="Your name"
  />
</div>

CSS:
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: all 0.2s;

  &::placeholder {
    color: var(--color-text-tertiary);
  }

  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 8px rgba(212, 165, 116, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.form-input-error {
  border-color: var(--color-error);

  &:focus {
    box-shadow: 0 0 8px rgba(168, 123, 123, 0.2);
  }
}

.form-error-text {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: 4px;
}
```

### Textarea
```tsx
<div className="form-group">
  <label htmlFor="bio" className="form-label">Bio</label>
  <textarea
    id="bio"
    className="form-textarea"
    placeholder="Tell us about yourself..."
    rows="4"
  />
</div>

CSS:
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.2s;

  &::placeholder {
    color: var(--color-text-tertiary);
  }

  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 8px rgba(212, 165, 116, 0.2);
  }
}
```

### Select / Dropdown
```tsx
<div className="form-group">
  <label htmlFor="source" className="form-label">Source</label>
  <select id="source" className="form-select">
    <option value="">All sources</option>
    <option value="linkedin">LinkedIn</option>
    <option value="indeed">Indeed</option>
  </select>
</div>

CSS:
.form-select {
  width: 100%;
  padding: 12px 16px;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23D4A574' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;

  &:focus {
    outline: none;
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 8px rgba(212, 165, 116, 0.2);
  }

  option {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }
}
```

### Checkbox
```tsx
<div className="form-group">
  <label className="form-checkbox">
    <input type="checkbox" />
    <span className="checkbox-label">Remote only</span>
  </label>
</div>

CSS:
.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: var(--color-accent-primary);
  }

  .checkbox-label {
    color: var(--color-text-primary);
    font-weight: 500;
  }

  &:hover input[type="checkbox"] {
    border-color: var(--color-accent-primary);
  }
}
```

### Radio Group
```tsx
<div className="form-group">
  <label className="form-label">Work location</label>
  <div className="radio-group">
    <label className="radio-option">
      <input type="radio" name="location" value="remote" />
      <span>Remote only</span>
    </label>
    <label className="radio-option">
      <input type="radio" name="location" value="hybrid" />
      <span>Hybrid</span>
    </label>
    <label className="radio-option">
      <input type="radio" name="location" value="onsite" />
      <span>Onsite</span>
    </label>
  </div>
</div>

CSS:
.radio-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  input[type="radio"] {
    cursor: pointer;
    accent-color: var(--color-accent-primary);
  }

  &:hover {
    border-color: var(--color-accent-primary);
  }

  input[type="radio"]:checked + span {
    color: var(--color-accent-primary);
    font-weight: 600;
  }

  input[type="radio"]:checked ~ {
    border-color: var(--color-accent-primary);
    background: var(--color-bg-secondary);
  }
}
```

### Radio Card Option (Voice selection)
```tsx
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
</div>

CSS:
.radio-card-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.radio-card {
  position: relative;
  display: block;
  padding: 16px;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  input[type="radio"] {
    position: absolute;
    opacity: 0;
  }

  &:hover {
    border-color: var(--color-accent-primary);
    background: var(--color-bg-tertiary);
  }

  &.active,
  input[type="radio"]:checked ~ {
    border-color: var(--color-accent-primary);
    background: var(--color-bg-tertiary);
    box-shadow: 0 0 12px rgba(212, 165, 116, 0.3);
  }

  .radio-card-content {
    h4 {
      margin: 0 0 4px;
      font-size: 1rem;
      color: var(--color-text-primary);
    }

    p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }
  }
}
```

### Slider / Range Input
```tsx
<div className="form-group">
  <div className="slider-header">
    <label className="form-label">Formality</label>
    <span className="slider-value">35</span>
  </div>
  <input
    type="range"
    min="0"
    max="100"
    value="35"
    className="form-slider"
  />
  <div className="slider-labels">
    <span>Casual</span>
    <span>Formal</span>
  </div>
</div>

CSS:
.form-slider {
  width: 100%;
  height: 6px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  margin: 16px 0 8px;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: var(--color-accent-primary);
    border: 2px solid var(--color-accent-secondary);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 0 8px rgba(212, 165, 116, 0.4);
    }
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: var(--color-accent-primary);
    border: 2px solid var(--color-accent-secondary);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 0 8px rgba(212, 165, 116, 0.4);
    }
  }
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.slider-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-accent-primary);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
}
```

### Pill / Chip Input (Removable Tags)
```tsx
<div className="form-group">
  <label className="form-label">Target job titles</label>
  <div className="pill-input">
    <span className="pill">
      Digital Marketing Manager
      <button className="pill-remove" aria-label="Remove">✕</button>
    </span>
    <span className="pill">
      Social Media Specialist
      <button className="pill-remove" aria-label="Remove">✕</button>
    </span>
    <input
      type="text"
      className="pill-input-field"
      placeholder="Add more titles..."
    />
  </div>
</div>

CSS:
.pill-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  border-radius: 4px;
  min-height: 44px;
  align-items: center;
  transition: all 0.2s;

  &:focus-within {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 8px rgba(212, 165, 116, 0.2);
  }
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent-primary);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.pill-remove {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;

  &:hover {
    color: var(--color-accent-primary);
  }
}

.pill-input-field {
  flex: 1;
  min-width: 100px;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  outline: none;
  font-size: 1rem;

  &::placeholder {
    color: var(--color-text-tertiary);
  }
}
```

---

## 7. BADGE / LABEL SYSTEM

### Badge Variants
```tsx
<span className="badge badge-feature">FEATURE</span>
<span className="badge badge-improvement">IMPROVEMENT</span>
<span className="badge badge-new">NEW</span>
<span className="badge badge-match badge-weak">Weak Match 44</span>

CSS:
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  line-height: 1;
}

.badge-feature {
  background: var(--color-info);
  color: var(--color-bg-primary);
}

.badge-improvement {
  background: var(--color-success);
  color: var(--color-bg-primary);
}

.badge-new {
  background: var(--color-warning);
  color: var(--color-bg-primary);
}

.badge-match {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
}

.badge-match.weak {
  border-left: 3px solid var(--color-warning);
}
```

---

## 8. ICON SYSTEM

### Icon Standards
- **Size**: 16px, 20px, 24px (use consistent sizes per context)
- **Stroke width**: 2px for all icons
- **Color**: Use `currentColor` to inherit from text color
- **Style**: Outline/stroke-based, not filled
- **Library**: Use system icons (Feather, Hero Icons, or custom set)

### Icon Usage Map
```
Navigation:
  - Dashboard: home/gauge icon
  - Jobs: briefcase icon
  - Applications: paper-plane/send icon
  - Resume: document/file icon
  - Profile: user icon
  - Prefs: settings/gear icon

Job Cards:
  - Briefcase: employment type
  - Location: map-pin
  - Dollar: salary
  - Clock: posted date
  - Save: bookmark

Forms:
  - Required: asterisk *
  - Info: info-circle
  - Error: alert-circle
  - Success: check-circle

General:
  - Arrow: chevron-right (for "View posting →")
  - Close: x
  - Add: plus
  - Remove: minus or x
  - Settings: gear
```

### Icon Implementation
```tsx
// Always use SVG inline or SVG component
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
</svg>

// Set icon size in parent
.icon {
  width: 20px;
  height: 20px;
  color: currentColor;
  flex-shrink: 0;
}

.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 20px; height: 20px; }
.icon-lg { width: 24px; height: 24px; }
```

---

## 9. SIDEBAR NAVIGATION

### Structure
```tsx
<aside className="sidebar">
  <div className="sidebar-logo">
    <h1>RELEVNT</h1>
  </div>

  <nav className="sidebar-nav">
    <a href="#" className="nav-item active">
      <IconDashboard className="icon" />
      <span className="nav-label">Dashboard</span>
    </a>
    <a href="#" className="nav-item">
      <IconBriefcase className="icon" />
      <span className="nav-label">Jobs</span>
    </a>
    <a href="#" className="nav-item">
      <IconPaperPlane className="icon" />
      <span className="nav-label">Applications</span>
    </a>
    <a href="#" className="nav-item">
      <IconDocument className="icon" />
      <span className="nav-label">Resume</span>
    </a>
    <a href="#" className="nav-item">
      <IconUser className="icon" />
      <span className="nav-label">Profile</span>
    </a>
    <a href="#" className="nav-item">
      <IconGear className="icon" />
      <span className="nav-label">Prefs</span>
    </a>
  </nav>
</aside>

CSS:
.sidebar {
  width: 80px;
  background: var(--color-bg-secondary);
  border-right: 2px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-logo {
  margin-bottom: 32px;
  text-align: center;

  h1 {
    font-size: 1.25rem;
    font-family: var(--font-serif);
    font-weight: 700;
    color: var(--color-accent-primary);
    margin: 0;
  }
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  position: relative;

  .icon {
    width: 24px;
    height: 24px;
  }

  .nav-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-align: center;
    line-height: 1.2;
  }

  &:hover {
    color: var(--color-accent-primary);
    background: var(--color-bg-tertiary);
  }

  &.active {
    color: var(--color-accent-primary);
    background: var(--color-bg-tertiary);
    border: 2px solid var(--color-accent-primary);
    border-radius: 6px;

    &:after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 20px;
      background: var(--color-accent-primary);
      border-radius: 0 2px 2px 0;
    }
  }
}

// Main content margin
main {
  margin-left: 80px;
}
```

---

## 10. SPACING & LAYOUT GRID

### Spacing Scale
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 24px
--spacing-2xl: 32px
--spacing-3xl: 48px
--spacing-4xl: 64px
```

### Page Layout
```css
main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
  margin-left: 80px;  /* Sidebar width */
}

.page-section {
  margin-bottom: 32px;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    margin: 0 0 8px;
    font-size: 2.5rem;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.card-grid-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

---

## 11. COMPONENT-SPECIFIC REFACTORING PROMPTS

Use these detailed prompts when refactoring specific pages/components with an agent.

### PROMPT 1: Dashboard Page Refactor
[See separate DARK_ACADEMIA_REFACTORING_PROMPTS.md]

### PROMPT 2: Jobs Feed Page Refactor
[See separate DARK_ACADEMIA_REFACTORING_PROMPTS.md]

### PROMPT 3: Jobs Grid Page Refactor
[See separate DARK_ACADEMIA_REFACTORING_PROMPTS.md]

### PROMPT 4: Applications Page Refactor
[See separate DARK_ACADEMIA_REFACTORING_PROMPTS.md]

### PROMPT 5: Profile Analyzer Page Refactor
[See separate DARK_ACADEMIA_REFACTORING_PROMPTS.md]

### PROMPT 6: Resume Pages Refactor
[See separate DARK_ACADEMIA_REFACTORING_PROMPTS.md]

### PROMPT 7: Settings/Preferences Pages Refactor
[See separate DARK_ACADEMIA_REFACTORING_PROMPTS.md]

---

## Implementation Order

1. **Phase 1: Foundation** (Deploy CSS variables + sidebar)
   - Update `design-tokens.css` with all colors, typography, spacing
   - Refactor sidebar navigation
   - Deploy base layout

2. **Phase 2: Core Components** (Buttons, cards, forms)
   - Create button component library (all variants)
   - Create card component library (all types)
   - Create form component library (all inputs)

3. **Phase 3: Pages** (One page at a time)
   - Dashboard page
   - Jobs Feed page
   - Jobs Grid page
   - Applications page
   - Profile Analyzer page
   - Resume pages
   - Settings pages

4. **Phase 4: Polish** (Icons, consistency, testing)
   - Standardize icon system across app
   - Visual QA on each page
   - Test responsive design
   - Test dark academia colors in all states

---

## Testing Checklist

For each component/page:
- [ ] All buttons have correct styling (primary, secondary, ghost, sizes)
- [ ] All cards use left copper border accent
- [ ] All text uses correct typography scale
- [ ] All form inputs properly styled
- [ ] All colors use CSS variables (no hardcoded colors)
- [ ] All spacing uses spacing scale
- [ ] Icons are consistent style and size
- [ ] Responsive design working (1200px, 768px breakpoints)
- [ ] Hover/active states working correctly
- [ ] Dark academia colors applied throughout
- [ ] No light theme colors remaining

---

## Color Migration Checklist

**Colors to REMOVE completely:**
- All light grays (#f5f5f5, #e0e0e0, etc.)
- All bright blues (#0066cc, #3366ff, etc.)
- All beige/tan from current light theme
- All emoji colors
- All ad-hoc color values

**Colors to KEEP (remap to variables):**
- Dark academia navy (→ --color-bg-primary)
- Gold accents (→ --color-accent-primary)
- Copper accents (→ --color-accent-secondary)
- Text colors (→ --color-text-primary/secondary/tertiary)
- Success green (→ --color-success)
- Error red (→ --color-error)
- Border colors (→ --color-border)

---

## Typography Migration

**All Headings:**
- Use `font-family: var(--font-serif)` (Crimson Text)
- Follow type scale (H1: 2.5rem, H2: 2rem, etc.)
- Use font-weight: 700

**All Body:**
- Use `font-family: var(--font-sans)` (system sans)
- Use font-size: 1rem (16px)
- Use line-height: 1.6

**All Labels:**
- Use text-transform: uppercase
- Use letter-spacing: 0.05em or 0.1em
- Use font-weight: 600
- Use font-size: 0.875rem

