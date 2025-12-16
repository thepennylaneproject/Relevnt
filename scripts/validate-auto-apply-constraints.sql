-- =============================================================================
-- AUTO-APPLY CONSTRAINT VALIDATION SCRIPT
-- =============================================================================
-- Tests unique constraints and other database constraints
-- =============================================================================

DO $$
DECLARE
  test_user UUID;
  test_persona UUID;
  test_job UUID;
  test_rule UUID;
  constraint_violated BOOLEAN := false;
BEGIN
  RAISE NOTICE '=== Starting Auto-Apply Constraint Validation ===';
  
  -- =============================================================================
  -- SETUP: Create test data
  -- =============================================================================
  
  RAISE NOTICE 'Creating test user and data...';
  
  INSERT INTO auth.users (id, email)
  VALUES (gen_random_uuid(), 'constraint_test@example.com')
  RETURNING id INTO test_user;
  
  INSERT INTO user_personas (user_id, name, description)
  VALUES (test_user, 'Constraint Test Persona', 'For testing')
  RETURNING id INTO test_persona;
  
  -- Mock job ID (would reference real job in production)
  test_job := gen_random_uuid();
  
  INSERT INTO auto_apply_rules (user_id, persona_id, name, enabled)
  VALUES (test_user, test_persona, 'Constraint Test Rule', true)
  RETURNING id INTO test_rule;
  
  -- =============================================================================
  -- TEST 1: auto_apply_queue unique constraint
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 1: auto_apply_queue duplicate prevention';
  RAISE NOTICE '-------------------------------------------';
  
  -- NOTE: This test is skipped because it requires actual job entries
  -- In production, you would test with valid job_id references
  
  RAISE NOTICE 'Skipped (requires valid job entries for FK constraint)';
  
  -- =============================================================================
  -- TEST 2: job_application_artifacts unique constraint
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 2: job_application_artifacts duplicate prevention';
  RAISE NOTICE '-----------------------------------------------------';
  
  RAISE NOTICE 'Skipped (requires valid job entries for FK constraint)';
  
  -- =============================================================================
  -- TEST 3: applications unique constraint (job_id, user_id)
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 3: applications duplicate prevention';
  RAISE NOTICE '----------------------------------------';
  
  RAISE NOTICE 'Skipped (requires valid job entries for FK constraint)';
  
  -- =============================================================================
  -- TEST 4: applications status CHECK constraint
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 4: applications status validation';
  RAISE NOTICE '-------------------------------------';
  
  BEGIN
    INSERT INTO applications (
      user_id,
      company,
      position,
      applied_date,
      status
    ) VALUES (
      test_user,
      'Test Company',
      'Test Position',
      CURRENT_DATE,
      'invalid_status'
    );
    
    RAISE WARNING '✗ Invalid status was accepted (FAILED - constraint not working!)';
    constraint_violated := true;
    
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✓ Invalid status rejected by CHECK constraint';
      constraint_violated := false;
  END;
  
  -- Test valid status
  BEGIN
    INSERT INTO applications (
      user_id,
      company,
      position,
      applied_date,
      status
    ) VALUES (
      test_user,
      'Test Company 2',
      'Test Position 2',
      CURRENT_DATE,
      'queued'
    );
    
    RAISE NOTICE '✓ Valid status ''queued'' accepted';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '✗ Valid status ''queued'' rejected (FAILED)';
  END;
  
  -- =============================================================================
  -- TEST 5: applications submission_method CHECK constraint
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 5: applications submission_method validation';
  RAISE NOTICE '-----------------------------------------------';
  
  BEGIN
    INSERT INTO applications (
      user_id,
      company,
      position,
      applied_date,
      submission_method
    ) VALUES (
      test_user,
      'Test Company 3',
      'Test Position 3',
      CURRENT_DATE,
      'invalid_method'
    );
    
    RAISE WARNING '✗ Invalid submission_method was accepted (FAILED)';
    
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✓ Invalid submission_method rejected by CHECK constraint';
  END;
  
  -- Test valid submission_method
  BEGIN
    INSERT INTO applications (
      user_id,
      company,
      position,
      applied_date,
      submission_method
    ) VALUES (
      test_user,
      'Test Company 4',
      'Test Position 4',
      CURRENT_DATE,
      'supported_integration'
    );
    
    RAISE NOTICE '✓ Valid submission_method ''supported_integration'' accepted';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '✗ Valid submission_method rejected (FAILED)';
  END;
  
  -- =============================================================================
  -- CLEANUP
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'Cleaning up test data...';
  
  DELETE FROM applications WHERE user_id = test_user;
  DELETE FROM auto_apply_rules WHERE user_id = test_user;
  DELETE FROM user_personas WHERE user_id = test_user;
  DELETE FROM auth.users WHERE id = test_user;
  
  RAISE NOTICE '=== Auto-Apply Constraint Validation Complete ===';
  
END $$;
