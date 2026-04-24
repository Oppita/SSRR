import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('falta-configurar');

if (!isSupabaseConfigured) {
  console.warn('Supabase no está configurado. La persistencia en la nube y la autenticación estarán desactivadas.');
}

export const supabase = createClient(
  supabaseUrl || 'https://falta-configurar-url.supabase.co', 
  supabaseAnonKey || 'falta-configurar-key'
);
