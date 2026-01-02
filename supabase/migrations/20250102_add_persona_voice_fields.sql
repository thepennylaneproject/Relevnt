-- =============================================================================
-- ADD VOICE FIELDS TO PERSONA PREFERENCES
-- =============================================================================
-- Adds voice configuration fields to persona_preferences table so each persona
-- can have its own tone settings for cover letters and other AI-generated content.
-- 
-- When fields are NULL, the persona will inherit from the user's profile-level
-- voice settings. This allows for both persona-specific customization and
-- profile-level defaults.
-- =============================================================================

-- Add voice fields to persona_preferences table
ALTER TABLE persona_preferences
  ADD COLUMN IF NOT EXISTS voice_formality INTEGER CHECK (voice_formality >= 0 AND voice_formality <= 100),
  ADD COLUMN IF NOT EXISTS voice_playfulness INTEGER CHECK (voice_playfulness >= 0 AND voice_playfulness <= 100),
  ADD COLUMN IF NOT EXISTS voice_conciseness INTEGER CHECK (voice_conciseness >= 0 AND voice_conciseness <= 100);

-- Add comments for documentation
COMMENT ON COLUMN persona_preferences.voice_formality IS 'Voice formality level (0-100). NULL means use profile default.';
COMMENT ON COLUMN persona_preferences.voice_playfulness IS 'Voice playfulness level (0-100). NULL means use profile default.';
COMMENT ON COLUMN persona_preferences.voice_conciseness IS 'Voice conciseness level (0-100). NULL means use profile default.';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
