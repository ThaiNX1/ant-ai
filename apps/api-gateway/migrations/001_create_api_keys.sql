-- Migration: 001_create_api_keys
-- Creates the api_keys table for API Gateway

CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash    CHAR(64)     NOT NULL,           -- SHA-256 hex of raw key
  key_prefix  VARCHAR(12)  NOT NULL,           -- First 12 chars for display
  user_id     VARCHAR(36)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  services    TEXT         NOT NULL,           -- comma-separated: 'ai-service,customer-service'
  scopes      TEXT         NOT NULL,           -- comma-separated: 'tts:*,llm:read'
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  expires_at  TIMESTAMPTZ,                     -- NULL = never expires
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Unique index on key_hash — primary lookup path
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys (key_hash);

-- Index for listing keys by user
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
