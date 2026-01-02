## Database Migration Status

### Migration Tool
- Supabase SQL migrations in `supabase/migrations/`

### Migrations Verified (on disk)
| Migration | Status | Tables Affected (expected) |
|-----------|--------|----------------------------|
| 20260102_feedback_signals.sql | Present | feedback_signals |
| 20260102_company_responsiveness_tracking.sql | Present | company sentiment fields |
| 20260102_strategic_pivot_reports.sql | Present | strategic_pivot_reports |
| 20250110_discovery_runs_audit.sql | Present | discovery runs audit |

### Schema Validation
- DB status not verified in this environment (no DB access).
- Recommended check:
  - `select * from supabase_migrations.schema_migrations order by version desc;`
  - Compare to files in `supabase/migrations/`.

### Pending
- Unknown (requires DB check).
