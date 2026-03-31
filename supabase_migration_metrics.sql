-- Phase: Admin Metrics Extension
-- Add accepted_at and platform-specific metrics to campaigns table

-- 1. Ensure columns exist
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS real_reach_instagram INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_reach_tiktok INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_reach_x INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_reach_threads INTEGER DEFAULT 0;

-- 2. Initialize accepted_at for legacy campaigns
UPDATE campaigns SET accepted_at = created_at WHERE accepted_at IS NULL;

-- 3. Comments for documentation
COMMENT ON COLUMN campaigns.accepted_at IS 'Fecha en que la cotización se convirtió en campaña. Usada para bloqueo de edición.';
COMMENT ON COLUMN campaigns.real_reach_instagram IS 'Alcance real reportado en Instagram.';
COMMENT ON COLUMN campaigns.real_reach_tiktok IS 'Alcance real reportado en TikTok.';
COMMENT ON COLUMN campaigns.real_reach_x IS 'Alcance real reportado en X.';
COMMENT ON COLUMN campaigns.real_reach_threads IS 'Alcance real reportado en Threads.';
