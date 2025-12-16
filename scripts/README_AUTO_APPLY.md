# Auto-Apply Scripts

This directory contains SQL scripts for testing, validating, and seeding the Auto-Apply system.

## Scripts

### `seed-auto-apply.sql`
**Purpose**: Populate database with sample auto-apply data for testing

**Usage**:
```bash
# 1. First, edit the file and replace the placeholder user ID
# 2. Then run:
psql $DATABASE_URL -f scripts/seed-auto-apply.sql
```

**Creates**:
- 2 test personas (Software Engineer, Data Scientist)
- 2 auto-apply rules (both disabled by default)
- 3 sample application logs
- 3 sample applications in different states

**Important**: Rules are created in `enabled: false` state for safety. Enable them through the UI after review.

---

### `validate-auto-apply-rls.sql`
**Purpose**: Verify Row Level Security policies are working correctly

**Usage**:
```bash
psql $DATABASE_URL -f scripts/validate-auto-apply-rls.sql
```

**Tests**:
- User A can only see their own data
- User B cannot see User A's data
- Coach can see data for active clients
- All auto-apply tables are properly isolated

**Expected Output**: Series of `✓` checkmarks with no `✗` warnings

---

### `validate-auto-apply-constraints.sql`
**Purpose**: Test database constraints (CHECK, UNIQUE, etc.)

**Usage**:
```bash
psql $DATABASE_URL -f scripts/validate-auto-apply-constraints.sql
```

**Tests**:
- `applications.status` CHECK constraint (only valid states)
- `applications.submission_method` CHECK constraint (only valid methods)
- Unique constraints on queue and artifacts (when jobs exist)

**Expected Output**: Constraint violations should be caught with `✓` checkmarks

---

## Running All Validations

```bash
# Run all validation scripts
psql $DATABASE_URL -f scripts/validate-auto-apply-rls.sql
psql $DATABASE_URL -f scripts/validate-auto-apply-constraints.sql
```

## Troubleshooting

### Foreign Key Constraint Errors

Some tests skip validation when they require valid job entries. This is expected.

To run full tests:
1. First ensure you have jobs in the `jobs` table
2. Modify test scripts to use actual job IDs
3. Re-run validations

### RLS Test Failures

If RLS tests fail, check:
- Is RLS enabled on the table? `SELECT relrowsecurity FROM pg_class WHERE relname = 'table_name';`
- Are policies created? `SELECT * FROM pg_policies WHERE tablename = 'table_name';`
- Is the user authenticated? Tests use `auth.uid()` which requires proper JWT setup

### Permission Errors

If you get permission errors running these scripts:
- Ensure you're using a connection string with service role key (bypasses RLS)
- Or run with a superuser account
- Never use these validation scripts in production (they manipulate test users)

## Related Documentation

- [State Machine](../docs/AUTO_APPLY_STATE_MACHINE.md)
- [Schema V2](../docs/SCHEMA_V2.md)
- [Migration](../supabase/migrations/20241215_auto_apply_foundation.sql)
