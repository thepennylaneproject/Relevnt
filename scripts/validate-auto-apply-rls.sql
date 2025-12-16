-- =============================================================================
-- AUTO-APPLY RLS VALIDATION SCRIPT
-- =============================================================================
-- Validates Row Level Security policies for auto-apply tables
-- Note: This checks policy definitions, not runtime behavior
-- Runtime RLS testing requires PostgREST API calls with JWT tokens
-- =============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  rls_enabled BOOLEAN;
  table_name TEXT;
  expected_policies TEXT[];
BEGIN
  RAISE NOTICE '=== Starting Auto-Apply RLS Validation ===';
  RAISE NOTICE '';
  
  -- =============================================================================
  -- TEST 1: Verify RLS is enabled on all auto-apply tables
  -- =============================================================================
  
  RAISE NOTICE 'TEST 1: Checking RLS is enabled';
  RAISE NOTICE '--------------------------------';
  
  FOR table_name IN 
    SELECT unnest(ARRAY[
      'auto_apply_queue',
      'job_application_artifacts', 
      'applications',
      'auto_apply_logs',
      'auto_apply_rules'
    ])
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = table_name AND relnamespace = 'public'::regnamespace;
    
    IF rls_enabled THEN
      RAISE NOTICE '✓ RLS enabled on %', table_name;
    ELSE
      RAISE WARNING '✗ RLS NOT enabled on % (FAILED)', table_name;
    END IF;
  END LOOP;
  
  -- =============================================================================
  -- TEST 2: Verify policy counts
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 2: Checking policy counts';
  RAISE NOTICE '-------------------------------';
  
  -- auto_apply_queue should have 5 policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'auto_apply_queue';
  
  IF policy_count = 5 THEN
    RAISE NOTICE '✓ auto_apply_queue has 5 policies';
  ELSE
    RAISE WARNING '✗ auto_apply_queue has % policies, expected 5 (FAILED)', policy_count;
  END IF;
  
  -- job_application_artifacts should have 5 policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'job_application_artifacts';
  
  IF policy_count = 5 THEN
    RAISE NOTICE '✓ job_application_artifacts has 5 policies';
  ELSE
    RAISE WARNING '✗ job_application_artifacts has % policies, expected 5 (FAILED)', policy_count;
  END IF;
  
  -- applications should have 5 policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'applications';
  
  IF policy_count = 5 THEN
    RAISE NOTICE '✓ applications has 5 policies';
  ELSE
    RAISE WARNING '✗ applications has % policies, expected 5 (FAILED)', policy_count;
  END IF;
  
  -- auto_apply_logs should have 5 policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'auto_apply_logs';
  
  IF policy_count = 5 THEN
    RAISE NOTICE '✓ auto_apply_logs has 5 policies';
  ELSE
    RAISE WARNING '✗ auto_apply_logs has % policies, expected 5 (FAILED)', policy_count;
  END IF;
  
  -- auto_apply_rules should have 5 policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'auto_apply_rules';
  
  IF policy_count = 5 THEN
    RAISE NOTICE '✓ auto_apply_rules has 5 policies';
  ELSE
    RAISE WARNING '✗ auto_apply_rules has % policies, expected 5 (FAILED)', policy_count;
  END IF;
  
  -- =============================================================================
  -- TEST 3: Verify policy types (SELECT, INSERT, UPDATE, DELETE)
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 3: Checking policy operations coverage';
  RAISE NOTICE '-------------------------------------------';
  
  FOR table_name IN 
    SELECT unnest(ARRAY[
      'auto_apply_queue',
      'job_application_artifacts',
      'applications',
      'auto_apply_logs',
      'auto_apply_rules'
    ])
  LOOP
    -- Check for SELECT policies (should have 2: user + coach)
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = table_name AND cmd = 'SELECT';
    
    IF policy_count >= 1 THEN
      RAISE NOTICE '✓ % has SELECT policies (%)', table_name, policy_count;
    ELSE
      RAISE WARNING '✗ % missing SELECT policies (FAILED)', table_name;
    END IF;
    
    -- Check for INSERT policy
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = table_name AND cmd = 'INSERT';
    
    IF policy_count >= 1 THEN
      RAISE NOTICE '✓ % has INSERT policy', table_name;
    ELSE
      RAISE WARNING '✗ % missing INSERT policy (FAILED)', table_name;
    END IF;
    
    -- Check for UPDATE policy
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = table_name AND cmd = 'UPDATE';
    
    IF policy_count >= 1 THEN
      RAISE NOTICE '✓ % has UPDATE policy', table_name;
    ELSE
      RAISE WARNING '✗ % missing UPDATE policy (FAILED)', table_name;
    END IF;
    
    -- Check for DELETE policy
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = table_name AND cmd = 'DELETE';
    
    IF policy_count >= 1 THEN
      RAISE NOTICE '✓ % has DELETE policy', table_name;
    ELSE
      RAISE WARNING '✗ % missing DELETE policy (FAILED)', table_name;
    END IF;
  END LOOP;
  
  -- =============================================================================
  -- TEST 4: Verify coach-client access policies exist
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 4: Checking coach-client policies';
  RAISE NOTICE '---------------------------------------';
  
  FOR table_name IN 
    SELECT unnest(ARRAY[
      'auto_apply_queue',
      'job_application_artifacts',
      'applications',
      'auto_apply_logs',
      'auto_apply_rules'
    ])
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = table_name 
      AND cmd = 'SELECT'
      AND (
        policyname ILIKE '%coach%' 
        OR qual::text ILIKE '%coach_client_relationships%'
      );
    
    IF policy_count >= 1 THEN
      RAISE NOTICE '✓ % has coach-client SELECT policy', table_name;
    ELSE
      RAISE WARNING '✗ % missing coach-client SELECT policy (FAILED)', table_name;
    END IF;
  END LOOP;
  
  -- =============================================================================
  -- TEST 5: Verify user ownership policies use auth.uid()
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 5: Checking auth.uid() usage in policies';
  RAISE NOTICE '---------------------------------------------';
  
  FOR table_name IN 
    SELECT unnest(ARRAY[
      'auto_apply_queue',
      'job_application_artifacts',
      'applications',
      'auto_apply_logs',
      'auto_apply_rules'
    ])
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = table_name 
      AND (qual::text ILIKE '%auth.uid()%' OR with_check::text ILIKE '%auth.uid()%');
    
    IF policy_count >= 1 THEN
      RAISE NOTICE '✓ % uses auth.uid() in policies', table_name;
    ELSE
      RAISE WARNING '✗ % does not use auth.uid() (FAILED)', table_name;
    END IF;
  END LOOP;
  
  -- =============================================================================
  -- SUMMARY
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '=== Auto-Apply RLS Validation Summary ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Validation checks completed. Review output above for any ✗ failures.';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: This script validates policy definitions only.';
  RAISE NOTICE 'To test runtime RLS behavior, use Supabase client with actual users.';
  RAISE NOTICE '';
  RAISE NOTICE '=== Validation Complete ===';
  
END $$;
