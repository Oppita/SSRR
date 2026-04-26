import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ===============================
// 🔧 ENV CONFIG
// ===============================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ===============================
// 🔍 VALIDACIÓN ESTRICTA
// ===============================
const isValidString = (v: any): v is string =>
  typeof v === 'string' && v.trim().length > 0;

export const isSupabaseConfigured =
  isValidString(supabaseUrl) &&
  isValidString(supabaseAnonKey) &&
  !supabaseUrl.includes('falta-configurar');

// ===============================
// 🚨 ERROR CONTROLADO
// ===============================
const throwConfigError = () => {
  throw new Error(`
❌ SUPABASE NO CONFIGURADO

Debes definir en tu archivo .env:

VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

Ejemplo:
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

`);
};

// ===============================
// 🔒 SINGLETON
// ===============================
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!isSupabaseConfigured) {
    throwConfigError();
  }

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
// 🚀 EXPORT PRINCIPAL
// ===============================
export const supabase: SupabaseClient = (() => {
  if (!isSupabaseConfigured) {
    // 🔁 MODO SEGURO: mock mínimo para no romper la app
    console.warn('⚠️ Supabase no configurado. Usando cliente mock.');

    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase no configurado') }),
        signOut: async () => ({ error: null }),
      },
    } as unknown as SupabaseClient;
  }

  return getSupabase();
})();

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

// ===============================
// 🔍 DEBUG (solo dev)
// ===============================
if (import.meta.env.DEV) {
  console.log("🔍 SUPABASE URL:", supabaseUrl);
  console.log("🔍 SUPABASE KEY:", supabaseAnonKey ? "OK" : "MISSING");
  console.log("🔍 CONFIG STATUS:", isSupabaseConfigured ? "VALID" : "INVALID");
}
