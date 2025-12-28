# Global CSS Consolidation: Implementation Checklist

**Status**: Ready for implementation
**Files Created**: `src/styles/global.css`, `src/index.css` updated
**Estimated Time**: 2-4 hours

---

## Phase 1: Verification (30 minutes)

- [ ] Review `src/styles/global.css` – Verify all tokens present
- [ ] Check `src/index.css` – Verify it only imports `global.css`
- [ ] Verify Terracotta color (#a0715c) used (NOT gold #d6a65c)
- [ ] Verify Sage Green (#5c7a6a) defined and available
- [ ] Test build: `npm run build` (should succeed)
- [ ] Test dev server: `npm run dev` (should load without errors)
- [ ] Test light mode rendering
- [ ] Test dark mode rendering

---

## Phase 2: Search & Remove Hardcoded Colors (1 hour)

**Goal**: Identify any components using hardcoded hex colors and update them

### Search for Hardcoded Colors

```bash
# Search TypeScript/TSX files for hex colors
grep -r "#[0-9a-fA-F]\{6\}" src/components --include="*.tsx" --include="*.ts"

# Search CSS files (excluding global.css) for hex colors
grep -r "#[0-9a-fA-F]\{6\}" src/styles --include="*.css" --exclude="global.css"

# Search inline styles
grep -r "style={{" src/components --include="*.tsx"
```

### Update Hardcoded Colors

For each instance found:
- [ ] Replace `#d6a65c` (gold) → `var(--color-accent)`
- [ ] Replace `#f7ecda` (light gold) → `var(--color-accent-soft)`
- [ ] Replace `#c39463` (hover gold) → `var(--color-accent-hover)`
- [ ] Replace other arbitrary colors with appropriate tokens from `global.css`

**Example**:
```tsx
// BEFORE
<button style={{ color: '#d6a65c' }}>Click</button>

// AFTER
<button style={{ color: 'var(--color-accent)' }}>Click</button>
```

---

## Phase 3: Delete Old CSS Files (30 minutes)

**Important**: Delete one at a time and test after each deletion

### Step 1: Backup (optional but recommended)
```bash
git status  # Ensure clean working directory
git branch -c claude/design-usability-audit-BEZaD backup/cleanup-$(date +%s)
```

### Step 2: Delete Files One-by-One

For each file below, follow this pattern:

```bash
# 1. Delete the file
rm src/styles/filename.css

# 2. Search for any remaining imports
grep -r "filename.css" src/

# 3. Test the app
npm run dev

# 4. If no errors, confirm it works in browser
# 5. If errors, restore and investigate
git checkout src/styles/filename.css
```

**Files to Delete** (in this order):

- [ ] `src/styles/design-tokens.css` – All content now in `global.css`
- [ ] `src/styles/textures.css` – All content now in `global.css` Section 7
- [ ] `src/styles/jobs.css` – Styles merged into `global.css`, hardcoded colors removed
- [ ] `src/styles/app-theme.css` – Check if empty/redundant
- [ ] `src/styles/dashboard-clarity.css` – Check for unique styles first
- [ ] `src/styles/applications.css` – Check for unique styles first
- [ ] `src/styles/interview-prep.css` – Check for unique styles first
- [ ] `src/styles/linkedin-optimizer.css` – Check for unique styles first
- [ ] `src/styles/settings-hub.css` – Check for unique styles first
- [ ] `src/styles/notification-center.css` – Check for unique styles first
- [ ] `src/styles/icon-kit.css` – Check for unique styles first
- [ ] `src/styles/haiku-container.css` – Check for unique styles first
- [ ] `src/styles/verse-container.css` – Check for unique styles first
- [ ] `src/styles/margin-nav.css` – Check for unique styles first
- [ ] `src/App.css` – All content moved to `global.css`

---

## Phase 4: Test Thoroughly (1 hour)

After all deletions, run comprehensive tests:

### Visual Tests
- [ ] Light mode: All colors display correctly
- [ ] Dark mode: All colors invert properly
- [ ] Buttons: All variants (primary, secondary, support, ghost) work
- [ ] Cards: Styling correct with proper shadows and borders
- [ ] Forms: Inputs, labels, checkboxes all styled correctly
- [ ] Navigation: Active states, hover effects work
- [ ] Typography: Headings, body text, poetic text display right
- [ ] Badges: All variants (accent, support, success, warning, error)
- [ ] Alerts: All types (success, warning, error, info)

### Functional Tests
- [ ] No console errors: `npm run dev` has clean console
- [ ] Build succeeds: `npm run build` completes
- [ ] Performance: No noticeable slowness
- [ ] Responsive: Mobile, tablet, desktop all look right
- [ ] Keyboard navigation: Focus states visible
- [ ] Screen reader: Labels and semantics intact

### Device Tests
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Different browsers (Chrome, Firefox, Safari if available)

---

## Phase 5: Document & Commit (30 minutes)

### Update Documentation

- [ ] Review `MIGRATION_GUIDE.md` – Does it match your setup?
- [ ] Add any project-specific notes to the guide
- [ ] Update team CONTRIBUTING.md to reference `global.css`
- [ ] Update any existing style documentation

### Git Commit

```bash
# Stage the changes
git add src/styles/global.css
git add src/index.css
git add MIGRATION_GUIDE.md
git add MIGRATION_CHECKLIST.md

# Commit with clear message
git commit -m "refactor: consolidate all styling into global.css

- Create src/styles/global.css as single source of truth
- Include all design tokens (colors, typography, spacing)
- Include all component patterns (buttons, cards, badges)
- Include texture and visual effect definitions
- Support light and dark mode
- Update src/index.css to import only global.css
- Remove hardcoded colors (replace #d6a65c gold with terracotta)
- Implement sage green as supporting accent

Consolidates 15+ scattered CSS files into one unified file.
All styling decisions now in one place, eliminates design drift.

Files deleted:
- design-tokens.css
- textures.css
- jobs.css
- app-theme.css
- and 11+ feature-specific files

See MIGRATION_GUIDE.md for reference."

# Push to your branch
git push -u origin claude/design-usability-audit-BEZaD
```

---

## Phase 6: Team Communication (15 minutes)

### Share with Team

- [ ] Post migration guide in team channel
- [ ] Host brief walkthrough of new system
- [ ] Answer questions about token usage
- [ ] Collect feedback on the new structure

### Update Standards

- [ ] Create `STYLE_STANDARDS.md` (if not exists)
- [ ] Add rule: "All colors must use CSS tokens, never hardcoded hex"
- [ ] Add rule: "Styles go in `global.css` unless truly component-specific"
- [ ] Set up linting to enforce rules (optional but recommended)

---

## Rollback Plan (If Needed)

If something breaks and you need to revert:

```bash
# Option 1: Revert last commit
git revert HEAD

# Option 2: Reset to before changes
git reset --hard HEAD~1

# Option 3: Switch to backup branch
git checkout backup/cleanup-<timestamp>
```

---

## Success Criteria

✅ All checks below pass:

- [ ] `npm run build` succeeds with no errors
- [ ] `npm run dev` runs with clean console
- [ ] Visual inspection: Colors match Terracotta + Sage tokens
- [ ] No hardcoded hex colors in component files
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] All buttons, cards, badges, forms, etc. styled correctly
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] No broken imports or missing dependencies
- [ ] Documentation updated and clear
- [ ] Team understands new system

---

## Questions During Implementation?

Refer to:
1. `src/styles/global.css` – The source of truth
2. `MIGRATION_GUIDE.md` – Token reference and patterns
3. Browser DevTools – Inspect computed styles
4. Git history – See what was in deleted files

---

## Next Steps After Migration

Once complete:

1. **Set up linting** (optional):
   ```bash
   npm install --save-dev stylelint stylelint-config-standard
   ```
   Create `.stylelintrc.json`:
   ```json
   {
     "rules": {
       "color-no-hex": true
     }
   }
   ```

2. **Update PR template** to require:
   - No hardcoded colors
   - All tokens used correctly
   - Styles in `global.css` not scattered files

3. **Document in CONTRIBUTING.md**:
   - Where to find styling rules
   - How to add new tokens
   - How to create component-specific CSS

4. **Schedule team training** (optional):
   - Walk through new system
   - Demo how to add new styles
   - Answer questions

---

## Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Verification | 30 min | ⏳ Ready |
| Remove hardcoded colors | 1 hour | ⏳ Ready |
| Delete old files | 30 min | ⏳ Ready |
| Thorough testing | 1 hour | ⏳ Ready |
| Documentation | 30 min | ⏳ Ready |
| **Total** | **3.5 hours** | ⏳ Ready |

**Your new files are ready. You can start Phase 1 anytime.**
