import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cruijnhylcdojbilzgwd.supabase.co';
const defaultAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydWlqbmh5bGNkb2piaWx6Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODE2NzIsImV4cCI6MjEwODA1NzY3Mn0.QQL0hq4Kzp01Hf7xfWDEDlCY9f-vyreYvze6tVD582k';

export const getSupabaseUrl = (): string => {
  return localStorage.getItem('vec_supabase_url') || defaultUrl;
};

export const getSupabaseAnonKey = (): string => {
  return localStorage.getItem('vec_supabase_anon_key') || defaultAnonKey;
};

export const supabase: SupabaseClient = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);
