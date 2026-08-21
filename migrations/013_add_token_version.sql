-- Migration: 013_add_token_version
-- Description: Add token_version to users so access tokens issued before a
-- password change can be revoked immediately instead of lasting until expiry

ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
