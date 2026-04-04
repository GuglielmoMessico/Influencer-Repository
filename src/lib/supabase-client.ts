import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client - usa variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
// Rebuild trigger: env vars loaded at compile time
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configurados en las variables de entorno');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
};

export const resetSupabaseClient = (): void => {
  supabaseClient = null;
};

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Test connection to Supabase
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return { success: false, error: 'Supabase no está configurado - verifica las variables de entorno' };
  }

  try {
    // Try to query stats table to test connection
    const { error } = await client.from('stats').select('id').limit(1);
    
    if (error) {
      // Table might not exist yet, but connection works
      if (error.code === '42P01') {
        return { success: true };
      }
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
};
