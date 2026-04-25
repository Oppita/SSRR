import { createClient } from '@supabase/supabase-js';

// DEBUG (solo desarrollo)
console.log("🔍 SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "🔍 SUPABASE KEY:",
  import.meta.env.VITE_SUPABASE_ANON_KEY ? "OK" : "MISSING"
);

// Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('falta-configurar');

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase no está configurado correctamente');
}

// 🔒 SINGLETON GLOBAL (CRÍTICO)
let supabaseInstance: any = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
};

// ✅ EXPORT ÚNICO
export const supabase = getSupabase();
