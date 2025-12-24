# LYRA KILL LIST
## Relevnt: Features That Should Be Removed, Merged, Hidden, or Deferred

---

## PREAMBLE: THE MANDATE

Every feature has a cost:
- **Cognitive cost** (user must understand it)
- **Maintenance cost** (team must support it)
- **Opportunity cost** (attention/resources spent here aren't spent on core)
- **Clarity cost** (adds to the mental model user must hold)

Relevnt has accumulated features that are *good ideas in theory* but are **costing more than they're worth in practice**.

This kill list separates signal from noise. The goal is to emerge with:
- **Fewer decisions users must make**
- **Fewer things to maintain**
- **Clearer value proposition**
- **More momentum on core loops**

---

## SECTION 1: KILL IMMEDIATELY

### **1.1 Multi-Persona Architecture (as primary user model)**

**What It Is:**
Core mental model where users create multiple job personas, each with own preferences, filters, auto-apply rules, and match scores. Personas are one-to-many from user profile.

**Why It Exists:**
Built on assumption that users are strategically exploring multiple career paths. "Should I be a Staff Engineer OR Manager?"

**Why Kill It:**
1. **Low adoption:** Most users create 1 persona, abandon the feature
2. **High cognitive load:** Multi-persona adds complexity to every onboarding question, every filter, every setting
3. **Confuses the mental model:** "Am I applying as Persona A or B? Did I adjust salary for both personas?"
4. **Complexity without payoff:** Builder benefit (elegant system) ≠ User benefit (simpler job search)
5. **Blocks simplification:** Can't simplify onboarding, settings, filters, etc. because everything is persona-aware

**What Should Replace It:**
Single "Job Target" that user refines over time.
- Initial: "What's your target role?" [Text input, AI-assist to clarify]
- If user wants to explore alternative: "Want to explore a different path?" → Secondary target
- Not default model. Exception for power users.

**User Benefit:**
- Onboarding: 1 question instead of "Define your persona: role, salary, culture, location, industry"
- Settings: One filter set instead of "Which persona's filters?"
- Mental model: "I'm applying to jobs" instead of "I'm applying via Persona A to jobs"
- Less decision-making in every interaction

**Product Benefit:**
- 40% reduction in settings/configuration complexity
- Clearer job matching model (match one user, not persona-by-persona)
- Auto-apply rules simpler ("Apply to jobs >75 score" not "Apply via Persona A with rules...")
- Easier to explain: "Relevnt finds the best jobs for your target role."

**Risks/Mitigations:**
- Users who *do* want multi-path exploration: "Coming in v2. For now, focus on one target."
- Data exists (personas table, persona_id foreign keys everywhere): Keep the DB table for future. Just don't expose in UI.

**Timeline:** Remove from onboarding & main UI immediately. Hide persona management behind settings. Keep data model for future.

---

### **1.2 RelevanceTuner (5-slider weighting system)**

**What It Is:**
Component that lets users adjust weights for job matching: Skill (30%), Salary (25%), Location (15%), Remote (20%), Industry (10%). Users can save presets like "Balanced," "Pay-first," "Remote-friendly."

**Why It Exists:**
Built on assumption that users understand weighted factors and want fine-grained control over matching algorithm.

**Why Kill It:**
1. **Expert-level feature for novice users:** Understanding that skills get 30% vs salary 25% is not intuitive. Requires explaining the algorithm.
2. **Almost never used:** Power users want it. 95% of users never touch it.
3. **Creates false precision:** User sees "Balanced preset" and thinks it's scientific. It's arbitrary.
4. **Solves a non-problem:** Users don't think "I want 30% skill weighting." They think "I want jobs with Python and >$120K salary."
5. **Cognitive weight for low value:** Every user's mental model gets this concept whether they use it or not.

**What Should Replace It:**
Smart defaults + simple filters.
- Weights are invisible. Algorithm optimizes based on user behavior.
- User says: "What salary range? What skills? Remote yes/no? Location?"
- System infers weighting from: Which jobs did you save? Which did you dismiss? Apply algorithm.
- Power users get: "Advanced: Customize weights" (hidden, optional, expert-only)

**User Benefit:**
- Doesn't need to understand weighting
- Simpler filter form: 5 questions not "adjust 5 sliders"
- System learns from behavior instead of requiring expertise

**Product Benefit:**
- Removes 1 major settings screen
- Eliminates need to explain weighted factors in onboarding
- Allows system to adapt weights based on user patterns (more intelligent, less manual)

**Risks/Mitigations:**
- Power users: Keep advanced tuner in settings labeled "For experts"
- Existing users: Don't break their weight selections. Keep backward compatibility, hide by default, offer in advanced settings.

**Timeline:** Hide from main UI immediately. Move to "Advanced Settings." Default to smart algorithm-driven weighting.

---

### **1.3 WellnessMode (if it's not changing behavior)**

**What It Is:**
System that tracks user's mood (1-10 daily check-in), calculates wellness state (gentle/normal/encouraging), and adapts UI tone and metric visibility.

**Why It Exists:**
Built on assumption that acknowledging user's emotional state and adapting tone/messaging builds trust and reduces burnout.

**Why Kill It (if current):**
1. **Performance care, not real care:** Hides metrics and uses gentle language, but doesn't change system behavior. Still asks for same velocity.
2. **Self-selection bias:** People who check in regularly aren't the ones burning out. Burned-out people forget/skip check-ins.
3. **Creates false impression of support:** "We care about your wellbeing" + no behavior change = erodes trust (feels like marketing).
4. **Cognitive load for no payoff:** Users asked to reflect emotionally without system responding meaningfully.
5. **Unfinished:** Code shows wellness guidance exists but isn't used (no behavior changes implemented).

**What Should Replace It:**
Either **full commitment** or **kill it entirely.**

**Option A: Full Commitment (Transformational)**
- Gentle Mode: Actually pauses auto-apply
- Gentle Mode: Caps at 1 action per day
- Gentle Mode: Mutes notifications
- Gentle Mode: Suggests 2-day break, actually enforces it
- System *changes*, not just tone

**Option B: Kill It (Reductionist)**
- Remove mood check-in
- Remove gentle/normal/encouraging modes
- Just provide tools. Don't pretend to manage emotion.
- Better: an honest system than a dishonest caring one

**User Benefit (if Full Commitment):**
- Actually feels supported, not patronized
- System respects stress signals with actions, not words

**User Benefit (if Kill It):**
- Simpler product (no wellness layer to understand)
- Honest: "We help you apply smarter, not slower"

**Product Benefit:**
- Removes UI layer + wellness tracking complexity
- OR: Completes wellness system (bigger project but real payoff)
- Either way: Clarity on what product actually does

**Risks/Mitigations:**
- If killing: Users don't feel abandoned (provide actual support elsewhere)
- If committing: Requires significant effort to implement behavior changes

**Timeline:** Decide now. Either fully commit to wellness-driven behavior change (mid-term effort) or remove check-in and modes entirely (quick cleanup).

---

### **1.4 PatternInsights (without action)**

**What It Is:**
Component showing behavioral patterns from job interactions. "You've dismissed 70% of jobs due to low salary." "You save jobs with remote options at 3x the rate."

**Why It Exists:**
Built to provide user self-awareness. Shows what their own behavior is telling them.

**Why Kill It (in current form):**
1. **Awareness without action = friction:** Shows pattern, user can't easily fix it (AutoTune suggestions require manual acceptance, which has explicit TODO)
2. **Creates cognitive dissonance:** "I see I'm dismissing for salary... but I also need to earn $X. Now what?"
3. **Feels accusatory, not helpful:** "You dismiss on-site roles" can feel like "You're being picky" instead of "Here's a pattern we can work with together"
4. **Low engagement:** If suggestions aren't being accepted, pattern display probably isn't driving value
5. **Maintenance burden:** Calculating dismissal patterns, bucketing by factor, generating insights—for what? To show a stat?

**What Should Replace It:**
Pattern-driven action, not pattern display.
- Don't show pattern. Use pattern to improve matching.
- Example: System detects "dismissing for salary" → doesn't display it → automatically adjusts match algorithm to raise salary threshold → shows results: "You're now seeing jobs from $100K+. Want to adjust?"
- Remove the insight. Execute the insight.

**User Benefit:**
- Simpler dashboard (no pattern visualization)
- System works on patterns, user doesn't have to think about them
- Clearer path: See problem → System fixes → Better results (vs. See problem → Must think → Must manually decide)

**Product Benefit:**
- Removes UI component (cleaner dashboard)
- Removes insight generation complexity
- Focuses on outcomes (better job matching) vs. self-awareness (pattern display)
- Closes gap between detection and action

**Risks/Mitigations:**
- Users liked insight: Bring back as "What changed?" after system adjusts
- "Show me the work": Optional "Why did system adjust?" explainer

**Timeline:** Hide PatternInsights panel. Move pattern-driven logic into silent optimization. Show results, not patterns.

---

### **1.5 Multiple Resume Versions (as expected feature)**

**What It Is:**
Database supports multiple resumes per user (`resumes` table with version tracking). Users can create Resume A, Resume B, Resume C and choose which to apply with.

**Why It Exists:**
Built on assumption users will maintain multiple tailored resumes. Resume A for Staff roles, Resume B for Manager roles, etc.

**Why Kill It:**
1. **Users don't maintain multiple resumes:** Most users have 1 resume, never touch it. Comparison data doesn't exist.
2. **Cognitive load for feature no one uses:** "Which resume should I use?" is a decision users don't want to make.
3. **Blocks feedback loop:** System can't compare "Resume A performance vs Resume B" because users only have 1 real resume.
4. **Alternative exists:** Auto-generate resume variants for specific jobs (smarter than manual multiple versions).

**What Should Replace It:**
Single "Main Resume" + auto-generated variants (not user-managed versions).
- User uploads 1 resume
- System keeps snapshots at each application
- If better variant emerges (based on outcomes), system suggests it
- User can accept or reject, but not manually maintain multiple

**User Benefit:**
- One less decision: "Which resume?"
- System handles variant generation intelligently
- Cleaner, simpler model

**Product Benefit:**
- Removes "manage multiple resumes" UI
- Enables outcome-driven optimization (system can measure resume performance)
- Focuses on resume *improvement* not resume *management*

**Risks/Mitigations:**
- Power users who like multiple versions: "Coming in advanced features. For now, use one main."
- Existing data: Keep `resumes` table, just don't surface in UI. One resume is default.

**Timeline:** Simplify to 1 resume per user in main UI. Hide multi-version management behind "Advanced."

---

### **1.6 Interview Practice Evaluation (without outcome measurement)**

**What It Is:**
`interview_practice_sessions` table that stores practice interview scores, feedback, and category breakdowns. Users can practice interviews and get scored (0-100).

**Why It Exists:**
Built to help users improve interview skills through practice and feedback.

**Why Kill It (in current form):**
1. **No connection to real outcomes:** Interview practice scores are stored but never compared to real interview success
2. **Gamification without stakes:** Getting a 72/100 on practice doesn't predict real interview outcomes. System doesn't measure this.
3. **Orphaned feature:** Interview prep generates questions + practice happens, but no feedback loop to: "Did your practice improve your real interviews?"
4. **Maintenance without ROI:** Evaluation system (scoring, categorizing, storing) exists for internal satisfaction, not user value
5. **Can't improve what you can't measure:** Without knowing if practice actually helps, system can't optimize practice

**What Should Replace It:**
Practice + outcome measurement + adaptation.
- Practice interviews: Keep
- Scoring/feedback: Keep
- NEW: After real interview, user reports: "Went well? Struggled? Got offer?"
- System learns: "Practice in [behavioral] before interviews at [company type] → 60% success. Practice in [technical] → 40% success."
- System adapts: "Next interview, focus on behavioral questions."

**User Benefit:**
- Clearer path: Practice → Feedback → Real outcome → Better prep
- Confidence: System shows "This prep type actually works for you"

**Product Benefit:**
- Removes scoring/feedback display that has no impact
- Focuses on closed-loop learning (practice → outcome → adjustment)
- Enables meaningful personalization

**Risks/Mitigations:**
- Users like practice scores: Keep as motivation, just link to real outcomes
- Existing data: Don't break, just don't emphasize

**Timeline:** Keep interview prep. Stop showing practice scores separately. Focus on "Did prep help real interviews?" integration instead.

---

## SECTION 2: MERGE OR SIMPLIFY

### **2.1 PatternInsights + AutoTune → Single "Insight" Feature**

**What It Is (Current):**
- **PatternInsights:** Shows patterns from dismissal behavior. Separate UI component.
- **AutoTune:** Generates suggestions based on patterns. Separate UI component with explicit TODO.

**Why Merge:**
1. **They're the same idea, split across two interfaces:** Both detect patterns, both want to change user behavior
2. **Cognitive load doubled:** User understands pattern, then understands suggestion—really it's one thought
3. **Execution gap:** TODO in AutoTune suggests integration incomplete; merging forces completion
4. **Simpler story:** "Here's what I noticed. Here's what I changed. Here's the result."

**What Merged Feature Looks Like:**
```
Single "Insights" card:

Pattern detected: "You dismiss on-site roles"
Action taken: "Showing only remote roles now"
Result: "23 new matches appeared"

Options:
  [Keep change] [Revert] [Adjust differently]
```

Not:
- Pattern display (separate)
- Suggestion modal (separate)
- Manual acceptance required (separate)

One unified flow: Detect → Act → Show result → User confirms.

**User Benefit:**
- Fewer panels on dashboard
- Clear cause-effect: "System noticed this, changed that, here's the result"
- No "suggestions I haven't responded to" in UI

**Product Benefit:**
- 40% reduction in dashboard complexity
- Forces completion of AutoTune integration (can't defer TODO anymore)
- Clearer data flow (patterns → actions → outcomes)

**Timeline:** Immediate. Merge components, complete TODO, rebuild dashboard.

---

### **2.2 Resume Analyzer + ATS Score → Single "Resume Health" Feature**

**What It Is (Current):**
- **Resume Analyzer:** Component analyzing resume for content, structure, keywords
- **ATS Score:** Separate component scoring resume on ATS optimization (0-100)

**Why Merge:**
1. **Solving same problem:** Both assess "Is this resume good?"
2. **Confusing UI:** Two separate cards doing overlapping analysis
3. **Inconsistent messaging:** One measures "readability," other measures "ATS compliance." User doesn't know which matters.

**What Merged Feature Looks Like:**
```
Resume Health Card:

Overall Health: 76/100 [Solid, but improvable]

Strengths:
  ✓ ATS-friendly format
  ✓ Strong action verbs
  ✓ Quantified achievements

Improvements:
  • Add 2-3 technical keywords (Python, AWS)
  • Expand summary section
  • Reformat education dates

One-click improvements: [Apply suggestions]
```

Not:
- Separate ATS score
- Separate content analysis
- Separate keyword density
- Multiple cards

One unified health score with actionable feedback.

**User Benefit:**
- Simpler mental model: "Is my resume healthy?"
- Clear action path: Suggestions with one-click apply
- Less decision-making: "Do I care about ATS or content?" → Just "Is my resume good?"

**Product Benefit:**
- One dashboard card instead of two
- Unified scoring (not "78 ATS, 72 content, which one matters?")
- Forces prioritization of improvements (top 3 only, not 10 scattered suggestions)

**Timeline:** Merge into one "Resume Health" component. Consolidate scoring logic.

---

### **2.3 Multiple Notification/Alert Types → Single "Opportunities" Stream**

**What It Is (Current):**
- Job alerts (high-match jobs appeared)
- Pattern alerts (dismissal pattern detected)
- Rejection alerts (email forwarded, analyzed)
- Application alerts (status changed)
- Maybe others scattered in code

**Why Merge:**
1. **Scattered messaging:** User doesn't know which alerts matter vs. noise
2. **Cognitive categorization cost:** User mentally sorts "Is this job alert or pattern alert?"
3. **Low signal-to-noise:** Mix of actionable (new jobs) and informational (pattern detected) in same queue
4. **Mobile notification spam:** Multiple notification types competing for user attention

**What Merged Feature Looks Like:**
```
Opportunities:

[NEW JOB] "Senior Backend, $160K, 89% match" [Apply] [Save] [Skip]

[ACTION NEEDED] "Your interview is in 2 days. Prep?" [Start prep] [Dismiss]

[INSIGHT] "3 rejections this week mention Python. Want to learn?" [Yes] [No]

[OUTCOME] "Position filled (Company X). Keep trying or adjust target?" [Keep going] [Pivot]
```

Single stream. Prioritized. Clear action per item.

Not:
- Job alerts (separate notifications)
- Pattern alerts (separate modal)
- Rejection emails (separate processing)
- Multiple channels

One unified "What should I do right now?" stream.

**User Benefit:**
- One place to check for opportunities/actions
- Clearer signal: Top priority first
- Less decision-making: "What should I focus on?"

**Product Benefit:**
- Single notification channel (no spam)
- Unified priority/ranking system
- Removes scattered alert infrastructure

**Timeline:** Medium-term. Consolidate alert generation into single "Opportunities" service.

---

## SECTION 3: HIDE BEHIND PROGRESSIVE DISCLOSURE

### **3.1 Advanced Persona Settings**

**What It Is:**
Settings within persona management: target_title, skills, salary_range, location_preference, remote_type, industry_preference, culture preferences, etc.

**Why Hide (Don't Kill):**
1. **Power users need it:** People doing strategic career planning want this depth
2. **Doesn't belong in default flow:** 80% of users skip these settings entirely
3. **Can be expert-only:** Those who understand it will find it; others don't need it

**How to Hide:**
- Persona creation: Simple form (3 questions)
  - "What's your target role?"
  - "How much do you want to earn?"
  - "Remote yes/no?"
- Advanced: Link at bottom: "Customize preferences?" → Shows all 15 settings

**User Benefit:**
- Simpler onboarding for 80% of users
- Power users still get depth when they ask for it
- Clear mental model: Simple first, advanced if needed

**Product Benefit:**
- Cleaner default experience
- No feature bloat for novices
- Segmentation by expertise level

**Timeline:** Immediate. Redesign onboarding form. Move advanced settings to secondary screen.

---

### **3.2 Cost Tracking & Provider Information**

**What It Is:**
System displays to users:
- Cost of each AI task (in dollars/cents)
- Which provider was used (OpenAI, Anthropic, Google, etc.)
- Token usage for the request

**Why Hide (Don't Kill):**
1. **Not user problem:** Users don't care which LLM analyzed their resume. They care about quality.
2. **Creates unnecessary complexity:** "Is Claude better than GPT-4 for resume analysis?" (Not user's question)
3. **Invites wrong thinking:** User sees $0.03 cost and worries about overuse, or sees "Claude" and wonders if they should prefer it
4. **Maintenance burden:** Every change to providers requires updating UI

**How to Hide:**
- Remove from dashboard/settings
- Keep in system logs (for builder, for debugging)
- Optional: "Advanced" section shows it for transparency-lovers
- Default: Hidden

**User Benefit:**
- Simpler product perception (no cost worries)
- Faster interaction (no "which provider?" thoughts)
- Focused: Quality of output, not source

**Product Benefit:**
- Removes provider selection UI
- Allows flexible provider switching without UI updates
- Cleaner data model

**Timeline:** Immediate. Hide from user-facing surfaces.

---

### **3.3 Rejection Analysis Coaching**

**What It Is:**
After rejection email, system generates analysis showing: reason, sentiment, suggestions, and empathetic message.

**Why Hide (Don't Kill):**
1. **Early-stage users aren't ready:** Fresh user with 1 rejection needs hope, not analysis
2. **Timing matters:** Analysis helpful after 5-10 rejections (pattern apparent). Not helpful after 1 (just noise).
3. **Premature coaching:** Suggesting "improve your Python skills" on first rejection can demoralize instead of help

**How to Hide:**
- Don't show for first 5 rejections
- After 5+: Show analysis + coaching
- Rationale: "After this many, patterns are clear. Here's how to improve."

**User Benefit:**
- Feels supported early on ("Rejection happens, keep going") not coached (diagnosed)
- Coaching is timely (pattern visible) not premature (guesswork)

**Product Benefit:**
- Reduces unnecessary complexity early
- Focuses early experience on encouragement, not analysis

**Timeline:** Add logic to show/hide based on rejection count. Implement gates.

---

### **3.4 Networking Contact Display in Job Feed**

**What It Is:**
When viewing a job, system shows: "You know 3 people at this company" with names/photos/titles.

**Why Hide (Don't Kill):**
1. **Feature is incomplete:** Infrastructure exists (useNetworkLookup.ts) but isn't integrated
2. **Low value early on:** User with 0 offers doesn't need networking; they need visibility
3. **Becomes valuable later:** After some interviews, warm intros matter. Then surface it.

**How to Hide:**
- Hide networking display until user has 2+ interviews scheduled
- Rationale: "Once interviews are happening, warm intros help close them. Here's who you know at each company."
- Early stage: Just show jobs. Later stage: Add networking context.

**User Benefit:**
- Cleaner job feed (no networking clutter early on)
- Relevant at right time (when intros actually matter)

**Product Benefit:**
- Defers partially-built feature
- Reduces job feed complexity
- Allows focus on core matching

**Timeline:** Hide by default. Unhide when application → interview threshold reached.

---

## SECTION 4: DEFER TO FUTURE VERSION

### **4.1 Multi-Persona Strategic Planning (v1.5 or v2)**

**What It Is:**
Ability to explore multiple career paths simultaneously. "Should I pursue Staff Engineer OR Manager?" Apply to both, see what works.

**Why Defer:**
1. **Not core problem:** Most users need to nail *one* target first
2. **Blocks simplification:** Current architecture complex because personas are primary model
3. **Low adoption:** Users create 1 persona, abandon feature
4. **Later value:** *After* getting first offer, user is in position to explore alternate paths

**What to Say:**
"Exploring multiple paths? Coming in v1.5. For now, master one track."

**When to Reintroduce:**
- After user gets offer in primary track
- After user comfortable with one persona
- When user explicitly asks for it

**Timeline:** Kill from v1, plan for v2.

---

### **4.2 Resume Variants & Auto-Tailoring**

**What It Is:**
System auto-generates resume variants tailored to specific jobs. "For this backend role, here's your resume optimized with backend-specific keywords and examples."

**Why Defer:**
1. **Requires resume→job matching AI:** Build complex, needs testing
2. **Depends on base resume being good:** Can't optimize bad resume
3. **Higher-order feature:** Solves problem *after* user has core resume
4. **v1.5 feature:** Can build once base resume optimization is solid

**What to Say:**
"One-click tailored resumes? Coming soon. First, let's nail your base resume."

**When to Reintroduce:**
- After user has 1-2 interviews
- After ATS score is >80
- After system understands user's skills/experience

**Timeline:** Defer to v1.5 or v2.

---

### **4.3 Skill Gap Learning Paths**

**What It Is:**
When rejection mentions "need Kubernetes," system generates: learning plan, courses, projects, timeline, success metrics.

**Why Defer:**
1. **Requires extensive AI task:** Generate structured learning paths + track completion
2. **Requires integration with learning platforms:** Links to Udemy, Coursera, YouTube—needs sourcing
3. **Completion tracking:** How does system know user completed learning? Needs manual input or integration.
4. **Later value:** User needs to learn, but should focus on *applying* first

**What to Say:**
"Learning paths for skill gaps? Coming in v2. For now, we'll show you the gap and resources."

**When to Reintroduce:**
- After user has time (not in first-job-search crisis)
- After user shows intent to learn
- When system can measure learning impact

**Timeline:** Defer to v2.

---

### **4.4 Market Positioning Intelligence**

**What It Is:**
System analyzes user's application patterns to determine: "Market sees you as Senior IC, not Staff" or "You're credible for Manager roles but not at these top-tier companies."

**Why Defer:**
1. **Requires significant data:** Need 50+ applications + outcomes to build reliable model
2. **Risk of being wrong:** Early positioning guidance could demoralize user ("Market doesn't see you as Staff")
3. **Not urgent:** User can figure this out over time
4. **Later value:** More useful after 3-6 months of data

**What to Say:**
"Market insights? Coming when we have enough data on your applications and outcomes."

**When to Reintroduce:**
- After 50+ applications minimum
- After 10+ interview outcomes
- When user asks for guidance

**Timeline:** Defer 3-6 months.

---

### **4.5 Interview Performance Prediction**

**What It Is:**
System predicts: "Based on your practice scores and behavioral patterns, you have 40% chance at this specific company's interview."

**Why Defer:**
1. **Confidence requires data:** Predictive model needs 100+ interviews (real + practice) to be reliable
2. **Risk of demotivation:** Telling user "40% chance" could discourage them from trying
3. **Not core need:** User needs preparation, not probability forecasting

**What to Say:**
"Interview predictions? Coming when we understand your patterns better."

**Timeline:** Defer 6+ months.

---

## SECTION 5: CONSOLIDATE TERMINOLOGY

### **5.1 Standardize "Insights" Terminology**

**Current Chaos:**
- PatternInsights (UI component)
- Pattern Insights (concept)
- AutoTune Suggestions (separate concept)
- Opportunity Alerts (separate concept)
- Daily Briefings (separate concept)

**Consolidate To:**
- **Insights** (unified term for all pattern-driven advice)
  - Job Insights: "Here are great matches"
  - Behavior Insights: "You're dismissing on-site roles"
  - Action Insights: "We adjusted your filters. Here are results."

Single model. Consistent naming. User thinks: "Insights are where the system tells me something useful."

**Timeline:** Rename across codebase + UI.

---

## SECTION 6: DELETE DEAD PATHS

### **6.1 Networking Feature (if not integrated)**

**What It Is:**
Database tables and UI for managing professional network connections. Stored in `networking_contacts` table.

**Why Delete (if unused):**
1. **Orphaned infrastructure:** Infrastructure exists but isn't used in core flows (job feed, application)
2. **No integration:** Can look up contacts but can't do anything with it
3. **Maintenance burden:** DB table, hooks, API endpoints for feature that doesn't work end-to-end
4. **Half-baked:** useNetworkLookup.ts exists but unused

**Option A: Complete It (Mid-term)**
- Integrate into job feed: "You know people at this company"
- Integrate into applications: "Warm intro from [contact]?"
- Complete warm intro flow
- Requires 2-4 weeks

**Option B: Delete It (Now)**
- Remove networking_contacts table from migrations
- Remove useNetworkLookup hook
- Remove networking UI components
- Clean codebase

**Recommendation:**
If networking integration isn't in next 4 weeks roadmap: **Delete it.** Don't let half-built features accumulate.

**Timeline:** Decide now. Commit to integration or delete.

---

### **6.2 LinkedIn/Portfolio Analysis (if not driving recommendations)**

**What It Is:**
Ability to upload LinkedIn profile or portfolio URL. System analyzes for: seniority, skills, gaps, opportunities.

**Why Delete (if orphaned):**
1. **No downstream action:** Analysis stored in `linkedin_profiles` + `portfolio_analyses` tables but nothing uses it
2. **Not driving decisions:** System doesn't say "Your portfolio shows mainly frontend. I'll prioritize frontend roles."
3. **Maintenance without value:** Profile parsing, analysis generation for data that isn't used
4. **Unfinished:** Analysis exists but doesn't feed back into job matching or recommendations

**Option A: Complete It (Later)**
- Use portfolio analysis to understand user better
- Incorporate into match algorithm
- "Your portfolio shows strong AWS skills. Prioritizing AWS roles."

**Option B: Delete It (Now)**
- Remove LinkedIn/portfolio UI
- Remove analysis generation
- Use resume as single source of truth

**Recommendation:**
If portfolio insights aren't being used within 2 weeks: **Delete it.** Incomplete features are maintenance debt.

**Timeline:** Implement integration quickly or delete to reduce surface area.

---

## SUMMARY: THE KILL LIST

### **Kill Immediately (7 items):**
1. ❌ **Multi-Persona Architecture** → Single Job Target model
2. ❌ **RelevanceTuner (5 sliders)** → Smart defaults + behavior-driven weighting
3. ❌ **WellnessMode (if no behavior)** → Either full commit or delete entirely
4. ❌ **PatternInsights (display only)** → Pattern-driven action, not display
5. ❌ **Multiple Resume Versions** → Single main resume + auto-variants
6. ❌ **Interview Scoring (without outcomes)** → Practice + outcome measurement
7. ❌ **Cost/Provider Display** → Hide behind advanced settings

### **Merge or Simplify (3 items):**
1. 🔀 **PatternInsights + AutoTune** → Single "Insight" feature with action
2. 🔀 **Resume Analyzer + ATS Score** → "Resume Health" card
3. 🔀 **Multiple Alerts** → Single "Opportunities" stream

### **Hide Behind Progressive Disclosure (4 items):**
1. 👁️ **Advanced Persona Settings** → Show after basic creation
2. 👁️ **Rejection Analysis Coaching** → Show after 5+ rejections
3. 👁️ **Networking Contact Display** → Show after 2+ interviews
4. 👁️ **Cost/Provider Transparency** → Optional advanced view

### **Defer to Future Versions (5 items):**
1. ⏳ **Multi-Persona Strategic Planning** → v1.5 or v2
2. ⏳ **Resume Variants & Auto-Tailoring** → v1.5
3. ⏳ **Skill Gap Learning Paths** → v2
4. ⏳ **Market Positioning Intelligence** → v2 (needs 50+ applications data)
5. ⏳ **Interview Performance Prediction** → v2+ (needs 100+ interviews data)

### **Delete Dead Paths (2 items):**
1. 🗑️ **Networking Feature** → Integrate in 4 weeks or delete
2. 🗑️ **LinkedIn/Portfolio Analysis** → Integrate in 2 weeks or delete

---

## OUTCOME: THE REDUCTIONIST RELEVNT

**Before:**
- 15+ major features
- 8+ settings categories
- 5+ data visualization panels
- Multiple suggestion types
- Parallel features (PatternInsights + AutoTune)
- Optional complexity (personas, weights, notifications)

**After:**
- 8 core features (job matching, applications, interview prep, resume, negotiations, outreach, wellness alert, insights)
- 2 settings categories (job target, notifications)
- 2 data visualization panels (applications progress, interview prep)
- 1 suggestion type (unified insights)
- Merged features (insights, resume health, opportunities)
- Progressive complexity (simple → advanced on request)

**Result:**
- **Fewer decisions users must make** (50% reduction in mental overhead)
- **Clearer value per feature** (each feature has clear ROI)
- **Easier to explain** (Can describe product in 2 sentences instead of 10)
- **Faster onboarding** (3 questions instead of 15)
- **Higher adoption** (users understand and use core features)
- **Easier maintenance** (fewer features, lower complexity)
- **More momentum** (resources freed for core loop optimization)

---

## FINAL PRINCIPLE

**Every feature that survives should satisfy at least one of:**
1. **Essential:** User can't accomplish core goal without it
2. **High-ROI:** Asymmetric value (small effort, big impact)
3. **Differentiator:** Makes product meaningfully different
4. **Compounding:** Gets better with use; unlocks other features

**If a feature doesn't meet these criteria, it's debt. Kill it.**

---

*Authored by Lyra, Reductionist Strategist*
*Kill List Date: 2024-12-22*
*System: Relevnt (Career Concierge Platform)*
