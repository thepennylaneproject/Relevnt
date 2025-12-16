-- =============================================================================
-- AUTO-APPLY SEED DATA
-- =============================================================================
-- Provides sample data for testing the auto-apply system
-- =============================================================================
-- IMPORTANT: Replace PLACEHOLDER_USER_ID with your actual test user UUID
-- =============================================================================

-- =============================================================================
-- CONFIGURATION
-- =============================================================================
-- Set your test user ID here
DO $$
DECLARE
  -- ⚠️ REPLACE THIS WITH YOUR TEST USER ID ⚠️
  test_user_id UUID := '00000000-0000-0000-0000-000000000000';
  
  -- Variables for created entities
  persona_software_eng UUID;
  persona_data_sci UUID;
  rule_id_1 UUID;
  rule_id_2 UUID;
  mock_job_1 UUID;
  mock_job_2 UUID;
  mock_job_3 UUID;
  
BEGIN
  RAISE NOTICE '=== Seeding Auto-Apply Test Data ===';
  RAISE NOTICE 'User ID: %', test_user_id;
  
  -- Validation check
  IF test_user_id = '00000000-0000-0000-0000-000000000000' THEN
    RAISE EXCEPTION 'Please replace PLACEHOLDER_USER_ID with your actual user UUID';
  END IF;
  
  -- =============================================================================
  -- 1. Create Test Personas
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'Creating test personas...';
  
  INSERT INTO user_personas (user_id, name, description, is_active)
  VALUES (
    test_user_id,
    'Software Engineer',
    'Full-stack developer seeking remote opportunities',
    true
  )
  RETURNING id INTO persona_software_eng;
  
  RAISE NOTICE 'Created Software Engineer persona: %', persona_software_eng;
  
  INSERT INTO user_personas (user_id, name, description, is_active)
  VALUES (
    test_user_id,
    'Data Scientist',
    'ML engineer interested in AI/ML roles',
    false
  )
  RETURNING id INTO persona_data_sci;
  
  RAISE NOTICE 'Created Data Scientist persona: %', persona_data_sci;
  
  -- Create persona preferences
  INSERT INTO persona_preferences (
    persona_id,
    job_title_keywords,
    min_salary,
    required_skills,
    nice_to_have_skills,
    remote_preference,
    locations
  ) VALUES (
    persona_software_eng,
    ARRAY['Software Engineer', 'Full Stack', 'Backend Developer'],
    100000,
    ARRAY['JavaScript', 'TypeScript', 'React', 'Node.js'],
    ARRAY['Python', 'PostgreSQL', 'AWS'],
    'remote',
    ARRAY['United States', 'Remote']
  );
  
  INSERT INTO persona_preferences (
    persona_id,
    job_title_keywords,
    min_salary,
    required_skills,
    remote_preference
  ) VALUES (
    persona_data_sci,
    ARRAY['Data Scientist', 'ML Engineer', 'Machine Learning'],
    120000,
    ARRAY['Python', 'TensorFlow', 'PyTorch', 'SQL'],
    'remote'
  );
  
  -- =============================================================================
  -- 2. Create Auto-Apply Rules
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'Creating auto-apply rules...';
  
  INSERT INTO auto_apply_rules (
    user_id,
    persona_id,
    name,
    enabled,
    match_score_threshold,
    max_applications_per_week,
    exclude_companies,
    require_all_keywords,
    active_days
  ) VALUES (
    test_user_id,
    persona_software_eng,
    'High-Match Remote Roles',
    false, -- Start disabled for safety
    85.0,
    5,
    ARRAY['Meta', 'Amazon'], -- Example exclusions
    ARRAY['remote'],
    ARRAY['mon', 'tue', 'wed', 'thu', 'fri']
  )
  RETURNING id INTO rule_id_1;
  
  RAISE NOTICE 'Created rule: High-Match Remote Roles (ID: %)', rule_id_1;
  
  INSERT INTO auto_apply_rules (
    user_id,
    persona_id,
    name,
    enabled,
    match_score_threshold,
    max_applications_per_week,
    include_only_companies,
    active_days
  ) VALUES (
    test_user_id,
    persona_software_eng,
    'Startup Opportunities',
    false, -- Start disabled
    75.0,
    3,
    ARRAY['Y Combinator', 'Sequoia'], -- Example allowlist
    ARRAY['mon', 'wed', 'fri']
  )
  RETURNING id INTO rule_id_2;
  
  RAISE NOTICE 'Created rule: Startup Opportunities (ID: %)', rule_id_2;
  
  -- =============================================================================
  -- 3. Create Sample Logs
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'Creating sample auto-apply logs...';
  
  -- Note: These use mock job IDs. In production, these would reference real jobs.
  mock_job_1 := gen_random_uuid();
  mock_job_2 := gen_random_uuid();
  mock_job_3 := gen_random_uuid();
  
  INSERT INTO auto_apply_logs (
    user_id,
    rule_id,
    persona_id,
    job_id,
    status,
    trace_id,
    attempt_count
  ) VALUES
  (
    test_user_id,
    rule_id_1,
    persona_software_eng,
    mock_job_1,
    'submitted',
    gen_random_uuid(),
    1
  ),
  (
    test_user_id,
    rule_id_1,
    persona_software_eng,
    mock_job_2,
    'failed',
    gen_random_uuid(),
    2
  ),
  (
    test_user_id,
    rule_id_2,
    persona_software_eng,
    mock_job_3,
    'submitted',
    gen_random_uuid(),
    1
  );
  
  RAISE NOTICE 'Created 3 sample log entries';
  
  -- Update rule statistics
  UPDATE auto_apply_rules
  SET 
    total_applications = 2,
    successful_applications = 1,
    failed_applications = 1,
    last_run_at = now() - interval '2 hours'
  WHERE id = rule_id_1;
  
  UPDATE auto_apply_rules
  SET 
    total_applications = 1,
    successful_applications = 1,
    failed_applications = 0,
    last_run_at = now() - interval '1 day'
  WHERE id = rule_id_2;
  
  -- =============================================================================
  -- 4. Create Sample Applications (with state machine states)
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'Creating sample applications in various states...';
  
  -- Application in 'preparing' state
  INSERT INTO applications (
    user_id,
    company,
    position,
    applied_date,
    status,
    submission_method,
    rule_id,
    persona_id,
    trace_id,
    attempt_count,
    metadata
  ) VALUES (
    test_user_id,
    'TechCorp Inc.',
    'Senior Software Engineer',
    CURRENT_DATE,
    'preparing',
    'external_link',
    rule_id_1,
    persona_software_eng,
    gen_random_uuid(),
    0,
    '{"queue_priority": 1, "estimated_match": 88.5}'::jsonb
  );
  
  -- Application in 'requires_review' state
  INSERT INTO applications (
    user_id,
    company,
    position,
    applied_date,
    status,
    submission_method,
    rule_id,
    persona_id,
    trace_id,
    attempt_count,
    metadata
  ) VALUES (
    test_user_id,
    'Startup XYZ',
    'Full Stack Developer',
    CURRENT_DATE,
    'requires_review',
    'external_link',
    rule_id_2,
    persona_software_eng,
    gen_random_uuid(),
    0,
    '{"requires_approval_reason": "High-impact role", "estimated_match": 92.0}'::jsonb
  );
  
  -- Application in 'submitted' state
  INSERT INTO applications (
    user_id,
    company,
    position,
    applied_date,
    status,
    submission_method,
    rule_id,
    persona_id,
    trace_id,
    attempt_count,
    metadata
  ) VALUES (
    test_user_id,
    'RemoteFirst Co.',
    'Backend Engineer',
    CURRENT_DATE - interval '1 day',
    'submitted',
    'external_link',
    rule_id_1,
    persona_software_eng,
    gen_random_uuid(),
    1,
    '{"submitted_at": "2024-12-14T10:30:00Z", "estimated_match": 85.0}'::jsonb
  );
  
  RAISE NOTICE 'Created 3 sample applications';
  
  -- =============================================================================
  -- SUMMARY
  -- =============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '=== Seed Data Summary ===';
  RAISE NOTICE 'Personas created: 2';
  RAISE NOTICE 'Rules created: 2 (both disabled for safety)';
  RAISE NOTICE 'Logs created: 3';
  RAISE NOTICE 'Applications created: 3';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Auto-apply rules are DISABLED by default';
  RAISE NOTICE '⚠️  Enable them in the UI after reviewing settings';
  RAISE NOTICE '';
  RAISE NOTICE '=== Auto-Apply Seed Complete ===';
  
END $$;
