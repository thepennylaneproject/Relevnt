# Auto-Apply Foundation - Quick Reference

## 📁 Files Created

### Database
- ✅ `supabase/migrations/20241215_auto_apply_foundation.sql` (433 lines)
  - 2 new tables, 3 extended tables, 25 RLS policies

### Documentation
- ✅ `docs/AUTO_APPLY_STATE_MACHINE.md` (311 lines)
  - 8 states, mermaid diagram, 7 Netlify functions mapped
- ✅ `docs/TYPE_GENERATION.md` (204 lines)
  - 3 methods for regenerating types

### Scripts
- ✅ `scripts/validate-auto-apply-rls.sql` (225 lines)
- ✅ `scripts/validate-auto-apply-constraints.sql` (178 lines)
- ✅ `scripts/seed-auto-apply.sql` (258 lines)
- ✅ `scripts/README_AUTO_APPLY.md` (88 lines)

**Total**: 7 files, 1,697 lines

---

## 🚀 Quick Start

### 1. Apply Migration

```bash
# Option A: Supabase CLI
supabase db push

# Option B: Direct SQL
psql $DATABASE_URL -f supabase/migrations/20241215_auto_apply_foundation.sql
```

### 2. Validate RLS

```bash
psql $DATABASE_URL -f scripts/validate-auto-apply-rls.sql
# Expected: All ✓ checkmarks, no ✗ warnings
```

### 3. Validate Constraints

```bash
psql $DATABASE_URL -f scripts/validate-auto-apply-constraints.sql
# Expected: Invalid values rejected, valid values accepted
```

### 4. Regenerate Types

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
npm run type-check
```

### 5. Seed Test Data (Optional)

```bash
# Edit file first: replace PLACEHOLDER_USER_ID
psql $DATABASE_URL -f scripts/seed-auto-apply.sql
```

---

## 📊 Database Overview

### New Tables

| Table | Purpose | Key Feature |
|-------|---------|-------------|
| `auto_apply_queue` | Job processing queue | Unique constraint prevents duplicates |
| `job_application_artifacts` | Generated resumes/letters | Linked to AI trace for auditability |

### Extended Tables

| Table | New Columns | Purpose |
|-------|-------------|---------|
| `applications` | +9 columns | State machine (status, attempts, errors) |
| `auto_apply_logs` | +4 columns | Enhanced tracking (persona, trace_id) |
| `auto_apply_rules` | +4 columns | Performance stats |

### Application States

```
queued → preparing → ready_to_submit → submitted
           ↓             ↓           ↓
        failed      paused    requires_review
           ↓             ↓           ↓
      withdrawn ←────────┴───────────┘
```

---

## 🔒 Security

### RLS Policies (25 total)

- **Users**: Full CRUD on own data
- **Coaches**: Read-only on active clients
- **Service Role**: Bypasses RLS (automatic)

### Tables Protected

- ✅ `auto_apply_queue`
- ✅ `job_application_artifacts`
- ✅ `applications`
- ✅ `auto_apply_logs`
- ✅ `auto_apply_rules`

---

## 🎯 Next Steps

### Phase 1: Backend (Netlify Functions)

Implement per [AUTO_APPLY_STATE_MACHINE.md](file:///Users/sarahsahl/Desktop/relevnt-fresh/docs/AUTO_APPLY_STATE_MACHINE.md):

1. `auto-apply/enqueue.ts` - Match jobs, add to queue
2. `auto-apply/process-queue.ts` - Process queue (cron)
3. `auto-apply/prepare-application.ts` - Generate artifacts
4. `auto-apply/submit.ts` - Submit applications
5. `auto-apply/retry-handler.ts` - Retry failed (cron)
6. `auto-apply/pause.ts` - User pauses
7. `auto-apply/withdraw.ts` - User withdraws

### Phase 2: Frontend (React Components)

1. Auto-Apply Rules Manager
2. Application Queue Viewer
3. State Visualizer
4. Coach Dashboard

### Phase 3: AI Integration

Define new tasks in `src/lib/ai/tasks`:
- `generate_tailored_resume`
- `generate_cover_letter`
- `answer_application_questions`

---

## 📖 Documentation

- **Schema**: [AUTO_APPLY_STATE_MACHINE.md](file:///Users/sarahsahl/Desktop/relevnt-fresh/docs/AUTO_APPLY_STATE_MACHINE.md)
- **Types**: [TYPE_GENERATION.md](file:///Users/sarahsahl/Desktop/relevnt-fresh/docs/TYPE_GENERATION.md)
- **Scripts**: [README_AUTO_APPLY.md](file:///Users/sarahsahl/Desktop/relevnt-fresh/scripts/README_AUTO_APPLY.md)
- **V2 Schema**: [SCHEMA_V2.md](file:///Users/sarahsahl/Desktop/relevnt-fresh/docs/SCHEMA_V2.md)

---

## ⚠️ Important Notes

1. **Rules Start Disabled**: Seed data creates rules with `enabled: false` for safety
2. **User ID Required**: Replace placeholder in seed script before running
3. **Conservative Design**: State machine prevents "spray and pray" applications
4. **Full Audit Trail**: Every action logged with `trace_id`
5. **Coach Access**: Read-only, requires active `coach_client_relationships` entry

---

## 🧪 Verification Checklist

After migration:

- [ ] Tables exist: `auto_apply_queue`, `job_application_artifacts`
- [ ] `applications` has new columns: `status`, `submission_method`, `trace_id`
- [ ] RLS enabled: Check in Supabase Dashboard → Security
- [ ] 25 policies exist across 5 tables
- [ ] Validation scripts pass
- [ ] Types regenerated
- [ ] `npm run type-check` passes

---

## 💡 Key Design Decisions

1. **Single Applications Table**: Extended existing table vs new table
2. **Composite Unique Constraint**: `(user_id, persona_id, job_id, rule_id)`
3. **Conservative State Machine**: No state skipping allowed
4. **Coach-Client Pattern**: Read-only coach access via RLS

---

## 🆘 Troubleshooting

### Migration Fails

- Check existing data doesn't violate new constraints
- Review error message for specific constraint
- Consider adding migration to backfill data

### RLS Test Fails

- Verify `coach_client_relationships` table exists
- Check `auth.uid()` is set in test context
- Ensure policies were created (check pg_policies)

### Types Not Generated

- Verify migration was applied
- Check Supabase CLI is logged in
- Try REST API method as fallback

---

**Status**: ✅ All deliverables complete, ready for integration
