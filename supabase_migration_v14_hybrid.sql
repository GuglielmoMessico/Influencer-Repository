-- Migration Phase 14: Hybrid Instagram Metrics
-- Adds fields for API integration and manual overrides

-- 1. Create table for API Integrations
CREATE TABLE IF NOT EXISTS public.api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE, -- 'instagram', 'tiktok', etc.
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on api_integrations
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (Assuming admin role based on previous patterns)
-- Note: Adjust the profile check to match your specific DB schema for roles
CREATE POLICY "Admins can manage integrations" 
  ON public.api_integrations 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 4. Update Campaigns table for hybrid metrics
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS metrics_source TEXT DEFAULT 'manual', -- 'manual', 'api'
  ADD COLUMN IF NOT EXISTS external_post_id TEXT,
  ADD COLUMN IF NOT EXISTS real_reach_api BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS real_impressions_api BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS real_engagement_api BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS override_reach BIGINT,
  ADD COLUMN IF NOT EXISTS override_impressions BIGINT,
  ADD COLUMN IF NOT EXISTS api_sync_status TEXT DEFAULT 'pending', -- 'pending', 'success', 'error'
  ADD COLUMN IF NOT EXISTS api_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- 5. Trigger for updated_at (if trigger function exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    CREATE TRIGGER set_api_integrations_updated_at
      BEFORE UPDATE ON public.api_integrations
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE public.api_integrations IS 'Stores third-party platform credentials (Instagram, FB, etc) for metrics automation.';
COMMENT ON COLUMN public.campaigns.metrics_source IS 'Source of truth for metrics: manual entry or API-sync.';
COMMENT ON COLUMN public.campaigns.override_reach IS 'Manual override that takes precedence over API and manual platform reach.';
