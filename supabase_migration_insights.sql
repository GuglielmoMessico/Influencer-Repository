-- Migration: Create campaign_insights table
-- Description: This table stores dynamic insights for each campaign to replace hardcoded values.

CREATE TABLE IF NOT EXISTS public.campaign_insights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  best_day         TEXT,          -- Ej: 'Jueves'
  peak_hour        TEXT,          -- Ej: '8:00 PM - 10:00 PM'
  top_location     TEXT,          -- Ej: 'CDMX, México'
  primary_demo     TEXT,          -- Ej: '18-34 años'
  sentiment_pos    INTEGER DEFAULT 80, -- % sentimiento positivo
  performance_score TEXT DEFAULT 'A+', -- 'A+', 'S', etc.
  recommedation_rate TEXT DEFAULT 'Top 10%', -- vs similares
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id) -- Un registro de insights por campaña
);

-- Habilitar RLS
ALTER TABLE public.campaign_insights ENABLE ROW LEVEL SECURITY;

-- Políticas: Lectura pública (para el portal de marcas) y Escritura para Admin
-- Nota: La lectura es pública porque el portal de marcas (/campana) es accesible con el código de campaña.
CREATE POLICY "Campaign insights are public" 
ON public.campaign_insights FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage campaign insights" 
ON public.campaign_insights FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
