// Data types for Yefer Showw Media Kit
// All data comes from Supabase - NO localStorage

export interface Stats {
  instagram_followers: number;
  tiktok_followers: number;
  total_views: number;
  engagement_rate: number;
  last_updated: string;
}

export interface Campaign {
  id: string;
  campaign_code: string;
  brand_email: string;
  brand_name: string;
  brand_logo_url?: string;
  // Resultados reales
  metrics_reach: number;
  metrics_impressions: number;
  metrics_clicks: number;
  // Expectativas de la marca (para comparación)
  expected_reach?: number;
  expected_impressions?: number;
  expected_clicks?: number;
  expected_ctr?: number;
  expected_engagement?: number;
  // Información adicional
  start_date?: string;
  end_date?: string;
  platform?: 'instagram' | 'tiktok' | 'both';
  platforms?: string[]; // Para selección múltiple
  campaign_type?: 'stories' | 'reels' | 'post' | 'live' | 'mixed';
  campaign_types?: string[]; // Para selección múltiple
  budget?: number;
  video_result_url: string;
  notes?: string;
  // Métricas reales por plataforma (nuevos)
  real_reach_instagram?: number;
  real_reach_tiktok?: number;
  real_reach_facebook?: number;
  real_reach_x?: number;
  real_reach_threads?: number;
  real_impressions?: number;
  real_clicks?: number;
  accepted_at?: string;
  // Estado de la colaboración
  is_active?: boolean; // true = colaboración activa, false = colaboración anterior
  // URL del sitio web de la marca (para redirección desde logos)
  brand_website_url?: string;
  // Trazabilidad
  source_quote_request_id?: string;
  // Moneda del presupuesto
  budget_currency?: string;
  // Insights dinámicos (opcionales)
  insights?: CampaignInsight;
}

export interface CampaignInsight {
  id?: string;
  campaign_id: string;
  best_day: string;
  peak_hour: string;
  top_location: string;
  primary_demo: string;
  sentiment_pos: number;
  performance_score: string;
  recommedation_rate: string;
  insight_summary?: string;
  performance_note?: string;
  updated_at?: string;
}

export interface HeroVideo {
  id: string;
  video_url: string;
  title?: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
}

// Brand click tracking interface
export interface BrandClick {
  id: string;
  campaign_id: string;
  clicked_at: string;
  page_source: string;
  created_at: string;
}

export interface BestPost {
  id: string;
  platform: 'instagram' | 'tiktok' | 'facebook' | 'x' | 'threads';
  post_url: string;
  thumbnail?: string; // Ahora opcional - se muestra placeholder si no existe
  views_count: number;
}

// Profile config interface
export interface ProfileConfig {
  name: string;
  tagline: string;
  description: string;
  bio: string; // Hero bio text
  profileImageUrl: string;
  logoUrl: string;
  tags: string[];
  socialLinks: {
    instagram: string;
    tiktok: string;
    facebook?: string;
    x?: string;
    threads?: string;
    email: string;
  };
}

// Work format interface (for "Formatos de Trabajo" section)
export interface WorkFormat {
  id: string;
  icon: string;
  title: string;
  description: string;
  order_index: number;
}

// Testimonial interface
export interface Testimonial {
  id: string;
  quote: string;
  brand: string;
  company: string;
  image_url?: string; // Logo de la empresa o foto de la persona
  image_type?: 'logo' | 'photo'; // Tipo de imagen
}

// Audience demographics interfaces
export interface AudienceGender {
  id?: string;
  name: string;
  value: number;
}

export interface AudienceAge {
  id?: string;
  age: string;
  percentage: number;
  order_index: number;
}

// Theme config interface - theme is now managed by useTheme hook
// Re-export from use-theme for backwards compatibility
export type { ThemeConfig } from '@/hooks/use-theme';
export { DEFAULT_THEME, applyTheme, initializeTheme } from '@/hooks/use-theme';

// Format helpers
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};
