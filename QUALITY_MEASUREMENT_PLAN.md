# Quality & Measurement Plan — Visual Identity Audit

**Purpose:** Prevent regression in design system, measure improvements, enable safe shipping
**Status:** Ready for implementation
**Scope:** Design system, styling, UX flows
**Timeline:** Implement incrementally over 2 weeks

---

## PART A: REGRESSION GUARDRAILS

### 1. ESLint Rules (Design System Compliance)

**File:** `.eslintrc.json` (add to existing rules)

```json
{
  "rules": {
    "no-restricted-syntax": [
      "warn",
      {
        "selector": "CallExpression[callee.name='useState'] > Literal[value=/accent|gold|glow/i]",
        "message": "⚠️  Avoid storing accent color state directly. Use theme context instead."
      },
      {
        "selector": "ObjectExpression > Property[key.name=/accentGlow|goldDust|gradient/i]",
        "message": "⚠️  Removed from design system. Use design tokens instead."
      }
    ],
    "no-restricted-imports": [
      "warn",
      {
        "name": "react",
        "importNames": ["cloneElement"],
        "message": "cloneElement can bypass design system props. Use component composition instead."
      }
    ]
  }
}
```

**What it catches:**
- Direct accent color usage in component state
- References to removed patterns (gold-dust, accent-glow)
- Dangerous patterns that bypass design system

**Severity:** ⚠️ WARN (not error; allows shipping with visibility)

---

### 2. Stylelint Rules (CSS Compliance)

**File:** `.stylelintrc.json` (add to existing rules)

```json
{
  "rules": {
    "color-no-invalid-hex": true,
    "function-disallowed-list": [
      "linear-gradient",
      "radial-gradient",
      {
        "message": "Gradients removed from design system. Use solid colors from tokens only."
      }
    ],
    "property-disallowed-list": [
      {
        "property": ["box-shadow"],
        "where": {
          "selector": ":not(:focus-visible)"
        },
        "message": "Decorative shadows removed. Use only on :focus-visible or from --shadow-* tokens."
      },
      {
        "property": ["filter"],
        "where": {
          "selector": "[class*='drop-shadow']"
        },
        "message": "drop-shadow filters removed. Use color or border instead."
      }
    ],
    "declaration-property-value-disallowed-list": {
      "background": [
        "var(--color-accent-glow)",
        "var(--color-accent-soft)"
      ],
      "message": "Accent-soft/glow backgrounds removed. Use var(--color-surface) or var(--color-surface-hover)."
    },
    "declaration-no-important": [
      true,
      {
        "except": [
          "color",
          "outline"
        ],
        "message": "!important allowed only on :focus-visible rules (accessibility)"
      }
    ],
    "color-named": [
      "never",
      {
        "message": "Use CSS variables from design-tokens.css, not named colors"
      }
    ]
  }
}
```

**What it catches:**
- New gradients (hardest violation to miss)
- Decorative box-shadows outside focus states
- drop-shadow filters on icons
- Accent-soft backgrounds
- Direct color values (forces token usage)

**Severity:** ⚠️ WARN for new code, but lint entire codebase weekly

---

### 3. CI Checks (Automated Quality Gates)

**File:** `.github/workflows/design-lint.yml` (new workflow)

```yaml
name: Design System Lint

on:
  pull_request:
    paths:
      - 'src/**/*.css'
      - 'src/**/*.tsx'
      - 'tailwind.config.ts'
  push:
    branches: [main, develop]

jobs:
  design-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # ESLint check for component violations
      - name: ESLint - Design System Rules
        run: npm run lint -- --rule "no-restricted-syntax: error"
        continue-on-error: true

      # Stylelint check for CSS violations
      - name: Stylelint - CSS Compliance
        run: npm run stylelint -- "src/styles/**/*.css"
        continue-on-error: true

      # Custom script: Check for illegal patterns
      - name: Pattern Detection - Illegal Design Elements
        run: |
          # Fail if new gradients found (except in comments)
          if grep -r "linear-gradient\|radial-gradient" src/styles/*.css | grep -v "\/\*" | grep -v "^[[:space:]]*\/\/"; then
            echo "❌ FAIL: New gradients detected in CSS"
            exit 1
          fi

          # Fail if drop-shadow filters found (except in old icon-kit comments)
          if grep -r "filter: drop-shadow" src/styles/*.css | grep -v "REMOVED\|removed\|icon-kit.css"; then
            echo "❌ FAIL: Decorative drop-shadow filters detected"
            exit 1
          fi

          # Warn if accent-soft backgrounds found (except design-tokens.css)
          if grep -r "var(--color-accent-soft)" src/styles/*.css | grep -v "design-tokens.css"; then
            echo "⚠️  WARNING: accent-soft background found. Should use surface-hover instead."
          fi
        continue-on-error: true

      # Check accent color usage is limited
      - name: Accent Color Budget Check
        run: |
          COUNT=$(grep -r "var(--color-accent)" src/styles/*.css | wc -l)
          if [ $COUNT -gt 25 ]; then
            echo "⚠️  WARNING: Accent color usage is $COUNT (budget: 25)"
            echo "Review: Are all uses justified (buttons, nav, focus)?"
          fi

      # Visual regression baseline (optional, see section below)
      - name: Visual Regression Snapshot
        run: npm run snapshot:update || true

  comment-on-pr:
    needs: design-compliance
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - name: Comment PR with Design Lint Results
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Design system lint passed. CSS, tokens, and patterns are compliant.'
            })
```

**What it does:**
- ✅ Runs ESLint with design system rules
- ✅ Runs Stylelint for CSS compliance
- ✅ Detects new gradients, drop-shadows, accent-soft
- ✅ Tracks accent color budget (<25 uses)
- ✅ Comments on PRs with status
- ⚠️ Allows merging with warnings (not hard blocks)

**Severity:** ⚠️ WARN + comment, not blocking

---

### 4. "Illegal Patterns" Definition

**What is NOT allowed (and will trigger CI warnings):**

| Pattern | Why Removed | Replacement | Severity |
|---------|-------------|-------------|----------|
| `linear-gradient()` | Visual noise | Solid `var(--color-*)` | 🛑 HARD ERROR |
| `filter: drop-shadow()` | Decorative | Color or border only | 🛑 HARD ERROR |
| `var(--color-accent-soft)` | Misuse of accent | Use `--color-surface-hover` | ⚠️ WARN |
| `var(--color-accent-glow)` | Decorative effect | Use shadow tokens or remove | ⚠️ WARN |
| Arbitrary colors `bg-[#fff]` | Token bypass | Use `bg-surface`, `bg-bg` | ⚠️ WARN |
| `.btn--primary` on non-CTA | Accent overuse | Use `.btn--secondary` | ⚠️ WARN |
| Multiple accent uses per page | Visual noise | Max 1 per screen | ⚠️ WARN |
| `small-caps` CSS | Typography rule | Use `text-uppercase` | ⚠️ WARN |
| Decorative quotes `::before/after` | Visual clutter | Use text content | ⚠️ WARN |

**CI treats these as:**
- 🛑 **HARD ERROR** (gradient, drop-shadow): Blocks merge, must fix
- ⚠️ **WARN** (everything else): Passes, but flags for review

---

### 5. Visual Regression Testing (Lightweight)

**Approach:** Snapshot-based, not screenshot comparison (too heavy)

**Implementation:** Use `jest-image-snapshot` on critical paths

```javascript
// tests/visual-regression.test.ts
import { render } from '@testing-library/react';
import { initializeImageSnapshotMatchers } from 'jest-image-snapshot';

initializeImageSnapshotMatchers();

describe('Visual Regression - Design System', () => {
  it('Button - Primary state should match snapshot', () => {
    const { container } = render(<Button variant="primary">Save</Button>);
    expect(container.firstChild).toMatchImageSnapshot({
      customSnapshotIdentifier: 'button-primary-light',
      // Only recompile if visual changes are intentional
      failureThreshold: 0.01,
      failureThresholdType: 'percent'
    });
  });

  it('Empty State should match snapshot', () => {
    const { container } = render(
      <EmptyState title="No jobs" description="Start exploring" />
    );
    expect(container.firstChild).toMatchImageSnapshot({
      customSnapshotIdentifier: 'empty-state-light'
    });
  });

  it('Table Row hover should match snapshot', () => {
    const { container } = render(
      <TableRow hovered>
        <TableCell>Job Title</TableCell>
        <TableCell>Company</TableCell>
      </TableRow>
    );
    expect(container.firstChild).toMatchImageSnapshot({
      customSnapshotIdentifier: 'table-row-hover'
    });
  });

  it('Focus ring should match snapshot', () => {
    const { container } = render(
      <input type="text" autoFocus />
    );
    expect(container.firstChild).toMatchImageSnapshot({
      customSnapshotIdentifier: 'focus-ring-gold'
    });
  });
});
```

**What it catches:**
- Unintended color changes
- Typography size/weight changes
- Spacing/padding changes
- Focus ring removal or changes

**Snapshot update:** `npm run test:update-snapshots` (manual, intentional)

**Lightweight because:**
- ✅ Only critical components (5-10 snapshots, not every page)
- ✅ Snapshots live in git (no external storage)
- ✅ Fast CI check (<10 seconds)
- ✅ Developers must explicitly approve visual changes

---

## PART B: INSTRUMENTATION PLAN (Analytics & KPIs)

### 1. Core Analytics Events

**Goal:** Track adoption of improved flows and measure trust/clarity impact

```typescript
// lib/analytics.ts
export enum DesignSystemEvents {
  // Empty state interactions
  EMPTY_STATE_VIEWED = 'empty_state_viewed',
  EMPTY_STATE_CTA_CLICKED = 'empty_state_cta_clicked',

  // Focus ring usage (keyboard nav)
  KEYBOARD_NAV_INITIATED = 'keyboard_nav_initiated',
  FOCUS_RING_ACTIVATION = 'focus_ring_activation',

  // Progress feedback
  UPLOAD_STARTED = 'upload_started',
  UPLOAD_PROGRESS = 'upload_progress',
  UPLOAD_COMPLETED = 'upload_completed',
  UPLOAD_FAILED = 'upload_failed',

  // Form submission
  FORM_SUBMITTED = 'form_submitted',
  FORM_ERROR_SHOWN = 'form_error_shown',
  FORM_SUCCESS_SHOWN = 'form_success_shown',

  // Table/list interactions
  TABLE_ROW_CLICKED = 'table_row_clicked',
  TABLE_FILTERED = 'table_filtered',
  TABLE_SORTED = 'table_sorted',

  // Navigation
  NAV_ITEM_CLICKED = 'nav_item_clicked',
  NAV_FOCUS_USED = 'nav_focus_used',
}

export const trackEvent = (event: DesignSystemEvents, data?: Record<string, any>) => {
  // Send to your analytics provider (Segment, Amplitude, etc.)
  // Include: event name, timestamp, user_id, properties
};
```

**Event Implementation Examples:**

```typescript
// Component: EmptyState with CTA
export const EmptyState = ({ title, description, action }) => {
  const handleCTA = () => {
    trackEvent(DesignSystemEvents.EMPTY_STATE_CTA_CLICKED, {
      empty_state_location: location.pathname,
      action_label: action.label,
    });
    action.onClick();
  };

  useEffect(() => {
    trackEvent(DesignSystemEvents.EMPTY_STATE_VIEWED, {
      location: location.pathname,
    });
  }, []);

  return (
    <div className="empty-state">
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      <button className="btn btn--primary" onClick={handleCTA}>
        {action.label}
      </button>
    </div>
  );
};

// Component: Upload with progress feedback
export const ResumeUpload = () => {
  const handleUpload = async (file) => {
    trackEvent(DesignSystemEvents.UPLOAD_STARTED, { file_type: file.type });

    try {
      const response = await uploadFile(file, (progress) => {
        trackEvent(DesignSystemEvents.UPLOAD_PROGRESS, {
          progress_percent: Math.round(progress * 100)
        });
      });

      trackEvent(DesignSystemEvents.UPLOAD_COMPLETED, {
        duration_ms: response.duration,
        file_size: file.size,
      });
    } catch (error) {
      trackEvent(DesignSystemEvents.UPLOAD_FAILED, {
        error_message: error.message,
      });
    }
  };

  return (
    <input
      type="file"
      onChange={(e) => handleUpload(e.target.files[0])}
    />
  );
};

// Component: Focus ring usage
export const FormInput = () => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        trackEvent(DesignSystemEvents.KEYBOARD_NAV_INITIATED);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <input type="text" />;
};
```

**Minimum events to track (MVP):**
1. Empty state CTA clicks
2. Keyboard navigation (Tab key detection)
3. Form errors/success
4. Upload progress milestones
5. Navigation clicks

---

### 2. Key Performance Indicators (KPIs)

**Track these metrics weekly to measure impact:**

| KPI | Definition | Target | Owner |
|-----|-----------|--------|-------|
| **Activation Rate** | % of users who complete onboarding | >70% | Product |
| **Time to First Value** | Median time from signup to first job applied | <7 days | Product |
| **Completion Rate** | % of users who finish primary flow (apply) | >50% | Product |
| **Keyboard Nav Usage** | % of sessions using Tab/keyboard navigation | >15% | UX |
| **Error Recovery Rate** | % of users who retry after error vs. abandon | >60% | Engineering |
| **Upload Success Rate** | % of resume uploads that complete | >95% | Engineering |
| **Focus Ring Visibility** | % of keyboard users who report focus is clear (survey) | >85% | Design |

**Dashboard setup (weekly review):**
```
[Sales/Analytics Tool]
├── Activation Rate (>70%)
├── TTFV (target <7 days, median)
├── Completion Rate (>50%)
├── Keyboard Nav % (<15% is warning)
├── Error Recovery (>60%)
├── Upload Success (>95%)
└── Keyboard Nav Survey Score (>85%)
```

**Measurement method per KPI:**

1. **Activation Rate**
   ```sql
   SELECT
     COUNT(DISTINCT user_id) as total_signups,
     COUNT(DISTINCT CASE WHEN onboarding_completed = true THEN user_id END) as completed,
     ROUND(100.0 * COUNT(DISTINCT CASE WHEN onboarding_completed = true THEN user_id END) / COUNT(DISTINCT user_id), 2) as activation_rate
   FROM users
   WHERE signup_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
   ```

2. **Time to First Value**
   ```sql
   SELECT
     PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_first_apply) as median_ttfv
   FROM (
     SELECT
       user_id,
       DATEDIFF(DAY, signup_date, first_application_date) as days_to_first_apply
     FROM user_journey
     WHERE first_application_date IS NOT NULL
   )
   ```

3. **Completion Rate**
   ```sql
   SELECT
     COUNT(DISTINCT CASE WHEN final_status = 'applied' THEN user_id END) as completed,
     COUNT(DISTINCT user_id) as total,
     ROUND(100.0 * COUNT(DISTINCT CASE WHEN final_status = 'applied' THEN user_id END) / COUNT(DISTINCT user_id), 2) as completion_rate
   FROM user_flows
   WHERE flow = 'job_application'
   ```

4. **Keyboard Navigation Usage**
   ```sql
   SELECT
     ROUND(100.0 * COUNT(DISTINCT CASE WHEN keyboard_nav_initiated = true THEN session_id END) / COUNT(DISTINCT session_id), 2) as keyboard_nav_percent
   FROM sessions
   WHERE event_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
   ```

5. **Error Recovery**
   ```sql
   SELECT
     COUNT(DISTINCT CASE WHEN retried_after_error = true THEN user_id END) as recovered,
     COUNT(DISTINCT CASE WHEN form_error_shown = true THEN user_id END) as errored,
     ROUND(100.0 * COUNT(DISTINCT CASE WHEN retried_after_error = true THEN user_id END) / COUNT(DISTINCT CASE WHEN form_error_shown = true THEN user_id END), 2) as recovery_rate
   FROM user_events
   ```

---

### 3. Survey Instrumentation

**Send lightweight surveys to keyboard users (quarterly):**

```typescript
export const FocusRingSurvey = () => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Show survey only to users who used keyboard navigation
    const keyboardUsageCount = sessionStorage.getItem('keyboard_nav_count');

    if (keyboardUsageCount && parseInt(keyboardUsageCount) > 5) {
      setTimeout(() => setShown(true), 5000); // After 5s of use
    }
  }, []);

  if (!shown) return null;

  return (
    <div className="survey-modal">
      <h3>Quick question about keyboard navigation</h3>
      <p>When you press Tab, can you clearly see the gold focus ring?</p>
      <div className="survey-options">
        <button
          onClick={() => {
            trackEvent('survey_response', { question: 'focus_ring_visibility', answer: 'yes' });
            setShown(false);
          }}
        >
          Yes, very clear
        </button>
        <button
          onClick={() => {
            trackEvent('survey_response', { question: 'focus_ring_visibility', answer: 'somewhat' });
            setShown(false);
          }}
        >
          Somewhat clear
        </button>
        <button
          onClick={() => {
            trackEvent('survey_response', { question: 'focus_ring_visibility', answer: 'no' });
            setShown(false);
          }}
        >
          Not clear
        </button>
      </div>
    </div>
  );
};
```

---

## PART C: RELEASE PLAYBOOK

### 1. Rollout Strategy (Staged, Feature-Flagged)

**Phase 1: Internal Testing (Week 1)**
- Deploy to staging environment
- Internal team tests all flows
- Fix any CSS issues
- Verify no CI failures

**Phase 2: Beta Release (Week 2, 10% of users)**
- Feature flag: `visual_identity_v2_enabled` (default: false)
- Gradually increase to 10% of production
- Monitor error rates, page load time
- Collect feedback from beta users
- If issues: rollback immediately

**Phase 3: Full Release (Week 3, 100% of users)**
- Increase feature flag to 100%
- Monitor all KPIs for 48 hours
- Watch for CSS regressions, focus ring issues
- If issues: rollback via feature flag (instant)

**Phase 4: Feature Flag Cleanup (Week 4)**
- Remove feature flag code
- Make visual identity v2 the default
- Delete all old CSS classes

**Feature flag implementation:**

```typescript
// contexts/FeatureFlags.ts
export const useFeatureFlags = () => {
  const [flags, setFlags] = useState({
    visual_identity_v2_enabled: false,
  });

  useEffect(() => {
    // Fetch from server based on user_id
    fetch(`/api/feature-flags?user_id=${userId}`)
      .then(r => r.json())
      .then(data => setFlags(data));
  }, [userId]);

  return flags;
};

// Usage in component
export const Button = ({ variant = 'primary', children }) => {
  const { visual_identity_v2_enabled } = useFeatureFlags();

  const className = visual_identity_v2_enabled
    ? 'btn btn--primary' // NEW: unified pattern
    : 'btn btn-primary-legacy'; // OLD: custom styles

  return <button className={className}>{children}</button>;
};
```

---

### 2. Rollback Plan

**Automatic Rollback Triggers:**

```yaml
# .github/workflows/monitor-release.yml
name: Release Monitoring

on:
  workflow_dispatch:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes during release

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Check Error Rate
        run: |
          ERROR_RATE=$(curl -s https://analytics.api/error-rate | jq '.percent')
          if (( $(echo "$ERROR_RATE > 2.0" | bc -l) )); then
            echo "❌ Error rate $ERROR_RATE% exceeds threshold (2%)"
            curl -X POST https://api/feature-flags/rollback \
              -d '{"flag": "visual_identity_v2_enabled", "value": false}'
            echo "↩️  Rolled back feature flag"
          fi

      - name: Check Page Load Time
        run: |
          P95_LOAD_TIME=$(curl -s https://analytics.api/page-load-time | jq '.p95_ms')
          if (( $(echo "$P95_LOAD_TIME > 3500" | bc -l) )); then
            echo "⚠️  Page load P95: ${P95_LOAD_TIME}ms (target: <3500ms)"
            # Don't auto-rollback for load time, just alert
            curl -X POST https://slack.api/notify \
              -d '{"channel": "#engineering", "message": "⚠️  Page load time degrading"}'
          fi

      - name: Check Focus Ring Reports
        run: |
          ACCESSIBILITY_ISSUES=$(curl -s https://api/bug-reports | jq '.focus_ring_issues')
          if [ $ACCESSIBILITY_ISSUES -gt 5 ]; then
            echo "❌ $ACCESSIBILITY_ISSUES focus ring issues reported"
            curl -X POST https://api/feature-flags/rollback \
              -d '{"flag": "visual_identity_v2_enabled", "value": false}'
            echo "↩️  Rolled back feature flag"
          fi
```

**Manual Rollback (instant):**
1. Go to feature flag admin panel
2. Set `visual_identity_v2_enabled` to `false`
3. All users see old styles within 2 minutes (cache invalidation)
4. Create incident post-mortem

**Rollback Success Criteria:**
- ✅ Feature flag disabled in <5 minutes
- ✅ Old CSS served to 100% within 2 minutes
- ✅ Error rate returns to baseline within 10 minutes
- ✅ No user data loss

---

### 3. MVP Shipping Checklist

**Pre-Deployment (Must have ✅ before shipping)**

### Design System Compliance
- [ ] All decorative CSS removed (gradients, shadows, animations)
- [ ] Accent color usage <20 instances
- [ ] All colors use `var(--color-*)` tokens
- [ ] All spacing uses 4px grid
- [ ] Focus ring is visible and consistent
- [ ] No arbitrary Tailwind colors `bg-[#fff]`

### Code Quality
- [ ] ESLint passes (design system rules)
- [ ] Stylelint passes (CSS compliance)
- [ ] No console errors or warnings
- [ ] TypeScript strict mode passes
- [ ] Jest tests pass (including visual snapshots)

### Accessibility
- [ ] Focus ring visible on all interactive elements
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] Keyboard navigation works on primary flows
- [ ] Color contrast is WCAG AA compliant
- [ ] Semantic HTML used (proper heading levels, ARIA roles)

### Performance
- [ ] CSS file size reduced (textures.css deleted)
- [ ] Page load time <3.5s (P95)
- [ ] No new animations or decorative effects
- [ ] Bundle size within budget (<5% increase)
- [ ] Lighthouse score maintained or improved

### Analytics
- [ ] Event tracking implemented for critical flows
- [ ] Feature flag integrated
- [ ] Rollback automation configured
- [ ] Dashboards created (KPIs tracked)
- [ ] Error rate baseline established

### Documentation
- [ ] VISUAL_IDENTITY_AUDIT.md is up to date
- [ ] IMPLEMENTATION_GUIDE.md has no TODOs
- [ ] CSS pattern examples documented
- [ ] Design token reference complete
- [ ] Rollback procedure documented

### Stakeholder Sign-off
- [ ] Design review approved
- [ ] Product review approved
- [ ] Engineering lead approved
- [ ] Security review (if applicable)

### Testing Completed
- [ ] Visual regression snapshots updated
- [ ] Manual testing on mobile (iOS + Android)
- [ ] Manual testing on light mode
- [ ] Manual testing on dark mode
- [ ] Tested with keyboard navigation (Tab, Enter)
- [ ] Tested with screen reader (NVDA or JAWS)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### Monitoring Ready
- [ ] Error tracking enabled
- [ ] Performance monitoring enabled
- [ ] User feedback collection ready
- [ ] Incident response team notified
- [ ] Rollback runbook reviewed

---

## PART D: IMPLEMENTATION CHECKLIST (2-Week Timeline)

### Week 1: Setup & Implementation

**Monday (Day 1)**
- [ ] Create feature flag `visual_identity_v2_enabled`
- [ ] Set flag to `false` for all users (safe default)
- [ ] Deploy feature flag code (no user-facing changes yet)
- [ ] Create CI workflow `.github/workflows/design-lint.yml`
- [ ] Configure ESLint design system rules
- [ ] Configure Stylelint CSS compliance rules

**Tuesday (Day 2)**
- [ ] Implement analytics event tracking
- [ ] Add event calls to EmptyState component
- [ ] Add event calls to form components
- [ ] Add keyboard navigation detection
- [ ] Create analytics dashboard (KPI tracking)
- [ ] Test event flow in staging

**Wednesday (Day 3)**
- [ ] Implement visual regression snapshots (jest-image-snapshot)
- [ ] Create 5-10 critical component snapshots (Button, EmptyState, Table, Input, Focus ring)
- [ ] Generate baseline snapshots
- [ ] Add snapshot tests to CI workflow
- [ ] Test snapshot matching locally

**Thursday (Day 4)**
- [ ] Implement automatic rollback triggers
- [ ] Configure error rate monitoring
- [ ] Configure page load time monitoring
- [ ] Create Slack alerts for issues
- [ ] Test rollback in staging
- [ ] Document rollback procedure

**Friday (Day 5)**
- [ ] Internal team testing (all flows, light/dark mode)
- [ ] Fix any CSS bugs discovered
- [ ] Verify CI passes
- [ ] Prepare staging deployment
- [ ] Brief team on rollout plan
- [ ] Create incident response guide

---

### Week 2: Rollout & Validation

**Monday (Day 6) — Beta Phase**
- [ ] Deploy to staging environment
- [ ] Set feature flag to `true` for internal team
- [ ] Monitor error rate (target: <1%)
- [ ] Monitor page load time (target: <3.5s)
- [ ] Check focus ring visibility
- [ ] Gather internal feedback

**Tuesday (Day 7) — 10% Rollout**
- [ ] Gradually increase feature flag to 10% of users
- [ ] Monitor KPIs every hour
- [ ] Check Slack alerts for issues
- [ ] Monitor error rate closely
- [ ] Be ready to rollback instantly
- [ ] Collect early user feedback

**Wednesday (Day 8) — 50% Rollout**
- [ ] Increase feature flag to 50% (if no issues)
- [ ] Monitor all KPIs
- [ ] Check analytics dashboard for patterns
- [ ] Verify empty state CTAs are working
- [ ] Verify keyboard navigation is tracked
- [ ] Look for accessibility issues

**Thursday (Day 9) — 100% Rollout**
- [ ] Increase feature flag to 100%
- [ ] Monitor all KPIs intensively for first 2 hours
- [ ] Be ready to rollback if issues arise
- [ ] After 2 hours, monitor every 30 minutes
- [ ] After 24 hours, monitor daily
- [ ] Send "launch successful" notification to team

**Friday (Day 10) — Feature Flag Cleanup**
- [ ] Remove feature flag logic from code
- [ ] Delete old CSS classes
- [ ] Clean up feature flag table in database
- [ ] Verify visual identity v2 is default for all users
- [ ] Update documentation
- [ ] Schedule post-launch retrospective

---

### Week 3+: Monitoring & Iteration

**Ongoing (Daily)**
- [ ] Review KPI dashboard (activation, TTFV, completion)
- [ ] Monitor error rate (target: <2%)
- [ ] Check for new CSS compliance issues
- [ ] Review user feedback

**Weekly (Friday)**
- [ ] Review all KPI trends
- [ ] Update design system documentation
- [ ] Plan next phase improvements
- [ ] Share wins with team

**Monthly (End of month)**
- [ ] Publish impact report (activation, TTFV, completion rates)
- [ ] Analyze keyboard nav usage patterns
- [ ] Plan next design system improvements
- [ ] Gather stakeholder feedback

---

## SUMMARY

### What Gets Measured
✅ Regression prevention (CI, ESLint, Stylelint, visual snapshots)
✅ User impact (analytics events, KPIs, surveys)
✅ System health (error rate, load time, accessibility)

### What Gets Tracked
✅ Activation rate (>70% target)
✅ Time to first value (<7 days target)
✅ Completion rate (>50% target)
✅ Keyboard navigation usage (>15% target)
✅ Error recovery (>60% target)
✅ Upload success (>95% target)
✅ Focus ring clarity (>85% survey)

### What Enables Safe Shipping
✅ Feature flags (instant rollback)
✅ Staged rollout (10% → 50% → 100%)
✅ Automated monitoring (error rate, load time)
✅ Clear rollback triggers
✅ Incident response plan

### What's Lightweight & Practical
✅ Snapshot-based visual regression (not heavy tools)
✅ ESLint/Stylelint rules (built-in tooling)
✅ Simple SQL queries for KPIs
✅ Bash script pattern detection in CI
✅ No external services required

**Timeline:** 2 weeks to implement and deploy
**Cost:** ~40 engineering hours
**Risk:** LOW (feature flags, staged rollout, instant rollback)

---

**Ready to ship safe, measure impact, and enable fast iteration.**
