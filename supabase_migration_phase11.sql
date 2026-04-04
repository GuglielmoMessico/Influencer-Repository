-- Migration Phase 11: Add Facebook, X, and Threads reach metrics
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/qlonrggretbclgdqinrc/sql)

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='real_reach_facebook') THEN
        ALTER TABLE campaigns ADD COLUMN real_reach_facebook BIGINT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='real_reach_x') THEN
        ALTER TABLE campaigns ADD COLUMN real_reach_x BIGINT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='real_reach_threads') THEN
        ALTER TABLE campaigns ADD COLUMN real_reach_threads BIGINT DEFAULT 0;
    END IF;
END $$;

-- Optional: Update total reach if needed (though the app handles this in the UI)
-- UPDATE campaigns SET metrics_reach = COALESCE(real_reach_instagram,0) + COALESCE(real_reach_tiktok,0) + COALESCE(real_reach_facebook,0) + COALESCE(real_reach_x,0) + COALESCE(real_reach_threads,0);
