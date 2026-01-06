## Dead Component Cleanup

### Files Deleted
| File | Reason | Verified No Imports |
|------|--------|---------------------|
| src/pages/PersonaManagementPage.tsx | Replaced by Settings verticalization | ✓ |
| src/components/settings/SettingsTabNav.tsx | Tab nav no longer used | ✓ |
| src/components/settings/tabs/PersonaTab.tsx | Persona tab merged into Targeting section | ✓ |
| src/components/settings/tabs/CareerTargetsTab.tsx | Career targets merged into Targeting section | ✓ |

### Barrel Exports Updated
- Removed unused exports in `src/components/settings/index.ts`.
- Removed unused exports in `src/components/settings/tabs/index.ts`.

### Routes Cleaned
- `/personas` already redirects to `/settings?section=targeting` in `src/App.tsx`.

### Build Status
- TypeScript: not run in this environment.
- Build: not run in this environment.
