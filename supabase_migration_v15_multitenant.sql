-- Migration Phase 15: Multi-Tenant SaaS (Multi-Creator)

-- 1. CREACIÓN DE TABLA DE CREADORES (TENANTS)
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

-- 2. INSERCIÓN DEL CREADOR INICIAL (YEFER SHOWW)
-- Usamos un ID específico para esta migración para asegurar consistencia
DO $$
DECLARE
  yefer_id UUID := '00000000-0000-0000-0000-000000000001'; -- ID Determinístico para Yefer
BEGIN
  INSERT INTO public.creators (id, slug, display_name)
  VALUES (yefer_id, 'yefershoww', 'Yefer Showw')
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- 3. ACTUALIZACIÓN DE TABLAS (AÑADIR creator_id)
-- Aplicamos esto a todas las tablas de contenido detectadas
DO $$
DECLARE
  yefer_id UUID := '00000000-0000-0000-0000-000000000001';
  t TEXT;
BEGIN
  -- Lista de tablas a migrar
  FOR t IN SELECT table_name 
           FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name IN (
             'profile', 'stats', 'theme_settings', 'campaigns', 
             'campaign_insights', 'hero_videos', 'quote_requests', 
             'best_posts', 'testimonials', 'work_formats', 
             'audience_gender', 'audience_age', 'brand_clicks', 
             'api_integrations', 'audit_logs'
           )
  LOOP
    -- Agregar columna si no existe
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.creators(id)', t);
    
    -- Migrar datos existentes a Yefer
    EXECUTE format('UPDATE public.%I SET creator_id = %L WHERE creator_id IS NULL', t, yefer_id);
    
    -- Hacerlo obligatorio (NOT NULL) para futuros registros
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN creator_id SET NOT NULL', t);
  END LOOP;
END $$;

-- 4. ACTUALIZACIÓN DE ROLES (Multi-tenant User Roles)
-- Permitimos que un usuario tenga roles en diferentes creadores
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.creators(id);

-- Los roles actuales de admin se asignan a Yefer Showw
UPDATE public.user_roles 
SET creator_id = '00000000-0000-0000-0000-000000000001' 
WHERE creator_id IS NULL;

-- Redefinimos la PK de user_roles para incluir creator_id si es necesario (opcional)
-- ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
-- ALTER TABLE public.user_roles ADD PRIMARY KEY (user_id, creator_id, role);

-- 5. RE-DEFINICIÓN DE FUNCIÓN has_role() CON SOPORTE TENANT
-- Esta función ahora pide opcionalmente el creator_id
CREATE OR REPLACE FUNCTION public.has_role(
  user_id UUID, 
  required_role TEXT, 
  target_creator_id UUID DEFAULT NULL
) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Si no se pasa creator_id, busca si tiene el rol en cualquier creator (Dashboard Global)
  -- Si se pasa, valida específicamente para ese creator
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = has_role.user_id 
    AND user_roles.role = required_role
    AND (has_role.target_creator_id IS NULL OR user_roles.creator_id = has_role.target_creator_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ACTUALIZACIÓN MASIVA DE POLÍTICAS RLS PARA AISLAMIENTO
-- IMPORTANTE: Eliminamos políticas viejas y creamos nuevas que filtran por creator_id

-- Función auxiliar para limpiar y aplicar RLS (Solo ejemplo, se debe ejecutar por tabla)
-- Ejemplo para Creators: Los dueños pueden ver su metadata
CREATE POLICY "Owners can see their creators" 
  ON public.creators 
  FOR SELECT 
  TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin', id));

-- Ejemplo para Campaigns: Público puede ver si conoce el código, Admin solo de su tenant
DROP POLICY IF EXISTS "Enable read access for all users" ON public.campaigns;
CREATE POLICY "Public read by creator access" 
  ON public.campaigns 
  FOR SELECT 
  USING (true); -- La seguridad real de Campaña se maneja por el código de acceso

DROP POLICY IF EXISTS "Admins have full access to campaigns" ON public.campaigns;
CREATE POLICY "Tenant admin full access" 
  ON public.campaigns 
  FOR ALL 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin', creator_id));

-- Repetir patrón para el resto de tablas...
-- Profile, Stats, Theme son públicos para lectura pero Admin para escritura filtrado por creator_id
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name IN ('profile', 'stats', 'theme_settings', 'hero_videos', 'audience_gender', 'audience_age')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins can manage %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Tenant admin manage %I" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'', creator_id))', t, t);
  END LOOP;
END $$;
