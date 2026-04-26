import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidString = (v: any): v is string =>
  typeof v === 'string' && v.trim().length > 0;

export const isSupabaseConfigured =
  isValidString(supabaseUrl) &&
  isValidString(supabaseAnonKey) &&
  !supabaseUrl.includes('falta-configurar');

export const supabaseUrl = supabaseUrl;

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no configurado');
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        // ⚠️ CRÍTICO: Desactivar lock de navegador que causa timeouts
        lock: undefined,
      },
      global: {
        headers: {
          'X-Client-Info': 'srr-app',
        },
      },
    });
  }

  return supabaseInstance;
};

export const supabase: SupabaseClient = (() => {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase no configurado. Usando cliente mock.');
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase no configurado') }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ 
          data: { subscription: { unsubscribe: () => {} } } 
        }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
        upsert: () => ({ data: null, error: null }),
      }),
    } as unknown as SupabaseClient;
  }
  return getSupabase();
})();

export const safeGetSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  } catch {
    return null;
  }
};
