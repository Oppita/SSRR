import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ===============================
// 🔍 DEBUG (solo desarrollo)
// ===============================
if (import.meta.env.DEV) {
  console.log("🔍 SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log(
    "🔍 SUPABASE KEY:",
    import.meta.env.VITE_SUPABASE_ANON_KEY ? "OK" : "MISSING"
  );
}

// ===============================
// 🔧 VARIABLES
// ===============================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ===============================
// ✅ VALIDACIÓN ROBUSTA
// ===============================
export const isSupabaseConfigured =
  typeof supabaseUrl === 'string' &&
  typeof supabaseAnonKey === 'string' &&
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes('falta-configurar');

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase no está configurado correctamente');
}

// ===============================
// 🔒 SINGLETON GLOBAL
// ===============================
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
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

// ===============================
// 🚀 EXPORT ÚNICO
// ===============================
export const supabase = getSupabase();

// ===============================
// 🧠 UTILIDAD SEGURA
// ===============================
export const safeGetSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  } catch {
    return null;
  }
};
