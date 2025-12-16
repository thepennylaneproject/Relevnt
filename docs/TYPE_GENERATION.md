# TypeScript Type Generation Instructions

After applying the Auto-Apply foundation migration, you need to regenerate TypeScript types to reflect the new schema.

## Prerequisites

- Supabase Project ID
- Supabase Service Role Key (or personal access token)
- Supabase CLI installed

## Option 1: Using Supabase CLI (Recommended)

### Step 1: Install Supabase CLI (if not installed)

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Link your project (if not linked)

```bash
supabase link --project-ref <your-project-id>
```

### Step 4: Generate Types

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

## Option 2: Using npx (No installation required)

```bash
npx supabase gen types typescript \
  --project-id <your-project-id> \
  --schema public \
  > src/lib/database.types.ts
```

## Option 3: Using REST API Directly

If CLI doesn't work, you can use the Supabase REST API:

```bash
curl "https://api.supabase.com/v1/projects/<project-id>/types/typescript" \
  -H "Authorization: Bearer <your-access-token>" \
  > src/lib/database.types.ts
```

## Verify Generated Types

After generation, verify the types include:

### New Tables

```typescript
// Should exist in Database['public']['Tables']
auto_apply_queue: { ... }
job_application_artifacts: { ... }
```

### Extended Tables

```typescript
applications: {
  Row: {
    // ... existing fields
    status: string | null
    submission_method: string | null
    attempt_count: number | null
    last_error: string | null
    last_attempt_at: string | null
    rule_id: string | null
    persona_id: string | null
    trace_id: string | null
    metadata: Json | null
  }
}

auto_apply_logs: {
  Row: {
    // ... existing fields
    persona_id: string | null
    trace_id: string | null
    attempt_count: number | null
    artifacts: Json | null
  }
}

auto_apply_rules: {
  Row: {
    // ... existing fields
    last_run_at: string | null
    total_applications: number | null
    successful_applications: number | null
    failed_applications: number | null
  }
}
```

## Type Check

Run TypeScript type checking to ensure no errors:

```bash
npm run type-check
# or
npx tsc --noEmit
```

## Troubleshooting

### "Project not found" Error

Make sure you're using the correct project ID. Find it in:
- Supabase Dashboard → Settings → General → Reference ID

### Permission Denied

Ensure you're authenticated:
```bash
supabase login
```

Or use your service role key:
```bash
export SUPABASE_ACCESS_TOKEN=<your-service-role-key>
```

### Types Not Updating

1. Clear any cached types
2. Ensure migration was applied successfully:
   ```sql
   SELECT * FROM auto_apply_queue LIMIT 1;
   ```
3. If tables don't exist, run migration first
4. Regenerate types again

### Missing Fields in Generated Types

If new columns are missing:
1. Verify migration ran: Check table schema in Supabase Dashboard
2. Force refresh: `supabase db pull` then regenerate
3. Check if RLS is hiding columns (it shouldn't affect type generation)

## Alternative: Manual Type Definitions

If auto-generation fails, you can manually add types in a separate file:

Create `src/lib/database.auto-apply.types.ts`:

```typescript
import { Database } from './database.types'

// Extend existing types
export type AutoApplyQueue = Database['public']['Tables']['auto_apply_queue']['Row']
export type JobApplicationArtifact = Database['public']['Tables']['job_application_artifacts']['Row']

// State machine types
export type ApplicationStatus = 
  | 'queued'
  | 'preparing'
  | 'ready_to_submit'
  | 'submitted'
  | 'failed'
  | 'paused'
  | 'requires_review'
  | 'withdrawn'

export type SubmissionMethod = 'external_link' | 'supported_integration'

// Extended Application type
export interface ApplicationWithAutoApply extends Database['public']['Tables']['applications']['Row'] {
  status: ApplicationStatus
  submission_method: SubmissionMethod
  attempt_count: number
  last_error?: string
  last_attempt_at?: string
  rule_id?: string
  persona_id?: string
  trace_id?: string
  metadata?: Record<string, any>
}
```

## Next Steps

After generating types:

1. ✅ Run `npm run type-check` to verify no errors
2. ✅ Update any Supabase client calls to use new types
3. ✅ Create helper functions for type-safe state transitions
4. ✅ Test in development environment

## Related Files

- [Migration](../supabase/migrations/20241215_auto_apply_foundation.sql)
- [State Machine](../docs/AUTO_APPLY_STATE_MACHINE.md)
- [Current Types](../src/lib/database.types.ts)
