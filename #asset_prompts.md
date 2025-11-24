Love this phase. “Make it look like it was drawn by a real human having actual feelings” is my favorite design spec.

Here’s everything you need on your side:

* Folder structure
* File naming scheme
* Concrete prompts for every remaining image (copy-paste friendly, 3:4, consistent style)
* Notes on background vs transparent

I’ll keep it tight but complete.

---

## 1. Folder + Naming Structure

Under `src/assets`:

```text
src/
  assets/
    hero/                // already in use, keep as is
      dashboard/...
      jobs/...
      ...
    icons/
      nav/
        icon-nav-dashboard.png
        icon-nav-jobs.png
        ...
      feature/
        icon-feature-skills-gap.png
        icon-feature-learning-path.png
        ...
      state/
        icon-state-empty-jobs.png
        icon-state-empty-applications.png
        icon-state-empty-resumes.png
        icon-state-empty-learning.png
        icon-state-empty-messages.png
        icon-state-empty-notifications.png
      action/
        icon-action-add.png
        icon-action-remove.png
        icon-action-edit.png
        icon-action-delete.png
        icon-action-save.png
        icon-action-search.png
        icon-action-filter.png
        icon-action-sort.png
        icon-action-upload.png
        icon-action-download.png
        icon-action-refresh.png
    illustrations/
      onboarding/
        illustration-onboarding-welcome.png
        illustration-onboarding-voice.png
        illustration-onboarding-preferences.png
        illustration-onboarding-resume.png
        illustration-onboarding-ready.png
      profile-professional/
        illustration-professional-header.png
        illustration-professional-job-titles.png
        illustration-professional-skills.png
        illustration-professional-values.png
        illustration-professional-environment.png
      profile-personal/
        illustration-personal-header.png
        illustration-personal-notifications.png
        illustration-personal-security.png
        illustration-personal-theme.png
      learn/
        illustration-learn-empty.png
        illustration-learn-skill-gap.png
        illustration-learn-recommendation.png
      empty/
        illustration-empty-jobs.png
        illustration-empty-applications.png
        illustration-empty-resumes.png
        illustration-empty-learning.png
        illustration-empty-messages.png
        illustration-empty-notifications.png
      error/
        illustration-error-404.png
        illustration-error-500.png
        illustration-error-network.png


**Rule of thumb:**

* **Icons** = transparent background PNG
* **Illustrations** = ivory paper background (`#f8f4ed`), 3:4 ratio

---

## 2. Onboarding Illustrations (5)

Style baseline for all onboarding + illustrations:

* 3:4 ratio
* “pencil illustration on textured off-white paper, color close to #f8f4ed”
* Graphite pencil lines, a *touch* of warm gold highlight (single accent, not a flood)
* Soft, minimal, centered composition

### 2.1 Welcome / Start (`illustration-onboarding-welcome.png`)

```text
3:4 ratio illustration, pencil drawing on textured off-white paper close to #f8f4ed. An open journal lies in the center, pages mostly blank with a few faint lines, and a small warm golden spark or glow rising gently from the middle of the pages. Graphite line-work, soft shading, minimal composition, cozy and hopeful, no borders, no text.
```

### 2.2 Voice & Tone (`illustration-onboarding-voice.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. A small vintage microphone sketched in graphite, slightly imperfect lines, with a simple speech bubble outlined behind it and a tiny warm gold dust effect around the mic head. Minimal, breathable layout, no text, friendly and human.
```

### 2.3 Preferences / Professional Profile (`illustration-onboarding-preferences.png`)

```text
3:4 ratio, pencil sketch on textured off-white paper close to #f8f4ed. A simple compass and a small path or arrow curving upward from it, with a tiny warm gold highlight near the arrow tip. Represents direction and preferences, minimal composition, no text.
```

### 2.4 Resume / Bullet Bank (`illustration-onboarding-resume.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. A single sheet of paper on a slight angle with a pencil resting across the bottom edge, both in graphite line-art with soft shading. A tiny warm gold glint near the pencil tip, minimal background, no text.
```

### 2.5 Ready / You’re Set (`illustration-onboarding-ready.png`)

```text
3:4 ratio, pencil sketch on textured off-white paper close to #f8f4ed. An open book with both pages visible, a small warm gold star or spark floating just above the center of the spread. Clean graphite lines, soft shadow under the book, no text, calm and optimistic feeling.
```

---

## 3. Professional Profile Illustrations (5)

### 3.1 Header (`illustration-professional-header.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. A simple roadmap style sketch: a winding line traveling upward across the page with three small markers along it, the top marker with a subtle warm gold glow. Graphite line-art, minimal and symbolic of career direction, no text.
```

### 3.2 Job Titles Helper (`illustration-professional-job-titles.png`)

```text
3:4 ratio, pencil drawing on textured off-white paper close to #f8f4ed. A small stack of books with a narrow ladder leaning against them, sketched in graphite, wobbly and human. A faint warm gold mark near the top of the ladder. Minimal composition, no text.
```

### 3.3 Skills Helper (`illustration-professional-skills.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. Two or three puzzle pieces sketched in graphite, slightly apart so they almost fit together, with one piece carrying a small warm gold highlight. Minimal, centered, no text.
```

### 3.4 Values & Workstyle (`illustration-professional-values.png`)

```text
3:4 ratio, pencil sketch on textured off-white paper close to #f8f4ed. A small checklist card with two or three empty boxes and a simple heart scribbled beside them in graphite, with a tiny warm gold accent near one checkbox. Soft, human, no text.
```

### 3.5 Work Environment (`illustration-professional-environment.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. A simple building outline with a few windows and a little plant on one side, all in graphite line-art, with a tiny warm gold glow in one window representing your ideal space. Minimal layout, no text.
```

---

## 4. Personal Profile Illustrations (4)

### 4.1 Header (`illustration-personal-header.png`)

```text
3:4 ratio, pencil drawing on textured off-white paper close to #f8f4ed. A simple ID card sketch with a circle where a face would be and a couple of lines suggesting text, graphite line-art with a small warm gold star in one corner. Minimal, centered, no text.
```

### 4.2 Notifications (`illustration-personal-notifications.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. A hand-drawn bell with slightly uneven lines and two gentle motion marks, graphite shading, with a tiny warm gold glow near the bell opening. Clean, quiet, no text.
```

### 4.3 Security / Account (`illustration-personal-security.png`)

```text
3:4 ratio, pencil sketch on textured off-white paper close to #f8f4ed. A simple padlock in graphite, slightly imperfect outline, with a small warm gold keyhole detail. Calm, minimal, centered, no text.
```

### 4.4 Theme / Display (`illustration-personal-theme.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. A small sun and moon sketched side by side with loose graphite lines, a faint warm gold halo on the sun while the moon stays soft graphite. Minimal, no text.
```

---

## 5. Learn Page Illustrations (3)

### 5.1 Learn Empty (`illustration-learn-empty.png`)

```text
3:4 ratio, pencil drawing on textured off-white paper close to #f8f4ed. A closed book lying flat with a small question mark hovering just above it in graphite, a tiny warm gold spark behind the question mark. Minimal, centered, no text.
```

### 5.2 Skill Gap Highlight (`illustration-learn-skill-gap.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. A magnifying glass inspecting a tiny cluster of scribbled lines, all in graphite, with a warm gold highlight inside the lens. Minimal and focused, no text.
```

### 5.3 Course Recommendation (`illustration-learn-recommendation.png`)

```text
3:4 ratio, pencil sketch on textured off-white paper close to #f8f4ed. A small table lamp or candle shining softly on an open book, graphite line-art with a warm gold glow where the light hits the pages. Cozy and inviting, no text.
```

---

## 6. Empty State Illustrations (6)

Even though you will also have icon-size state graphics, these larger 3:4 illustrations can sit in the main empty state panels.

### Jobs (`illustration-empty-jobs.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. A simple bulletin board sketched in graphite with only one crooked sticky note pinned and nothing written on it, plus a tiny warm gold pin. Sparse and gentle, no text.
```

### Applications (`illustration-empty-applications.png`)

```text
3:4 ratio, pencil sketch on textured off-white paper close to #f8f4ed. An open mailbox with no letters inside, drawn in graphite with a tiny warm gold flag raised on the mailbox. Minimal, centered, no text.
```

### Resumes (`illustration-empty-resumes.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. A clipboard holding a completely blank sheet of paper, graphite strokes with a tiny warm gold clip detail at the top. Calm, no text.
```

### Learn (`illustration-empty-learning.png`)

```text
3:4 ratio, pencil drawing on textured off-white paper close to #f8f4ed. A closed book with a tiny warm gold bookmark peeking out, sketched in graphite, centered, minimal background, no text.
```

### Messages (`illustration-empty-messages.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. Two empty speech bubbles overlapping, with a small warm gold spark between them. Simple, no text.
```

### Notifications (`illustration-empty-notifications.png`)

```text
3:4 ratio, pencil sketch on textured off-white paper close to #f8f4ed. A bell resting quietly on its side with no motion lines a tiny warm gold dot near the base. Minimal, centered, no text.
```

---

## 7. Error Illustrations (3)

### 7.1 404 (`illustration-error-404.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. A simple hand-drawn map with a winding path and a big X near the edge, plus a small question mark in graphite and a faint warm gold highlight on the X. Playful but calm, no text or numbers.
```

### 7.2 500 (`illustration-error-500.png`)

```text
3:4 ratio, pencil drawing on textured off-white paper close to #f8f4ed. A crumpled piece of paper sketched in graphite with loose, scribbly lines, and one tiny warm gold spark just above it suggesting a new idea coming. Minimal, no text.
```

### 7.3 Network (`illustration-error-network.png`)

```text
3:4 ratio, pencil illustration on textured off-white paper close to #f8f4ed. An unplugged cable with the plug and socket slightly apart, drawn in graphite, a tiny warm gold spark between them where the connection should be. Centered, minimal, no text.
```

---

## 8. Action Icons (transparent PNG, not ivory)

All of these should be:

* **Transparent background**
* Simple graphite line-art with **tiny warm gold accent**
* Square-ish canvas, but your 3:4 is fine as long as content is centered and easy to scale down

Folder: `src/assets/icons/action/`

### Edit – `icon-action-edit.png`

```text
transparent background, pencil line-art icon of a tilted graphite pencil, slightly imperfect outline, tiny warm gold sparkle near the tip, minimal and centered
```

### Delete – `icon-action-delete.png`

```text
transparent background, pencil sketch of a small trash bin with wobbly edges or a hand-drawn X symbol, one corner with a tiny warm gold dot, minimal and centered
```

### Save – `icon-action-save.png`

```text
transparent background, pencil line-art of a small bookmark or page with a folded corner, small warm gold accent at the tip of the bookmark, clean and centered
```

### Add – `icon-action-add.png`

```text
transparent background, hand-drawn plus sign with uneven graphite lines, a tiny warm gold dot where the lines intersect, minimal and centered
```

### Remove – `icon-action-remove.png`

```text
transparent background, pencil sketch of a minus sign inside a loose circle, circle boundary slightly imperfect, small warm gold dot on one side of the circle, centered
```

### Search – `icon-action-search.png`

```text
transparent background, pencil line-art magnifying glass with a wobbly circular lens, tiny warm gold spark inside the lens area, minimal and centered
```

### Filter – `icon-action-filter.png`

```text
transparent background, pencil sketch of a small funnel shape with uneven edges, a small warm gold dot near the top edge, minimal and centered
```

### Sort – `icon-action-sort.png`

```text
transparent background, pencil drawing of two simple arrows, one pointing up and one down, slightly irregular lines, tiny warm gold dot between them, centered
```

### Upload – `icon-action-upload.png`

```text
transparent background, pencil line-art of a small upward arrow sitting on top of a thin horizontal line, tiny warm gold accent at the arrow tip, minimal and centered
```

### Download – `icon-action-download.png`

```text
transparent background, pencil sketch of a downward arrow landing on a thin horizontal line, tiny warm gold accent at the arrow tip, centered
```

### Refresh – `icon-action-refresh.png`

```text
transparent background, hand-drawn circular arrow in graphite, slightly broken circle to feel human, tiny warm gold dot where the arrowhead touches the circle, centered
```

⭐ HERO PROMPTS (Firefly/Gemini Ready)

All backgrounds are set to #f8f4ed unless noted, with subtle paper grain and soft pencil shading.

1. Dashboard Hero — “The Compass + Notebook”

Prompt:
“Minimal graphite (#333333) pencil sketch on ivory (#f8f4ed). An open notebook lies at a slight angle, blank but warm, with a delicate stream of gold (#C7A56A) dust drifting upward from the center crease. To the left is a simple hand-drawn compass with imperfect lines, the needle pointing upward. The composition is airy, calm, and centered around finding direction. Sparse linework, faint eraser marks, subtle paper grain, gentle gold flecks, no harsh shadows.”

2. Jobs Hero — “The Open Suitcase (Possibilities)”

Prompt:
“Minimal graphite (#333333) pencil sketch on  off-white (#f8f4ed). A small open suitcase sits in the lower-left third, sketched with soft uneven lines. A warm cloud of gold (#C7A56A) dust drifts upward from inside the case. Light shading, imperfect outlines, gentle sparkles dispersed in the dust. Clean, airy empty-space on the right for UI.”

3. Applications Hero — “The Path Unfolding”

Prompt:
“Graphite (#333333) pencil illustration on ivory (#f8f4ed). A long, ribbon-like paper trail flows outward from an open envelope, curling across the page. Along the path, tiny stars (#C7A56A) and subtle gold (#C7A56A) spark sprinkles highlight progress. Pencil linework soft and imperfect, like a journal doodle. Very light shading, airy composition, lots of empty room for UI.”

4. CV/Resume Hub Hero — “The Magic Notebook”

Prompt:
“Graphite (#333333) pencil sketch on soft ivory (#f8f4ed). An open notebook fills the lower portion of the canvas. Inside, faint sketched bullet points, arrows, and shapes hint at planning and self-discovery. A burst of soft gold (#C7A56A) spark dust rises from the notebook’s center, glowing subtly. Edges imperfect, shading gentle, paper grain visible. Whimsical but still minimal.”

5. Learn Hero — “The Stack of Books + Ladder”

Prompt:
“Minimal graphite (#333333) pencil illustration on ivory (#f8f4ed). A small stack of three books sits near the bottom left. Leaning against the books is a tiny ladder, simple and sketchy. From the top book, faint gold (#C7A56A) dust floats upward in a soft arc. Imperfect hand-drawn lines, soft shadows, subtle gold flecks, wide open negative space.”

6. Voice Hero — “Vintage Microphone + Gold Drift”

Prompt:
“Graphite (#333333) pencil sketch of a simple vintage microphone on ivory (#f8f4ed). Slightly angled, with soft hand-drawn lines and shading. A trail of tiny gold (#C7A56A) spark flecks drifts from the grille into the empty space on the right. Pencil imperfections, warm glowing dust, no strong shadows, airy and minimal.”

7. Preferences Hero — “The Gentle Gear”

Prompt:
“Minimal graphite (#333333) pencil sketch on ivory (#f8f4ed). A single hand-drawn gear sits near the left-center, imperfect teeth and light cross-hatching shading. Small gold (#C7A56A) spark dust drifts out from behind the gear in a subtle arc, symbolizing tuning and fine-tuning. Very clean, ultra-minimal composition with plenty of breathing room.”

8. Onboarding Hero — “The Journal of Possibilities”

Prompt:
“Soft graphite (#333333) pencil sketch on ivory (#f8f4ed). An open journal lies across the foreground with doodles, arrows, tiny symbols, and faint handwriting. From the center fold, a swirl of gold (#C7A56A) dust spirals upward, glowing gently. A pencil rests nearby. Imperfect lines, warm tone, whimsical but minimal. Balanced composition that feels inviting and magical.”

9. Multi-Search / Explore Hero — “The Map Unfolding”
“Soft graphite (#333333) pencil sketch on ivory (#f8f4ed). A soft sketch of an open map with a few simple marks, lightly illuminated with gold (#C7A56A). Imperfect lines, warm tone, whimsical but minimal. Balanced composition that feels inviting and magical.”


A soft sketch of an open map with a few simple marks, lightly illuminated with gold.

EMPTY STATE ILLUSTRATION PROMPTS

(For when a section has “no data yet.” Minimal, friendly, warm.)

1. No Jobs Yet

Prompt:
“minimal graphite pencil sketch of an empty briefcase sitting slightly open with soft gold dust drifting out, warm cream paper texture, gentle shading, imperfect hand-drawn outline, quiet and optimistic mood, airy negative space, editorial illustration style”

2. No Matches Yet

Prompt:
“delicate hand-drawn compass with its needle resting still, tiny gold sparkles floating upward like possibility, graphite shading, warm textured cream background, imperfect notebook-style lines, clean and minimal composition”

3. No Applications Yet

Prompt:
“graphite sketch of a small tidy stack of blank papers with one gently lifting at the corner, soft gold flecks drifting around, warm ivory textured paper, light shadows, quiet and hopeful tone, simple editorial line-art”

4. No Resumes Yet

Prompt:
“hand-drawn empty document outline with a tiny gold star hovering above the top corner, gold dust falling softly, warm cream paper background, graphite shading, subtle imperfect lines, minimal modern notebook aesthetic”

5. No Learning Items Yet

Prompt:
“graphite pencil drawing of a single closed book with a little ladder leaning against it, tiny gold sparkles around the top, warm textured paper background, soft drop shadow, handcrafted and minimal”

6. No Voice Notes Yet

Prompt:
“pencil-sketch of a vintage microphone turned slightly away, small gold dust drifting out like quiet thoughts, warm soft paper texture, minimal composition with lots of negative space, gentle graphite shading”

7. No Preferences Set

Prompt:
“simple hand-drawn gear with its center open and empty, soft gold sparkles drifting through the middle, graphite shading, warm cream background, imperfect pencil outline, friendly and uncluttered aesthetic”

