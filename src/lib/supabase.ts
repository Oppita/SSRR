import { createClient } from '@supabase/supabase-js';

// DEBUG
console.log("🔍 SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "🔍 SUPABASE KEY:",
  import.meta.env.VITE_SUPABASE_ANON_KEY ? "OK" : "MISSING"
);

// Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación robusta
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('falta-configurar');

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase no está configurado correctamente');
}

// 🔒 Singleton REAL
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();
