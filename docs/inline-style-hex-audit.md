## Inline Style Hex Audit

### Violations Found: 16
| File | Line | Original | Fixed To |
|------|------|----------|----------|
| src/components/features/TransparencyCard.tsx:176 | 176 | text-green-600/text-yellow-600/text-red-600 + stroke #e5e7eb/#10b981/#f59e0b/#ef4444 | text-[var(--color-success|warning|error)] + stroke var(--color-graphite-faint/--color-success/--color-warning/--color-error) |
| src/components/shared/PageHeader.tsx:31 | 31 | colors.background === '#1A1A1A' + rgba gradients | useRelevntTheme().isDark + color-mix(...) with CSS vars |
| src/components/ResumeBuilder/SectionNavItem.tsx:22 | 22 | bg/text/border with #C7B68A/#1F2933/#A8956E/#F4EBDA/#E4DAC5/#E8DCC3 | bg/text/border with var(--color-*) tokens |
| src/components/ResumeBuilder/AutosaveIndicator.tsx:41 | 41 | border/text/dot #D6C8AA/#1F2933/#9CA3AF | border/text/dot var(--color-graphite-light/--color-ink/--color-ink-tertiary) |
| src/components/ResumeBuilder/ContactSection.tsx:54 | 54 | text-[#1F2933] | text-[var(--color-ink)] |
| src/components/ResumeBuilder/EducationSection.tsx:54 | 54 | text-[#1F2933] | text-[var(--color-ink)] |
| src/components/ResumeBuilder/ExperienceSection.tsx:51 | 51 | text-[#1F2933] | text-[var(--color-ink)] |
| src/components/ResumeBuilder/SummarySection.tsx:48 | 48 | text-[#1F2933] | text-[var(--color-ink)] |
| src/components/ResumeBuilder/SkillsSection.tsx:159 | 159 | text-[#1F2933] | text-[var(--color-ink)] |
| src/components/ResumeBuilder/ProjectsSection.tsx:54 | 54 | text-[#1F2933] | text-[var(--color-ink)] |
| src/components/ResumeBuilder/CertificationsSection.tsx:56 | 56 | text-[#1F2933] | text-[var(--color-ink)] |
| src/components/jobs/FeedbackButtons.tsx:104 | 104 | var() fallbacks #888/#f5f5f5/#ef4444/#22c55e | token-only var(--color-ink-tertiary/bg-alt/error/success) |
| src/components/icons/handdrawn/HanddrawnIcons.tsx:11 | 11 | default color #C7A56A | default color var(--color-accent) |
| src/components/ui/CustomIcons.tsx:22 | 22 | color map #1a1a1a/#013E30/#f5f1e8/#8a8a8a | color map var(--color-ink/emerald/ivory/gray) |
| src/components/ui/CustomIcon.tsx:116 | 116 | fallback stroke #013E30/#f5f1e8/#8a8a8a/#1a1a1a | fallback stroke var(--color-emerald/ivory/gray/ink) |
| src/components/ResumeBuilder/ResumeExport.tsx:121 | 121 | #333/#666 in export HTML | CSS vars with rgb() tokens (var(--color-ink/--color-ink-secondary)) |

### No Violations Found In:
- All other TSX/JSX files under `src` after this pass; remaining hex values are confined to theme token definitions in `src/contexts/RelevntThemeProvider.tsx`.
