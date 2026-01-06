## Tailwind Typography Audit

### Violations Removed: 11
| File | Line | Class/Rule Removed | Text Fixed |
|------|------|---------------------|------------|
| src/components/admin/SourcePerformanceMetrics.tsx:130 | 130 | capitalize | source slug → sentence case via helper |
| src/components/features/TransparencyCard.tsx:250 | 250 | capitalize | criterion name → sentence case via helper |
| src/components/shared/UsageStats.tsx:87 | 87 | textTransform: capitalize | tier name → sentence case via helper |
| src/pages/Settings.tsx:136 | 136 | text-transform: uppercase + letter-spacing | CSS only (sidebar title already sentence case) |
| src/components/insights/RecommendationCard.css:50 | 50 | text-transform: uppercase + letter-spacing | priority label → sentence case |
| src/components/Applications/CompanySentimentDashboard.tsx:317 | 317 | textTransform: uppercase + letterSpacing | table header text already sentence case |
| src/components/settings/VoicePreview.tsx:101 | 101 | textTransform: uppercase + letterSpacing | label text already sentence case |
| src/styles/tailoring.css:40 | 40 | text-transform: uppercase + letter-spacing | labels already sentence case |
| src/pages/ApplicationsPage.tsx:202 | 202 | tracking-wider | “Recently Viewed” → “Recently viewed”; “Mark All Applied” → “Mark all applied” |
| src/components/Applications/ApplicationQuestionHelper.tsx:200 | 200 | tracking-wider | “Quick Rewrite” → “Quick rewrite” |
| src/pages/SharedAuditPage.tsx:157 | 157 | tracking-wider/widest | “Key Improvements” → “Key improvements”; “Overall Impact” → “Overall impact” |

### Intentionally Kept: 0
| File | Line | Reason |
|------|------|--------|
