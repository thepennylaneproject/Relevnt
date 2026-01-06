## Pre-Commit Hook Setup

### Implementation
- Tool: Husky + lint-staged
- Hook location: `.husky/pre-commit`
- Staged files only: Yes

### What It Catches
- Hardcoded hex colors in CSS files
- Any stylelint violations in staged CSS

### Developer Instructions
If the hook blocks your commit:
1. Run `npm run lint:css` to see violations
2. Fix violations (use design tokens)
3. Re-commit

To bypass (emergency only):
`git commit --no-verify -m "message"`

### Notes
- In this environment, `husky install` could not update `.git/config` (permission error).
- After pulling, run `npm run prepare` (or `npx husky install`) to enable hooks locally.
