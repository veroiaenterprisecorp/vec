import { createClient, SupabaseClient } from '@supabase/supabase-js';

const configuredEnvUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '');
const configuredEnvAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '');

// Project cruijnhylcdojbilzgwd is the user's project
export const DEFAULT_SUPABASE_URL = 'https://cruijnhylcdojbilzgwd.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydWlqbmh5bGNkb2piaWx6Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODE2NzIsImV4cCI6MjEwODA1NzY3Mn0.QQL0hq4Kzp01Hf7xfWDEDlCY9f-vyreYvze6tVD582k';

export type ConfigOrigin = 'vercel_env' | 'browser_storage' | 'default_project';

export const getSupabaseConfigOrigin = (): ConfigOrigin => {
  if (configuredEnvUrl && configuredEnvUrl.trim().startsWith('http')) {
    return 'vercel_env';
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('vec_supabase_url');
    if (saved && saved.trim().startsWith('http')) {
      return 'browser_storage';
    }
  }
  return 'default_project';
};

export const getSupabaseUrl = (): string => {
  // 1. If Vercel environment variable is injected at build time, it takes priority
  if (configuredEnvUrl && configuredEnvUrl.trim().startsWith('http')) {
    return configuredEnvUrl.trim();
  }
  // 2. If user saved custom credentials in browser local storage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('vec_supabase_url');
    if (saved && saved.trim().startsWith('http')) {
      return saved.trim();
    }
  }
  // 3. Fallback to default project URL
  return DEFAULT_SUPABASE_URL;
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
  return DEFAULT_SUPABASE_ANON_KEY;
};

// Singleton Client Instance to prevent multiple GoTrueClient warnings
let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export const getActiveSupabaseClient = (): SupabaseClient => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  cachedUrl = url;
  cachedKey = key;
  cachedClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });

  return cachedClient;
};

export const setManualSupabaseCredentials = (url: string, anonKey: string): void => {
  if (typeof window === 'undefined') return;
  if (url && url.trim().startsWith('http')) {
    localStorage.setItem('vec_supabase_url', url.trim());
  } else {
    localStorage.removeItem('vec_supabase_url');
  }
  if (anonKey && anonKey.trim().length > 20) {
    localStorage.setItem('vec_supabase_anon_key', anonKey.trim());
  } else {
    localStorage.removeItem('vec_supabase_anon_key');
  }

  // Invalidate cached client so it refreshes once
  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('vec-supabase-config-updated'));
};

// Singleton export: Proxy guarantees external modules always invoke the cached singleton
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getActiveSupabaseClient();
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});
