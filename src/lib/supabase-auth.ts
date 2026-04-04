import { getSupabaseClient } from './supabase-client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return { success: false, error: 'Supabase no está configurado. Configúralo primero en la pestaña Supabase.' };
  }

  try {
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return { success: false, error: 'Supabase no está configurado. Configúralo primero en la pestaña Supabase.' };
  }

  try {
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/admin',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
};

// Sign out
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    const { error } = await client.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
};

// Get current session
export const getSession = async (): Promise<Session | null> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return null;
  }

  try {
    const { data: { session } } = await client.auth.getSession();
    return session;
  } catch {
    return null;
  }
};

// Get current user
export const getUser = async (): Promise<User | null> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return null;
  }

  try {
    const { data: { user } } = await client.auth.getUser();
    return user;
  } catch {
    return null;
  }
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (session: Session | null) => void): (() => void) => {
  const client = getSupabaseClient();
  
  if (!client) {
    return () => {};
  }

  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
};

// Check if user has admin role in the user_roles table
export const checkAdminRole = async (userId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  
  if (!client || !userId) {
    return false;
  }

  try {
    const { data, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      // If table doesn't exist yet, allow access for initial setup
      if (error.code === 'PGRST205' || error.code === '42P01') {
        console.warn('user_roles table not found. Run the SQL schema first.');
        return true; // Allow access to configure
      }
      console.error('Error checking admin role:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('Exception checking admin role:', err);
    return false;
  }
};
