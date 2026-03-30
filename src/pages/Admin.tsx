import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  type Stats,
  type Campaign,
  type BestPost,
  type CampaignInsight
} from "@/lib/data";
import { useStats, useCampaigns, useBestPosts, useCampaignInsights } from "@/hooks/use-data";
import { testSupabaseConnection, resetSupabaseClient, isSupabaseConfigured, getSupabaseClient } from "@/lib/supabase-client";
import { signInWithEmail, signOut, getSession, onAuthStateChange, checkAdminRole } from "@/lib/supabase-auth";
import { toast } from "sonner";
import { Lock, BarChart3, Megaphone, Image, Trash2, Plus, LogOut, Save, Database, CheckCircle, XCircle, Loader2, Copy, CloudOff, Cloud, User, Mail, KeyRound, AlertTriangle, LayoutDashboard, FileText, Bell, BellOff, PieChart, Video, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ProfileEditor from "@/components/admin/ProfileEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import { getStorageSetupSQL } from "@/lib/supabase-storage";
import CampaignsDashboard from "@/components/admin/CampaignsDashboard";
import QuoteRequestsPanel from "@/components/admin/QuoteRequestsPanel";
import AudienceEditor from "@/components/admin/AudienceEditor";
import HeroVideosManager from "@/components/admin/HeroVideosManager";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import type { Session } from "@supabase/supabase-js";
import type { QuoteRequest } from "@/lib/supabase-data";

const Admin = () => {
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Use hooks for data
  const { stats, updateStats, useSupabase: statsFromSupabase, refresh: refreshStats } = useStats();
  const { campaigns, addCampaign, updateCampaign, removeCampaign, useSupabase: campaignsFromSupabase, refresh: refreshCampaigns } = useCampaigns();
  const { posts, addPost, removePost, useSupabase: postsFromSupabase, refresh: refreshPosts } = useBestPosts();
  
  // Local stats state for form
  const [localStats, setLocalStats] = useState<Stats | null>(stats);
  
  // New campaign state
  const [newCampaign, setNewCampaign] = useState({
    campaign_code: "",
    brand_email: "",
    brand_name: "",
    brand_logo_url: "",
    brand_website_url: "",
    metrics_reach: 0,
    metrics_impressions: 0,
    metrics_clicks: 0,
    expected_reach: 0,
    expected_impressions: 0,
    expected_clicks: 0,
    expected_ctr: 0,
    expected_engagement: 0,
    start_date: "",
    end_date: "",
    platform: "instagram" as "instagram" | "tiktok" | "both",
    campaign_type: "reels" as "stories" | "reels" | "post" | "live" | "mixed",
    budget: 0,
    video_result_url: "",
    notes: "",
    is_active: true
  });
  
  // New post state - thumbnail now optional
  const [newPost, setNewPost] = useState({
    platform: "instagram" as "instagram" | "tiktok" | "facebook",
    post_url: "",
    thumbnail: "", // Optional - placeholder shown if empty
    views_count: 0
  });

  // Insights state
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const { insights: currentCampaignInsights, upsertInsights, refresh: refreshInsights } = useCampaignInsights(editingCampaignId || undefined);
  const [localInsight, setLocalInsight] = useState<Omit<CampaignInsight, 'id' | 'updated_at'>>({
    campaign_id: '',
    best_day: '',
    peak_hour: '',
    top_location: '',
    primary_demo: '',
    sentiment_pos: 80,
    performance_score: 'A+',
    recommedation_rate: 'Top 10%',
    insight_summary: '',
    performance_note: ''
  });

  // Supabase is now configured via environment variables
  const supabaseConfigured = isSupabaseConfigured();

  // Push notifications hook
  const { 
    isSupported: notificationsSupported, 
    isEnabled: notificationsEnabled, 
    isDenied: notificationsDenied,
    requestPermission,
    sendNotification
  } = usePushNotifications();

  // Update local stats when stats change
  useEffect(() => {
    setLocalStats(stats);
  }, [stats]);

  // Auth state listener
  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured()) {
        setAuthLoading(false);
        return;
      }
      
      // Set up auth state listener first
      const unsubscribe = onAuthStateChange(async (newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          const adminStatus = await checkAdminRole(newSession.user.id);
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
        setAuthLoading(false);
      });
      
      // Then check for existing session
      const existingSession = await getSession();
      if (existingSession?.user) {
        setSession(existingSession);
        const adminStatus = await checkAdminRole(existingSession.user.id);
        setIsAdmin(adminStatus);
      }
      setAuthLoading(false);

      return unsubscribe;
    };

    initAuth();
  }, [supabaseConfigured]);

  // Logout automático SOLO al cerrar la ventana/pestaña del navegador
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session && isAdmin) {
        signOut();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, isAdmin]);

  // Supabase Realtime subscription for new quote requests
  useEffect(() => {
    if (!isAdmin || !isSupabaseConfigured() || !notificationsEnabled) return;

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel('quote-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quote_requests'
        },
        (payload) => {
          const newQuote = payload.new as QuoteRequest;
          
          // Send push notification
          sendNotification({
            title: '📋 Nueva Cotización',
            body: `${newQuote.brand_name} quiere colaborar\nPlataforma: ${newQuote.platform} - ${newQuote.campaign_type}`,
            url: '/admin?tab=quotes'
          });

          // Also show a toast
          toast.info(`Nueva cotización de ${newQuote.brand_name}`, {
            description: `${newQuote.platform} - ${newQuote.campaign_type}`,
            action: {
              label: 'Ver',
              onClick: () => {
                const tabsElement = document.querySelector('[value="quotes"]');
                if (tabsElement) (tabsElement as HTMLElement).click();
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [isAdmin, notificationsEnabled, sendNotification]);

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      // Cannot programmatically revoke, inform user
      toast.info('Para desactivar, cambia los permisos en la configuración del navegador');
    } else {
      const granted = await requestPermission();
      if (granted) {
        toast.success('¡Notificaciones activadas!');
      } else {
        toast.error('Permisos de notificación denegados');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured()) {
      toast.error("Primero configura Supabase en la sección correspondiente");
      return;
    }
    
    setLoginLoading(true);
    
    const result = await signInWithEmail(email, password);
    if (result.success) {
      toast.success("¡Bienvenido al panel de administración!");
    } else {
      toast.error(result.error || "Error al iniciar sesión");
    }
    
    setLoginLoading(false);
    setPassword("");
  };

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      setSession(null);
      setIsAdmin(false);
      toast.success("Sesión cerrada");
    } else {
      toast.error(result.error || "Error al cerrar sesión");
    }
  };

  const handleSaveStats = async () => {
    if (!localStats) return;
    await updateStats(localStats);
    toast.success("Estadísticas actualizadas");
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCampaign(newCampaign);
    setNewCampaign({
      campaign_code: "",
      brand_email: "",
      brand_name: "",
      brand_logo_url: "",
      brand_website_url: "",
      metrics_reach: 0,
      metrics_impressions: 0,
      metrics_clicks: 0,
      expected_reach: 0,
      expected_impressions: 0,
      expected_clicks: 0,
      expected_ctr: 0,
      expected_engagement: 0,
      start_date: "",
      end_date: "",
      platform: "instagram",
      campaign_type: "reels",
      budget: 0,
      video_result_url: "",
      notes: "",
      is_active: true
    });
    toast.success("Campaña creada exitosamente");
  };

  const handleDeleteCampaign = async (id: string) => {
    await removeCampaign(id);
    toast.success("Campaña eliminada");
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPost(newPost);
    setNewPost({
      platform: "instagram",
      post_url: "",
      thumbnail: "",
      views_count: 0
    });
    toast.success("Post añadido");
  };

  const handleDeletePost = async (id: string) => {
    await removePost(id);
    toast.success("Post eliminado");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("SQL copiado al portapapeles");
  };

  const sqlSchema = `-- ============================================
-- SCHEMA COMPLETO PARA YEFER SHOWW MEDIA KIT
-- ============================================

-- Tabla de estadísticas
CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_followers INTEGER DEFAULT 0,
  tiktok_followers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de campañas (con expectativas para análisis comparativo)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_code TEXT NOT NULL,
  brand_email TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  brand_logo_url TEXT,
  -- Métricas reales
  metrics_reach INTEGER DEFAULT 0,
  metrics_impressions INTEGER DEFAULT 0,
  metrics_clicks INTEGER DEFAULT 0,
  -- Expectativas de la marca (para comparación)
  expected_reach INTEGER DEFAULT 0,
  expected_impressions INTEGER DEFAULT 0,
  expected_clicks INTEGER DEFAULT 0,
  expected_ctr DECIMAL(5,2) DEFAULT 0,
  expected_engagement DECIMAL(5,2) DEFAULT 0,
  -- Detalles de campaña
  start_date DATE,
  end_date DATE,
  platform TEXT CHECK (platform IN ('instagram', 'tiktok', 'both')),
  campaign_type TEXT CHECK (campaign_type IN ('stories', 'reels', 'post', 'live', 'mixed')),
  budget DECIMAL(10,2) DEFAULT 0,
  video_result_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mejores posts
CREATE TABLE best_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  post_url TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de perfil (información del creador)
CREATE TABLE profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Yefer Showw',
  tagline TEXT DEFAULT 'Content Creator',
  description TEXT,
  bio TEXT,
  profile_image_url TEXT,
  logo_url TEXT,
  tags TEXT[] DEFAULT ARRAY['Motivación', 'Crecimiento Personal', 'Lifestyle LGBT+'],
  social_links JSONB DEFAULT '{"instagram": "", "tiktok": "", "email": ""}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de testimonios
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  brand TEXT NOT NULL,
  company TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SISTEMA DE ROLES DE USUARIO (SEGURO)
-- ============================================

-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Función segura para verificar roles (evita recursión de RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- HABILITAR ROW LEVEL SECURITY
-- ============================================
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE LECTURA PÚBLICA
-- ============================================
CREATE POLICY "Public read stats" ON stats FOR SELECT USING (true);
CREATE POLICY "Public read campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Public read best_posts" ON best_posts FOR SELECT USING (true);
CREATE POLICY "Public read profile" ON profile FOR SELECT USING (true);
CREATE POLICY "Public read testimonials" ON testimonials FOR SELECT USING (true);

-- ============================================
-- POLÍTICAS DE ESCRITURA (solo admins)
-- ============================================
CREATE POLICY "Admins can manage stats" ON stats FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage campaigns" ON campaigns FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage best_posts" ON best_posts FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage profile" ON profile FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage testimonials" ON testimonials FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Política para user_roles (solo admins pueden ver/modificar)
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- ============================================
-- DATOS INICIALES
-- ============================================
-- Estadísticas iniciales
INSERT INTO stats (instagram_followers, tiktok_followers, total_views, engagement_rate)
VALUES (125000, 340000, 15000000, 8.5);

-- Perfil inicial
INSERT INTO profile (name, tagline, description, bio, tags, social_links)
VALUES (
  'Yefer Showw',
  'Content Creator',
  'Creando contenido auténtico que inspira y conecta.',
  'Conecto marcas con una audiencia leal y diversa a través del humor y la autenticidad. Más que vistas, genero conversaciones reales en el nicho Lifestyle y LGBT+.',
  ARRAY['Motivación', 'Crecimiento Personal', 'Lifestyle LGBT+'],
  '{"instagram": "https://instagram.com/yefershoww", "tiktok": "https://tiktok.com/@yefershoww", "email": "contacto@yefershoww.com"}'
);

-- Testimonios iniciales
INSERT INTO testimonials (quote, brand, company) VALUES
  ('La capacidad de Yefer para conectar con su audiencia es única. Gran retorno de inversión.', 'Director de Marketing', 'Marca de Lifestyle'),
  ('Su autenticidad y energía hicieron que nuestra campaña se sintiera genuina. Los números hablan por sí solos.', 'Brand Manager', 'Empresa de Moda'),
  ('Profesional, creativo y con resultados medibles. Definitivamente volveremos a colaborar.', 'CEO', 'Startup de Tecnología'),
  ('Yefer entiende cómo hablarle a su comunidad. La engagement rate superó nuestras expectativas.', 'Social Media Lead', 'Agencia de Publicidad');

-- ============================================
-- IMPORTANTE: Después de crear tu primer usuario
-- ejecuta este SQL para hacerlo admin (reemplaza el email):
-- ============================================
-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'tu-email@ejemplo.com';
`;

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4 min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Verificando sesión...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not authenticated or not admin
  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4 min-h-[80vh] flex items-center">
          <div className="container mx-auto max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Warning if Supabase not configured */}
              {!isSupabaseConfigured() && (
                <Card className="shadow-elegant border-yellow-500/50 mb-6 bg-yellow-500/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-700 dark:text-yellow-400">Supabase no configurado</p>
                        <p className="text-sm text-muted-foreground">
                          Para usar autenticación real, primero configura tu proyecto de Supabase.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Logged in but not admin */}
              {session && !isAdmin && (
                <Card className="shadow-elegant border-yellow-500/50 mb-6 bg-yellow-500/10">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-700 dark:text-yellow-400">Rol de admin no asignado</p>
                          <p className="text-sm text-muted-foreground">
                            Tu cuenta ({session.user.email}) está autenticada pero necesitas asignarte el rol de administrador.
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-background/80 p-3 rounded-lg border border-yellow-500/30">
                        <p className="text-xs font-medium mb-2 text-foreground">Ejecuta este SQL en Supabase:</p>
                        <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
{`INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users 
WHERE email = '${session.user.email}';`}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full border-yellow-500/50 hover:bg-yellow-500/10"
                          onClick={() => copyToClipboard(`INSERT INTO user_roles (user_id, role)\nSELECT id, 'admin' FROM auth.users WHERE email = '${session.user.email}';`)}
                        >
                          <Copy className="w-3 h-3 mr-2" />
                          Copiar SQL
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Cerrar sesión
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.location.reload()}
                        >
                          Reintentar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-elegant border-primary/20">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-primary">
                    Panel de Administración
                  </CardTitle>
                  <CardDescription>
                    Inicia sesión para acceder
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@ejemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="border-primary/20 focus:border-primary pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="border-primary/20 focus:border-primary pl-10"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={loginLoading || !isSupabaseConfigured()}
                      className="w-full gradient-primary text-primary-foreground font-bold"
                    >
                      {loginLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4 mr-2" />
                      )}
                      Acceder
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-3xl font-display font-bold text-primary">
              Panel de Administración
            </h1>
            <div className="flex items-center gap-4">
              {/* Notification Toggle */}
              {notificationsSupported && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border">
                  {notificationsEnabled ? (
                    <Bell className="w-4 h-4 text-primary" />
                  ) : (
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm hidden sm:inline">
                    {notificationsDenied ? 'Bloqueadas' : notificationsEnabled ? 'Notificaciones' : 'Activar'}
                  </span>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationToggle}
                    disabled={notificationsDenied}
                    aria-label="Activar notificaciones push"
                  />
                </div>
              )}
              <Button variant="outline" onClick={handleLogout} className="border-primary text-primary">
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid grid-cols-9 w-full max-w-5xl">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="supabase" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Supabase</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="audience" className="flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                <span className="hidden sm:inline">Audiencia</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Cotizaciones</span>
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                <span className="hidden sm:inline">Campañas</span>
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="hero" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Banner</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <ProfileEditor />
            </TabsContent>

            {/* Audience Tab */}
            <TabsContent value="audience" className="space-y-6">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <PieChart className="w-5 h-5" />
                    Demografía de Audiencia
                  </CardTitle>
                  <CardDescription>
                    Edita los datos de género y edad que se muestran en la sección "Conoce Mi Audiencia"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AudienceEditor />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Supabase Config Tab */}
            <TabsContent value="supabase" className="space-y-6">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Database className="w-5 h-5" />
                    Estado de Supabase
                  </CardTitle>
                  <CardDescription>
                    Supabase se configura mediante variables de entorno
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status indicator */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {supabaseConfigured ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-400">Supabase Configurado</p>
                            <p className="text-sm text-muted-foreground">
                              {statsFromSupabase || campaignsFromSupabase || postsFromSupabase ? (
                                <span className="flex items-center gap-1">
                                  <Cloud className="w-3 h-3" /> Usando datos de Supabase
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <CloudOff className="w-3 h-3" /> Conectado pero sin datos
                                </span>
                              )}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6 text-yellow-500" />
                          <div>
                            <p className="font-medium text-yellow-700 dark:text-yellow-400">Sin Configurar</p>
                            <p className="text-sm text-muted-foreground">
                              Las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                    <h4 className="font-medium text-primary mb-2">📋 Configuración</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Para configurar Supabase, agrega estas variables de entorno en tu hosting (Netlify, Vercel, etc.):
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside font-mono">
                      <li>VITE_SUPABASE_URL</li>
                      <li>VITE_SUPABASE_ANON_KEY</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* SQL Schema Card */}
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    📋 SQL para crear tablas
                  </CardTitle>
                  <CardDescription>
                    Copia este SQL y ejecútalo en el SQL Editor de tu proyecto Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea 
                      value={sqlSchema}
                      readOnly
                      className="font-mono text-xs h-64 bg-muted/50 border-primary/20"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(sqlSchema)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar SQL
                    </Button>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                    <h4 className="font-medium text-primary mb-2">📋 Instrucciones</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Ve a tu proyecto en <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary underline">supabase.com/dashboard</a></li>
                      <li>Abre el SQL Editor en el menú lateral</li>
                      <li>Pega el SQL y haz clic en "Run"</li>
                      <li>Regresa aquí y prueba la conexión</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Setup Card */}
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    📦 SQL para Storage (Subir imágenes)
                  </CardTitle>
                  <CardDescription>
                    Ejecuta este SQL adicional para habilitar la subida de imágenes a Supabase Storage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea 
                      value={getStorageSetupSQL()}
                      readOnly
                      className="font-mono text-xs h-64 bg-muted/50 border-primary/20"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(getStorageSetupSQL())}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar SQL
                    </Button>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">⚠️ Importante</h4>
                    <p className="text-sm text-muted-foreground">
                      Este SQL crea los buckets <code className="bg-muted px-1 rounded">media</code> y <code className="bg-muted px-1 rounded">campaigns</code> para almacenar imágenes. 
                      Ejecuta esto <strong>después</strong> del SQL principal si quieres usar la función de subir imágenes.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Migration SQL Card */}
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    🔄 SQL de Migración (si ya tienes tablas)
                  </CardTitle>
                  <CardDescription>
                    Si ya creaste las tablas anteriormente, ejecuta esto para añadir los nuevos campos de expectativas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea 
                      value={`-- ============================================
-- MIGRACIÓN: Añadir campos de expectativas a campaigns
-- Ejecuta esto si ya tienes la tabla campaigns creada
-- ============================================

-- Añadir campos de expectativas
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_reach INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_impressions INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_clicks INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_ctr DECIMAL(5,2) DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_engagement DECIMAL(5,2) DEFAULT 0;

-- Añadir campos de detalles de campaña
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('instagram', 'tiktok', 'both'));
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_type TEXT CHECK (campaign_type IN ('stories', 'reels', 'post', 'live', 'mixed'));
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2) DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- MIGRACIÓN: Añadir campos de imagen a testimonials
-- ============================================
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS image_type TEXT CHECK (image_type IN ('logo', 'photo'));

-- ============================================
-- MIGRACIÓN: Añadir Facebook a best_posts
-- ============================================
-- Si ya tienes la constraint, primero elimínala:
-- ALTER TABLE best_posts DROP CONSTRAINT IF EXISTS best_posts_platform_check;
-- Luego crea la nueva:
ALTER TABLE best_posts DROP CONSTRAINT IF EXISTS best_posts_platform_check;
ALTER TABLE best_posts ADD CONSTRAINT best_posts_platform_check CHECK (platform IN ('instagram', 'tiktok', 'facebook'));

-- Verificar que se añadieron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
ORDER BY ordinal_position;`}
                      readOnly
                      className="font-mono text-xs h-64 bg-muted/50 border-primary/20"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`-- MIGRACIÓN COMPLETA
-- Campaigns: expectativas y detalles
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_reach INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_impressions INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_clicks INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_ctr DECIMAL(5,2) DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expected_engagement DECIMAL(5,2) DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('instagram', 'tiktok', 'both'));
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_type TEXT CHECK (campaign_type IN ('stories', 'reels', 'post', 'live', 'mixed'));
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2) DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS notes TEXT;

-- Testimonials: imagen
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS image_type TEXT CHECK (image_type IN ('logo', 'photo'));

-- Best Posts: Facebook
ALTER TABLE best_posts DROP CONSTRAINT IF EXISTS best_posts_platform_check;
ALTER TABLE best_posts ADD CONSTRAINT best_posts_platform_check CHECK (platform IN ('instagram', 'tiktok', 'facebook'));`)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar SQL
                    </Button>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">ℹ️ Solo si ya tienes tablas</h4>
                    <p className="text-sm text-muted-foreground">
                      Este SQL <strong>solo es necesario</strong> si ya ejecutaste el schema original. Los nuevos campos permiten 
                      comparar resultados reales vs expectativas de la marca.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Audience Tables SQL */}
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <PieChart className="w-5 h-5" />
                    SQL para Tablas de Audiencia
                  </CardTitle>
                  <CardDescription>
                    Ejecuta este SQL para crear las tablas de demografía (género y edad)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea 
                      value={`-- ============================================
-- TABLAS DE AUDIENCIA (Demografía)
-- ============================================

-- Tabla de género
CREATE TABLE IF NOT EXISTS audience_gender (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de edad
CREATE TABLE IF NOT EXISTS audience_age (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age TEXT NOT NULL,
  percentage INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE audience_gender ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_age ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Public read audience_gender" ON audience_gender FOR SELECT USING (true);
CREATE POLICY "Public read audience_age" ON audience_age FOR SELECT USING (true);

-- Políticas de escritura (solo admins)
CREATE POLICY "Admins can manage audience_gender" ON audience_gender FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage audience_age" ON audience_age FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Datos iniciales de género
INSERT INTO audience_gender (name, value) VALUES
  ('Hombres', 77),
  ('Mujeres', 23);

-- Datos iniciales de edad
INSERT INTO audience_age (age, percentage, order_index) VALUES
  ('18-24', 22, 0),
  ('25-34', 38, 1),
  ('35-44', 20, 2),
  ('45-54', 12, 3),
  ('55+', 8, 4);`}
                      readOnly
                      className="font-mono text-xs h-64 bg-muted/50 border-primary/20"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`-- TABLAS DE AUDIENCIA
CREATE TABLE IF NOT EXISTS audience_gender (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audience_age (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age TEXT NOT NULL,
  percentage INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audience_gender ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_age ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read audience_gender" ON audience_gender FOR SELECT USING (true);
CREATE POLICY "Public read audience_age" ON audience_age FOR SELECT USING (true);
CREATE POLICY "Admins can manage audience_gender" ON audience_gender FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage audience_age" ON audience_age FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO audience_gender (name, value) VALUES ('Hombres', 77), ('Mujeres', 23);
INSERT INTO audience_age (age, percentage, order_index) VALUES ('18-24', 22, 0), ('25-34', 38, 1), ('35-44', 20, 2), ('45-54', 12, 3), ('55+', 8, 4);`)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar SQL
                    </Button>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">✅ Requerido para editar audiencia</h4>
                    <p className="text-sm text-muted-foreground">
                      Este SQL crea las tablas necesarias para que los gráficos de "Conoce Mi Audiencia" sean editables desde el panel admin.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <BarChart3 className="w-5 h-5" />
                    Editar Estadísticas
                  </CardTitle>
                  <CardDescription>
                    Actualiza los números de tus redes sociales manualmente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Seguidores Instagram</Label>
                      <Input
                        type="number"
                        value={localStats?.instagram_followers ?? 0}
                        onChange={(e) => localStats && setLocalStats({...localStats, instagram_followers: parseInt(e.target.value) || 0})}
                        className="border-primary/20"
                        disabled={!localStats}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Seguidores TikTok</Label>
                      <Input
                        type="number"
                        value={localStats?.tiktok_followers ?? 0}
                        onChange={(e) => localStats && setLocalStats({...localStats, tiktok_followers: parseInt(e.target.value) || 0})}
                        className="border-primary/20"
                        disabled={!localStats}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Views</Label>
                      <Input
                        type="number"
                        value={localStats?.total_views ?? 0}
                        onChange={(e) => localStats && setLocalStats({...localStats, total_views: parseInt(e.target.value) || 0})}
                        className="border-primary/20"
                        disabled={!localStats}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Engagement Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={localStats?.engagement_rate ?? 0}
                        onChange={(e) => localStats && setLocalStats({...localStats, engagement_rate: parseFloat(e.target.value) || 0})}
                        className="border-primary/20"
                        disabled={!localStats}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveStats} className="gradient-primary text-primary-foreground">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard Comparativo de Campañas
                  </CardTitle>
                  <CardDescription>
                    Análisis agregado de rendimiento: métricas reales vs expectativas de marca
                  </CardDescription>
                </CardHeader>
              </Card>
              <CampaignsDashboard campaigns={campaigns} />
            </TabsContent>

            {/* Quotes Tab */}
            <TabsContent value="quotes" className="space-y-6">
              <QuoteRequestsPanel 
                onAcceptQuote={(quote: QuoteRequest) => {
                  // Generate campaign code
                  const prefix = quote.brand_name.slice(0, 4).toUpperCase();
                  const year = new Date().getFullYear();
                  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
                  const campaignCode = `${prefix}${year}${random}`;
                  
                  // Pre-fill campaign form with quote data
                  setNewCampaign({
                    campaign_code: campaignCode,
                    brand_email: quote.brand_email,
                    brand_name: quote.brand_name,
                    brand_logo_url: "",
                    brand_website_url: quote.brand_website_url,
                    metrics_reach: 0,
                    metrics_impressions: 0,
                    metrics_clicks: 0,
                    expected_reach: quote.expected_reach || 0,
                    expected_impressions: quote.expected_impressions || 0,
                    expected_clicks: quote.expected_clicks || 0,
                    expected_ctr: quote.expected_ctr || 0,
                    expected_engagement: quote.expected_engagement || 0,
                    start_date: quote.start_date || "",
                    end_date: quote.end_date || "",
                    platform: (quote.platform as "instagram" | "tiktok" | "both") || "instagram",
                    campaign_type: (quote.campaign_type as "stories" | "reels" | "post" | "live" | "mixed") || "reels",
                    budget: quote.budget || 0,
                    video_result_url: "",
                    notes: quote.notes || "",
                    is_active: true
                  });
                  
                  // Switch to campaigns tab
                  const campaignsTab = document.querySelector('[data-state="inactive"][value="campaigns"]') as HTMLElement;
                  if (campaignsTab) campaignsTab.click();
                }}
              />
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Plus className="w-5 h-5" />
                    Nueva Campaña
                  </CardTitle>
                  <CardDescription>
                    Crea una nueva campaña con métricas reales y expectativas para análisis comparativo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCampaign} className="space-y-6">
                    {/* Información básica */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">📋 Información Básica</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre de Marca *</Label>
                          <Input
                            value={newCampaign.brand_name}
                            onChange={(e) => setNewCampaign({...newCampaign, brand_name: e.target.value})}
                            required
                            placeholder="Ej: Nike, Coca-Cola"
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email de Marca *</Label>
                          <Input
                            type="email"
                            value={newCampaign.brand_email}
                            onChange={(e) => setNewCampaign({...newCampaign, brand_email: e.target.value})}
                            required
                            placeholder="marketing@marca.com"
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Código de Campaña *</Label>
                          <Input
                            value={newCampaign.campaign_code}
                            onChange={(e) => setNewCampaign({...newCampaign, campaign_code: e.target.value.toUpperCase()})}
                            required
                            placeholder="MARCA2024"
                            className="border-primary/20 uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Brand Logo Uploader */}
                    <ImageUploader
                      label="Logo de la Marca"
                      value={newCampaign.brand_logo_url}
                      onChange={(url) => setNewCampaign({...newCampaign, brand_logo_url: url})}
                      bucket="campaigns"
                      folder="logos"
                      previewClassName="w-20 h-20"
                      aspectRatio="square"
                      helpText="Sube el logo de la marca para mostrar en los reportes de campaña"
                    />

                    {/* Detalles de la campaña */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">📅 Detalles de Campaña</h4>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Plataforma</Label>
                          <Select
                            value={newCampaign.platform}
                            onValueChange={(value: "instagram" | "tiktok" | "both") => setNewCampaign({...newCampaign, platform: value})}
                          >
                            <SelectTrigger className="border-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="instagram">Instagram</SelectItem>
                              <SelectItem value="tiktok">TikTok</SelectItem>
                              <SelectItem value="both">Ambas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo de Contenido</Label>
                          <Select
                            value={newCampaign.campaign_type}
                            onValueChange={(value: "stories" | "reels" | "post" | "live" | "mixed") => setNewCampaign({...newCampaign, campaign_type: value})}
                          >
                            <SelectTrigger className="border-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="reels">Reels</SelectItem>
                              <SelectItem value="stories">Stories</SelectItem>
                              <SelectItem value="post">Post Feed</SelectItem>
                              <SelectItem value="live">Live</SelectItem>
                              <SelectItem value="mixed">Mixto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha Inicio</Label>
                          <Input
                            type="date"
                            value={newCampaign.start_date}
                            onChange={(e) => setNewCampaign({...newCampaign, start_date: e.target.value})}
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fecha Fin</Label>
                          <Input
                            type="date"
                            value={newCampaign.end_date}
                            onChange={(e) => setNewCampaign({...newCampaign, end_date: e.target.value})}
                            className="border-primary/20"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Presupuesto (USD)</Label>
                          <Input
                            type="number"
                            value={newCampaign.budget}
                            onChange={(e) => setNewCampaign({...newCampaign, budget: parseInt(e.target.value) || 0})}
                            placeholder="500"
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URL Video Resultado</Label>
                          <Input
                            value={newCampaign.video_result_url}
                            onChange={(e) => setNewCampaign({...newCampaign, video_result_url: e.target.value})}
                            placeholder="https://instagram.com/reel/..."
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URL Sitio Web de la Marca</Label>
                          <Input
                            value={newCampaign.brand_website_url}
                            onChange={(e) => setNewCampaign({...newCampaign, brand_website_url: e.target.value})}
                            placeholder="https://marca.com"
                            className="border-primary/20"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Los visitantes podrán hacer clic en el logo para ir al sitio web
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Estado de Colaboración</Label>
                          <Select
                            value={newCampaign.is_active ? "active" : "past"}
                            onValueChange={(value) => setNewCampaign({...newCampaign, is_active: value === "active"})}
                          >
                            <SelectTrigger className="border-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">✅ Colaboración Activa</SelectItem>
                              <SelectItem value="past">📁 Colaboración Anterior</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Métricas Reales */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">📊 Resultados Reales</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Alcance Real</Label>
                          <Input
                            type="number"
                            value={newCampaign.metrics_reach}
                            onChange={(e) => setNewCampaign({...newCampaign, metrics_reach: parseInt(e.target.value) || 0})}
                            placeholder="10000"
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Impresiones Reales</Label>
                          <Input
                            type="number"
                            value={newCampaign.metrics_impressions}
                            onChange={(e) => setNewCampaign({...newCampaign, metrics_impressions: parseInt(e.target.value) || 0})}
                            placeholder="25000"
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Clicks Reales</Label>
                          <Input
                            type="number"
                            value={newCampaign.metrics_clicks}
                            onChange={(e) => setNewCampaign({...newCampaign, metrics_clicks: parseInt(e.target.value) || 0})}
                            placeholder="500"
                            className="border-primary/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expectativas de la Marca */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">🎯 Expectativas de la Marca (para comparación)</h4>
                      <p className="text-xs text-muted-foreground">Ingresa lo que la marca esperaba lograr para calcular el rendimiento comparativo</p>
                      <div className="grid md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label>Alcance Esperado</Label>
                          <Input
                            type="number"
                            value={newCampaign.expected_reach}
                            onChange={(e) => setNewCampaign({...newCampaign, expected_reach: parseInt(e.target.value) || 0})}
                            placeholder="8000"
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Impresiones Esperadas</Label>
                          <Input
                            type="number"
                            value={newCampaign.expected_impressions}
                            onChange={(e) => setNewCampaign({...newCampaign, expected_impressions: parseInt(e.target.value) || 0})}
                            placeholder="20000"
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Clicks Esperados</Label>
                          <Input
                            type="number"
                            value={newCampaign.expected_clicks}
                            onChange={(e) => setNewCampaign({...newCampaign, expected_clicks: parseInt(e.target.value) || 0})}
                            placeholder="400"
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CTR Esperado (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newCampaign.expected_ctr}
                            onChange={(e) => setNewCampaign({...newCampaign, expected_ctr: parseFloat(e.target.value) || 0})}
                            placeholder="2.0"
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Engagement Esperado (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newCampaign.expected_engagement}
                            onChange={(e) => setNewCampaign({...newCampaign, expected_engagement: parseFloat(e.target.value) || 0})}
                            placeholder="5.0"
                            className="border-primary/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                      <Label>Notas Adicionales</Label>
                      <Textarea
                        value={newCampaign.notes}
                        onChange={(e) => setNewCampaign({...newCampaign, notes: e.target.value})}
                        placeholder="Información adicional sobre la campaña, objetivos específicos, etc."
                        className="border-primary/20"
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="gradient-primary text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Campaña
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Campaigns List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary">Campañas Existentes</h3>
                {campaigns.length === 0 ? (
                  <Card className="border-dashed border-primary/20">
                    <CardContent className="p-8 text-center">
                      <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay campañas creadas aún</p>
                    </CardContent>
                  </Card>
                ) : (
                  campaigns.map((campaign) => (
                    <Card key={campaign.id} className={`border-primary/10 ${campaign.is_active === false ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {campaign.brand_logo_url && (
                              <img 
                                src={campaign.brand_logo_url} 
                                alt={campaign.brand_name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-primary truncate">{campaign.brand_name}</p>
                                {campaign.is_active === false && (
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                    Anterior
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                Código: {campaign.campaign_code} | {campaign.platform || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`active-${campaign.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
                                {campaign.is_active !== false ? 'Activa' : 'Anterior'}
                              </Label>
                              <Switch
                                id={`active-${campaign.id}`}
                                checked={campaign.is_active !== false}
                                onCheckedChange={async (checked) => {
                                  await updateCampaign(campaign.id, { is_active: checked });
                                  toast.success(checked ? 'Campaña marcada como activa' : 'Campaña marcada como anterior');
                                }}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCampaignId(campaign.id);
                                if (campaign.insights) {
                                  setLocalInsight({
                                    campaign_id: campaign.id,
                                    best_day: campaign.insights.best_day || '',
                                    peak_hour: campaign.insights.peak_hour || '',
                                    top_location: campaign.insights.top_location || '',
                                    primary_demo: campaign.insights.primary_demo || '',
                                    sentiment_pos: campaign.insights.sentiment_pos || 80,
                                    performance_score: campaign.insights.performance_score || 'A+',
                                    recommedation_rate: campaign.insights.recommedation_rate || 'Top 10%',
                                    insight_summary: campaign.insights.insight_summary || '',
                                    performance_note: campaign.insights.performance_note || ''
                                  });
                                } else {
                                  setLocalInsight({
                                    campaign_id: campaign.id,
                                    best_day: '',
                                    peak_hour: '',
                                    top_location: '',
                                    primary_demo: '',
                                    sentiment_pos: 80,
                                    performance_score: 'A+',
                                    recommedation_rate: 'Top 10%',
                                    insight_summary: '',
                                    performance_note: ''
                                  });
                                }
                                setShowInsightModal(true);
                              }}
                            >
                              <BarChart3 className="w-4 h-4 mr-1" />
                              Insights
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Insight Edit Modal */}
              {showInsightModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-background border border-primary/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                  >
                    <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-primary/5">
                      <div>
                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Editar Insights de Campaña
                        </h2>
                        <p className="text-xs text-muted-foreground">Personaliza las métricas avanzadas para esta marca</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowInsightModal(false)}>
                        <XCircle className="w-6 h-6" />
                      </Button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mejor Día</Label>
                          <Input 
                            value={localInsight.best_day} 
                            placeholder="Ej: Jueves"
                            onChange={(e) => setLocalInsight({...localInsight, best_day: e.target.value})}
                            className="border-primary/20 focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hora Pico</Label>
                          <Input 
                            value={localInsight.peak_hour} 
                            placeholder="Ej: 8:00 PM - 10:00 PM"
                            onChange={(e) => setLocalInsight({...localInsight, peak_hour: e.target.value})}
                            className="border-primary/20 focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ubicación Principal</Label>
                          <Input 
                            value={localInsight.top_location} 
                            placeholder="Ej: CDMX, México"
                            onChange={(e) => setLocalInsight({...localInsight, top_location: e.target.value})}
                            className="border-primary/20 focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Demografía Principal</Label>
                          <Input 
                            value={localInsight.primary_demo} 
                            placeholder="Ej: 18-34 años"
                            onChange={(e) => setLocalInsight({...localInsight, primary_demo: e.target.value})}
                            className="border-primary/20 focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Puntaje de Rendimiento</Label>
                          <Select 
                            value={localInsight.performance_score} 
                            onValueChange={(v) => setLocalInsight({...localInsight, performance_score: v})}
                          >
                            <SelectTrigger className="border-primary/20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['S', 'A+', 'A', 'B', 'C'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tasa de Recomendación</Label>
                          <Input 
                            value={localInsight.recommedation_rate} 
                            placeholder="Ej: Top 10%"
                            onChange={(e) => setLocalInsight({...localInsight, recommedation_rate: e.target.value})}
                            className="border-primary/20 focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sentimiento Positivo (%)</Label>
                          <div className="flex items-center gap-3">
                            <Input 
                              type="number"
                              min="0"
                              max="100"
                              value={localInsight.sentiment_pos} 
                              onChange={(e) => setLocalInsight({...localInsight, sentiment_pos: parseInt(e.target.value) || 0})}
                              className="border-primary/20 focus-visible:ring-primary"
                            />
                            <span className="text-xs text-muted-foreground w-20">Neutro: {100 - localInsight.sentiment_pos}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Resumen Narrativo (Insights Summary)</Label>
                        <Textarea 
                          value={localInsight.insight_summary} 
                          placeholder="Un párrafo resumiendo lo más exitoso de la campaña..."
                          onChange={(e) => setLocalInsight({...localInsight, insight_summary: e.target.value})}
                          className="border-primary/20 focus-visible:ring-primary min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Nota de Rendimiento (Performance Note)</Label>
                        <Input 
                          value={localInsight.performance_note} 
                          placeholder="Ej: Superó el promedio de vistas mensuales en un 25%"
                          onChange={(e) => setLocalInsight({...localInsight, performance_note: e.target.value})}
                          className="border-primary/20 focus-visible:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="p-6 border-t border-primary/10 flex justify-end gap-3 bg-primary/5">
                      <Button variant="outline" onClick={() => setShowInsightModal(false)}>Cancelar</Button>
                      <Button 
                        className="gradient-primary text-primary-foreground min-w-[120px]"
                        onClick={async () => {
                          const result = await upsertInsights(localInsight);
                          if (result) {
                            toast.success('Insights actualizados correctamente');
                            setShowInsightModal(false);
                            refreshCampaigns(); // To update the local list with the new insight object
                          } else {
                            toast.error('Error al guardar insights');
                          }
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-primary/20 shadow-elegant">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary" />
                      Añadir Nuevo Post
                    </CardTitle>
                    <CardDescription>Destaca tus mejores contenidos de Instagram o TikTok</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="platform">Plataforma</Label>
                        <Select 
                          value={newPost.platform} 
                          onValueChange={(v: any) => setNewPost({...newPost, platform: v})}
                        >
                          <SelectTrigger className="border-primary/20"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="views_count">Vistas</Label>
                        <Input 
                          id="views_count" 
                          type="number"
                          value={newPost.views_count} 
                          onChange={(e) => setNewPost({...newPost, views_count: parseInt(e.target.value) || 0})}
                          className="border-primary/20 focus-visible:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="post_url">URL del Post</Label>
                      <Input 
                        id="post_url" 
                        placeholder="https://..."
                        value={newPost.post_url} 
                        onChange={(e) => setNewPost({...newPost, post_url: e.target.value})}
                        className="border-primary/20 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail">URL Miniatura (Opcional)</Label>
                      <Input 
                        id="thumbnail" 
                        placeholder="Dejar vacío para usar automáticas"
                        value={newPost.thumbnail} 
                        onChange={(e) => setNewPost({...newPost, thumbnail: e.target.value})}
                        className="border-primary/20 focus-visible:ring-primary"
                      />
                    </div>
                    <Button 
                      className="w-full gradient-primary text-primary-foreground font-bold"
                      onClick={async () => {
                        await addPost(newPost);
                        setNewPost({ platform: 'instagram', post_url: '', thumbnail: '', views_count: 0 });
                        toast.success('Post añadido correctamente');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir Post
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {posts.map((post) => (
                    <Card key={post.id} className="border-primary/10 overflow-hidden flex items-center hover:shadow-md transition-all group relative">
                      <div className="w-24 h-24 bg-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {post.thumbnail ? (
                          <img src={post.thumbnail} alt="Post" className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            post.platform === 'instagram' 
                              ? 'bg-gradient-to-br from-[#E1306C] to-[#F77737]' 
                              : post.platform === 'tiktok'
                              ? 'bg-gradient-to-br from-[#000000] to-[#00F2EA]'
                              : 'bg-gradient-to-br from-[#1877F2] to-[#42B72A]'
                          }`}>
                            <span className="text-white text-2xl font-bold uppercase">
                              {post.platform.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 flex-1 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm capitalize">{post.platform}</p>
                          <p className="text-xs text-muted-foreground">{post.views_count.toLocaleString()} vistas</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-primary hover:bg-primary/10"
                            asChild
                          >
                            <a href={post.post_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => removePost(post.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Hero Banner Tab */}
            <TabsContent value="hero" className="space-y-6">
              <HeroVideosManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
