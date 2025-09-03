-- Adds encrypted API key and from fields to workspaces
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS resend_api_key_enc TEXT,
ADD COLUMN IF NOT EXISTS resend_from_email TEXT,
ADD COLUMN IF NOT EXISTS resend_from_name TEXT;
