# Action Plan: Next Steps

**Status:** All deliverables ready. Two parallel tracks to execute.

---

## 🎯 IMMEDIATE ACTION (This Week)

### Track 1: Code Review (Engineering Team)

**What to do:**
1. Go to GitHub: `thepennylaneproject/Relevnt`
2. Create new Pull Request from `claude/product-coherence-audit-VLIOX` → `main`
3. Add PR title: "Phase 1: Product Coherence Audit & Dark Academia Design Spec"
4. Add PR description (template provided below)
5. Assign reviewers from engineering team
6. Request review

**PR Description Template:**
```
## Summary
Cycle 1: Product Coherence Audit complete with targeted fixes.
Phase 2: Dark Academia Design Specification ready for team review.

## What's Fixed
✅ Password Reset — Full Supabase auth implementation
✅ Auto-Apply Copy — Value-forward messaging ("Save 2-3 hours/week")
✅ Feature Discoverability — Auto-Apply teaser in Dashboard
✅ Wellness Mode — Explanation tooltip & help text
✅ Settings Help Text — Match Sensitivity clarity

## Coherence Score
Before: 72/100
After: 81/100 (+9 points)

## Files Modified
- src/pages/PasswordResetPage.tsx
- src/components/settings/tabs/AutoApplyTab.tsx
- src/components/dashboard/QuickActionsPanel.tsx
- src/components/dashboard/WellnessCheckin.tsx
- src/components/settings/tabs/SystemAutomationTab.tsx

## New Documentation
- DARK_ACADEMIA_DESIGN_SPEC.md (553 lines)
- DESIGN_REVIEW_SUMMARY.md (204 lines)

## Ready to Merge?
YES — No breaking changes, all fixes are backward compatible.

## Next Phase
Once approved → Engineering starts Phase 2 (Dark Academia implementation, 22-40 hours)
```

---

### Track 2: Design Review (Design Team)

**What to do:**
1. Open `DESIGN_REVIEW_SUMMARY.md` (start here, 5-min read)
2. Share with design team
3. Have design team review `DARK_ACADEMIA_DESIGN_SPEC.md` (full reference)
4. Collect feedback on:
   - Color palette (deep navy, warm gold, jewel tones)
   - Typography (Crimson Text serif + sans-serif)
   - Component styling
   - Overall aesthetic fit

**Email Template to Design Team:**
```
Subject: Dark Academia Design Review Needed (Relevnt Phase 2)

Hi team,

We're moving Relevnt to a dark academia aesthetic. Need your review & approval
before engineering starts implementation.

Files to review:
1. DESIGN_REVIEW_SUMMARY.md ← Start here (quick overview)
2. DARK_ACADEMIA_DESIGN_SPEC.md ← Full reference (complete specs)

Key decision points:
- Does the color palette feel right? (dark navy + warm gold + jewel tones)
- Should we adjust any colors?
- Typography pairing okay? (Crimson Text serif + sans-serif body)
- Component styling look consistent?

Timeline:
- Design review: 1-2 days
- Feedback: By [DATE]
- Engineering implementation: 4-5 days (after approval)
- Launch: End of week

Please review and reply with feedback/approval by [DATE].

Thanks!
```

---

## ✅ APPROVAL GATES (What You're Waiting For)

### Code Review Checklist
- [ ] Cycle 1 fixes reviewed for code quality
- [ ] Password reset Supabase integration approved
- [ ] Copy changes meet tone/messaging standards
- [ ] No breaking changes identified
- [ ] All tests pass
- [ ] Approved for merge

### Design Review Checklist
- [ ] Color palette approved (dark navy, gold, jewel tones)
- [ ] Typography approved (Crimson Text + sans-serif)
- [ ] Component styling looks cohesive
- [ ] All pages feel consistent with dark academia aesthetic
- [ ] No adjustments needed (or changes documented)
- [ ] Approved to proceed

---

## 🚀 AFTER APPROVALS

**Once both teams approve:**

1. **Merge PR to main**
   ```
   GitHub → Merge pull request → Delete branch
   ```

2. **Create Phase 2 Implementation Branch**
   ```
   git checkout -b claude/dark-academia-implementation
   ```

3. **Start Phase 2 (Engineering)**
   - Phase 1: Foundation (CSS variables, theme provider) — 4-6 hours
   - Phase 2: Components (buttons, cards, forms, nav) — 8-12 hours
   - Phase 3: Page layouts (all major pages) — 8-12 hours
   - Phase 4: QA & polish (contrast, mobile, final review) — 2-4 hours
   - **Total: 22-40 hours (4-5 full work days)**

4. **Daily Communication**
   - Design team available for questions
   - Engineering posts progress updates
   - QA tests during Phase 4

5. **Final Launch**
   - Dark academia rebrand goes live
   - Announce to users (optional: changelog/blog post)

---

## 📅 TIMELINE

| When | What | Owner |
|------|------|-------|
| **Today** | Create PR + share design spec | You |
| **1-2 days** | Code review completes | Engineering |
| **1-2 days** | Design review completes (parallel) | Design |
| **End of Day 2-3** | Both approvals received | All teams |
| **Days 3-4** | Phase 2 implementation starts | Engineering |
| **Days 4-8** | Phase 2 development (22-40 hours) | Engineering + Design |
| **Day 8** | Testing & final polish | QA + Design |
| **End of Week** | Dark academia rebrand live 🎨 | All teams |

---

## 📊 Success Criteria

**Code Review Success:**
- ✅ All 5 fixes merge to main
- ✅ Cycle 1 coherence score: 81/100
- ✅ Zero breaking changes
- ✅ No regressions

**Design Review Success:**
- ✅ Dark academia aesthetic approved
- ✅ Color palette finalized
- ✅ Typography decisions locked
- ✅ Ready for engineering implementation

**Phase 2 Success:**
- ✅ All pages visually updated
- ✅ WCAG AA contrast compliance
- ✅ Mobile responsive
- ✅ No functional regressions
- ✅ Dark academia aesthetic fully realized

---

## 💬 Questions During Implementation?

**For Code Issues:**
- Reference commit messages in `claude/product-coherence-audit-VLIOX` branch
- Check individual file diffs on GitHub

**For Design Questions:**
- Reference `DARK_ACADEMIA_DESIGN_SPEC.md` for all specs
- Design team has context from `DESIGN_REVIEW_SUMMARY.md`
- All color hex codes provided for copy-paste

**For Phase 2 Questions:**
- Use design spec as single source of truth
- CSS variables provided for easy implementation
- Implementation roadmap shows expected effort per phase

---

## 🎯 TL;DR

**Right Now:**
1. Create PR from `claude/product-coherence-audit-VLIOX`
2. Share design files with design team
3. Wait for approvals (1-2 days, parallel)

**After Approvals:**
1. Merge PR to main
2. Start Phase 2 implementation (4-5 days)
3. Launch dark academia rebrand (end of week)

**Status:** 🟢 Ready to proceed

---

**Questions? Everything is documented in:**
- `DESIGN_REVIEW_SUMMARY.md` ← Share with design team
- `DARK_ACADEMIA_DESIGN_SPEC.md` ← Full reference
- Branch `claude/product-coherence-audit-VLIOX` ← Code ready for PR

Let's ship it! 🚀
