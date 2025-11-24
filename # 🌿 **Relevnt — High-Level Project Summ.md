# 🌿 **Relevnt — High-Level Project Summary

## ⭐ **PROJECT OVERVIEW**

Relevnt is a human-first, anti-corporate job search platform designed to give people clarity, truth, and real leverage in a broken hiring system. The product combines job search aggregation, AI-powered resume optimization, skills-gap analysis, application helpers, interview prep, learning recommendations, and auto-apply features.

The goal:
**Authentic intelligence for real people navigating broken systems.**

---

## ⭐ **CURRENT STATE OF THE APP**

* Full frontend running in **React + Vite**.
* Supabase backend connected and functioning.
* Core pages exist and route correctly.
* All **hero trinity images** (16:9, 3:4, 1:1) are generated and placed in correct folders.
* All **hand-drawn nav icons** are generated and placed in `src/assets/icons/nav/`.
* We are transitioning away from corporate UI into a **hand-drawn, notebook-human vibe**, balanced with minimal luxury UI elements.
* Dark mode will invert icons and adjust hero art with CSS filters.
* Typography is clean, minimal, human-centered.
* Job and Application pages are nearly complete (except icon updates).
* Dashboard needs polishing and performance improvements.
* Preferences & Settings are being reframed as:

  * **Professional Profile** (job titles, preferences, skills)
  * **Personal Profile** (account settings, voice settings, theme, timezone)

---

## ⭐ **ASSET SYSTEM**

You must assume the following:

### **Hero Images**

Located in:

```
src/assets/hero/<page>/
```

Each page has:

* hero-<page>-light-16x9.png
* hero-<page>-light-3x4.png
* hero-<page>-light-1x1.png

Used for responsive layout & headers.

### **Navigation Icons**

Located in:

```
src/assets/icons/nav/
```

Named:

* nav-dashboard.png
* nav-jobs.png
* nav-applications.png
* nav-resumes.png
* nav-learn.png
* nav-voice.png
* nav-preferences.png
* nav-settings.png

Icons should be oversized and feel hand-drawn, imperfect, friendly.

---

## ⭐ **DESIGN LANGUAGE**

* Soft ivory background (#f8f4ed) for light mode.
* Chalk-on-charcoal inversion for dark mode using CSS filters.
* Pencil and ink sketch art style.
* Slight texture (paper feel) is welcome.
* UI should feel warm, sincere, and human — not corporate.
* "Notebook margins doodles" as route-based illustrations.
* Never cluttered; spacious and elegant.

---

## ⭐ **WHAT WE NEED TO DO NEXT**

1. **Integrate all hero images** into each route using a `HeroImage` component.
2. **Integrate all hand-drawn nav icons** using a `SketchIcon` component.
3. **Set up CSS variables for light/dark inversion**:

   * `--icon-filter`
   * `--hero-opacity`
4. **Refactor Dashboard**:

   * Improve load time
   * Add hero image
   * Improve layout/grid
   * Add interactive cards
5. **Refactor Preferences & Settings** into:

   * Professional Profile
   * Personal Profile
6. **Add Learn Page** tied to Supabase tables:

   * learning_courses
   * learning_providers
7. **Add Skills-Gap-to-Learning recommendations** into JobDetail.
8. **Polish Admin Dashboard**:

   * Manage job sources
   * Manage learning providers
   * Manage learning courses
9. **Navigation redesign**:

   * Use new icons
   * Add Learn route
   * Clean spacing & humanize tone
10. **Error sweeping** + final build cleanup.

---

## ⭐ **CODE STYLE REQUIREMENTS**

* Functional components only.
* Clean, human-readable React.
* Use CSS modules or simple global CSS — no Tailwind.
* Use the new icon and hero components everywhere.
* Maintain existing Supabase logic.
* Do NOT replace working data flows.
* Ensure `npm run build` passes.

