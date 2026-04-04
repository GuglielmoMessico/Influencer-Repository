import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-client';

// Extended theme config organized by sections
export interface ThemeConfig {
  // Base (Hero & General)
  backgroundHsl: string;
  foregroundHsl: string;
  primaryHsl: string;
  primaryForegroundHsl: string;
  accentHsl: string;
  accentForegroundHsl: string;
  
  // Cards & Sections
  cardHsl: string;
  cardForegroundHsl: string;
  mutedHsl: string;
  mutedForegroundHsl: string;
  
  // Buttons & Actions
  secondaryHsl: string;
  secondaryForegroundHsl: string;
  
  // Forms & Inputs
  borderHsl: string;
  inputHsl: string;
  ringHsl: string;
  
  // Charts (Audience section)
  chart1Hsl: string;
  chart2Hsl: string;
}

// Default theme values (used as fallback if Supabase is not available)
export const DEFAULT_THEME: ThemeConfig = {
  // Base
  backgroundHsl: "18 81% 80%",
  foregroundHsl: "0 0% 18%",
  primaryHsl: "350 59% 19%",
  primaryForegroundHsl: "0 0% 100%",
  accentHsl: "350 59% 25%",
  accentForegroundHsl: "0 0% 100%",
  
  // Cards
  cardHsl: "18 81% 85%",
  cardForegroundHsl: "0 0% 18%",
  mutedHsl: "18 40% 70%",
  mutedForegroundHsl: "0 0% 35%",
  
  // Buttons
  secondaryHsl: "18 60% 75%",
  secondaryForegroundHsl: "350 59% 19%",
  
  // Forms
  borderHsl: "350 30% 40%",
  inputHsl: "18 50% 85%",
  ringHsl: "350 59% 19%",
  
  // Charts
  chart1Hsl: "350 59% 19%",
  chart2Hsl: "18 81% 70%",
};

// Apply theme to CSS variables
export const applyTheme = (theme: ThemeConfig): void => {
  const root = document.documentElement;
  
  // Base
  root.style.setProperty('--background', theme.backgroundHsl);
  root.style.setProperty('--foreground', theme.foregroundHsl);
  root.style.setProperty('--primary', theme.primaryHsl);
  root.style.setProperty('--primary-foreground', theme.primaryForegroundHsl);
  root.style.setProperty('--accent', theme.accentHsl);
  root.style.setProperty('--accent-foreground', theme.accentForegroundHsl);
  
  // Cards
  root.style.setProperty('--card', theme.cardHsl);
  root.style.setProperty('--card-foreground', theme.cardForegroundHsl);
  root.style.setProperty('--muted', theme.mutedHsl);
  root.style.setProperty('--muted-foreground', theme.mutedForegroundHsl);
  
  // Buttons
  root.style.setProperty('--secondary', theme.secondaryHsl);
  root.style.setProperty('--secondary-foreground', theme.secondaryForegroundHsl);
  
  // Forms
  root.style.setProperty('--border', theme.borderHsl);
  root.style.setProperty('--input', theme.inputHsl);
  root.style.setProperty('--ring', theme.ringHsl);
  
  // Charts
  root.style.setProperty('--chart-1', theme.chart1Hsl);
  root.style.setProperty('--chart-2', theme.chart2Hsl);
};

// Fetch theme from Supabase
export const getThemeFromSupabase = async (): Promise<ThemeConfig | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('theme_settings')
    .select('*')
    .maybeSingle();

  if (error || !data) return null;

  return {
    backgroundHsl: data.background_hsl,
    foregroundHsl: data.foreground_hsl,
    primaryHsl: data.primary_hsl,
    primaryForegroundHsl: data.primary_foreground_hsl || DEFAULT_THEME.primaryForegroundHsl,
    accentHsl: data.accent_hsl,
    accentForegroundHsl: data.accent_foreground_hsl || DEFAULT_THEME.accentForegroundHsl,
    cardHsl: data.card_hsl || DEFAULT_THEME.cardHsl,
    cardForegroundHsl: data.card_foreground_hsl || DEFAULT_THEME.cardForegroundHsl,
    mutedHsl: data.muted_hsl || DEFAULT_THEME.mutedHsl,
    mutedForegroundHsl: data.muted_foreground_hsl || DEFAULT_THEME.mutedForegroundHsl,
    secondaryHsl: data.secondary_hsl || DEFAULT_THEME.secondaryHsl,
    secondaryForegroundHsl: data.secondary_foreground_hsl || DEFAULT_THEME.secondaryForegroundHsl,
    borderHsl: data.border_hsl || DEFAULT_THEME.borderHsl,
    inputHsl: data.input_hsl || DEFAULT_THEME.inputHsl,
    ringHsl: data.ring_hsl || DEFAULT_THEME.ringHsl,
    chart1Hsl: data.chart1_hsl || DEFAULT_THEME.chart1Hsl,
    chart2Hsl: data.chart2_hsl || DEFAULT_THEME.chart2Hsl,
  };
};

// Save theme to Supabase
export const saveThemeToSupabase = async (theme: ThemeConfig): Promise<ThemeConfig | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const themeData = {
    background_hsl: theme.backgroundHsl,
    foreground_hsl: theme.foregroundHsl,
    primary_hsl: theme.primaryHsl,
    primary_foreground_hsl: theme.primaryForegroundHsl,
    accent_hsl: theme.accentHsl,
    accent_foreground_hsl: theme.accentForegroundHsl,
    card_hsl: theme.cardHsl,
    card_foreground_hsl: theme.cardForegroundHsl,
    muted_hsl: theme.mutedHsl,
    muted_foreground_hsl: theme.mutedForegroundHsl,
    secondary_hsl: theme.secondaryHsl,
    secondary_foreground_hsl: theme.secondaryForegroundHsl,
    border_hsl: theme.borderHsl,
    input_hsl: theme.inputHsl,
    ring_hsl: theme.ringHsl,
    chart1_hsl: theme.chart1Hsl,
    chart2_hsl: theme.chart2Hsl,
    updated_at: new Date().toISOString(),
  };

  // Try to update existing row, or insert if none exists
  const { data: existing } = await client.from('theme_settings').select('id').limit(1);
  
  if (existing && existing.length > 0) {
    const { data, error } = await client
      .from('theme_settings')
      .update(themeData)
      .eq('id', existing[0].id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return theme;
  } else {
    const { data, error } = await client
      .from('theme_settings')
      .insert(themeData)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return theme;
  }
};

// Hook for theme management
export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTheme = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      applyTheme(DEFAULT_THEME);
      setLoading(false);
      return;
    }

    const supabaseTheme = await getThemeFromSupabase();
    
    if (supabaseTheme) {
      setTheme(supabaseTheme);
      applyTheme(supabaseTheme);
    } else {
      // Apply default theme if Supabase returns nothing
      applyTheme(DEFAULT_THEME);
    }

    setLoading(false);
  }, []);

  const updateTheme = useCallback(async (newTheme: ThemeConfig): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      setError('Supabase no está configurado');
      return false;
    }

    const result = await saveThemeToSupabase(newTheme);
    
    if (result) {
      setTheme(newTheme);
      applyTheme(newTheme);
      return true;
    }
    
    setError('Error al guardar el tema');
    return false;
  }, []);

  const resetTheme = useCallback(async (): Promise<boolean> => {
    return updateTheme(DEFAULT_THEME);
  }, [updateTheme]);

  const refresh = useCallback(() => {
    loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  return {
    theme,
    setTheme, // For local state changes (before saving)
    loading,
    error,
    updateTheme, // Save to Supabase and apply
    resetTheme,
    refresh,
  };
};

// Initialize theme on app load (for main.tsx)
export const initializeTheme = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    applyTheme(DEFAULT_THEME);
    return;
  }

  const theme = await getThemeFromSupabase();
  applyTheme(theme || DEFAULT_THEME);
};
