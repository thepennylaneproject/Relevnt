-- =============================================================================
-- MULTI-PERSONA SYSTEM MIGRATION
-- =============================================================================
-- Creates tables for user personas and their job search preferences.
-- Each user can have multiple personas with different preferences.
-- =============================================================================

-- =============================================================================
-- 1. USER PERSONAS TABLE
-- =============================================================================
-- Stores persona metadata (name, description, active status)

CREATE TABLE IF NOT EXISTS user_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, name)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_personas_user_id
  ON user_personas (user_id);

-- Index for finding active persona quickly
CREATE INDEX IF NOT EXISTS idx_user_personas_active
  ON user_personas (user_id, is_active) WHERE is_active = true;

-- =============================================================================
-- 2. PERSONA PREFERENCES TABLE
-- =============================================================================
-- Stores detailed job search preferences for each persona

CREATE TABLE IF NOT EXISTS persona_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES user_personas (id) ON DELETE CASCADE,
  job_title_keywords TEXT[],
  min_salary INTEGER,
  max_salary INTEGER,
  required_skills TEXT[],
  nice_to_have_skills TEXT[],
  remote_preference VARCHAR(50), -- 'remote', 'hybrid', 'onsite', 'any'
  locations TEXT[],
  industries TEXT[],
  company_size TEXT[],
  excluded_companies TEXT[],
  mission_values TEXT[],
  growth_focus TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Each persona has exactly one preferences row
  UNIQUE (persona_id)
);

-- Index for fast lookups by persona
CREATE INDEX IF NOT EXISTS idx_persona_preferences_persona_id
  ON persona_preferences (persona_id);

-- =============================================================================
-- 3. ROW LEVEL SECURITY FOR user_personas
-- =============================================================================

ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;

-- Users can view their own personas
CREATE POLICY "Users can view their personas" ON user_personas
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own personas
CREATE POLICY "Users can insert their personas" ON user_personas
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own personas
CREATE POLICY "Users can update their personas" ON user_personas
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own personas
CREATE POLICY "Users can delete their personas" ON user_personas
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- 4. ROW LEVEL SECURITY FOR persona_preferences
-- =============================================================================

ALTER TABLE persona_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view preferences for their own personas
CREATE POLICY "Users can view their persona preferences" ON persona_preferences
  FOR SELECT
  USING (
    persona_id IN (
      SELECT id FROM user_personas WHERE user_id = auth.uid()
    )
  );

-- Users can insert preferences for their own personas
CREATE POLICY "Users can insert their persona preferences" ON persona_preferences
  FOR INSERT
  WITH CHECK (
    persona_id IN (
      SELECT id FROM user_personas WHERE user_id = auth.uid()
    )
  );

-- Users can update preferences for their own personas
CREATE POLICY "Users can update their persona preferences" ON persona_preferences
  FOR UPDATE
  USING (
    persona_id IN (
      SELECT id FROM user_personas WHERE user_id = auth.uid()
    )
  );

-- Users can delete preferences for their own personas
CREATE POLICY "Users can delete their persona preferences" ON persona_preferences
  FOR DELETE
  USING (
    persona_id IN (
      SELECT id FROM user_personas WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 5. UPDATED_AT TRIGGER FUNCTION
-- =============================================================================
-- Automatically updates the updated_at column on row changes

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to user_personas
DROP TRIGGER IF EXISTS update_user_personas_updated_at ON user_personas;
CREATE TRIGGER update_user_personas_updated_at
  BEFORE UPDATE ON user_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to persona_preferences
DROP TRIGGER IF EXISTS update_persona_preferences_updated_at ON persona_preferences;
CREATE TRIGGER update_persona_preferences_updated_at
  BEFORE UPDATE ON persona_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
