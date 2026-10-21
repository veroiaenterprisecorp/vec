import { createClient, SupabaseClient } from '@supabase/supabase-js';

const configuredEnvUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredEnvAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const fallbackUrl = 'https://cruijnhylcdojbilzgwd.supabase.co';
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydWlqbmh5bGNkb2piaWx6Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODE2NzIsImV4cCI6MjEwODA1NzY3Mn0.QQL0hq4Kzp01Hf7xfWDEDlCY9f-vyreYvze6tVD582k';

export const getSupabaseUrl = (): string => {
  // If Vercel environment variable is set, it takes priority
  if (configuredEnvUrl && configuredEnvUrl.trim().startsWith('http')) {
    return configuredEnvUrl.trim();
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('vec_supabase_url');
    if (saved && saved.trim().startsWith('http')) {
      return saved.trim();
    }
  }
  return fallbackUrl;
};

export const getSupabaseAnonKey = (): string => {
  if (configuredEnvAnonKey && configuredEnvAnonKey.trim().length > 20) {
    return configuredEnvAnonKey.trim();
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('vec_supabase_anon_key');
    if (saved && saved.trim().length > 20) {
      return saved.trim();
    }
  }
  return fallbackAnonKey;
};

export const getActiveSupabaseClient = (): SupabaseClient => {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
};

export const supabase: SupabaseClient = getActiveSupabaseClient();
