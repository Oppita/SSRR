import { createClient } from '@supabase/supabase-js';

// DEBUG (solo en desarrollo)
console.log("🔍 SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "🔍 SUPABASE KEY:",
  import.meta.env.VITE_SUPABASE_ANON_KEY ? "OK" : "MISSING"
);

// Variables
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('falta-configurar');

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase no está configurado correctamente');
}

// Cliente
export const supabase = createClient(
  supabaseUrl || 'https://zudemzpnldxhiywmwhpn.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1ZGVtenBubGR4aGl5d213aHBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjk0MjUsImV4cCI6MjA4OTcwNTQyNX0.MGFSXYuGGgwHgANWefqGJP1uLmv0VpqD0gLQM3IWw-U'
);
