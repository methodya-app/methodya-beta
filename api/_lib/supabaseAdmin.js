import { createClient } from '@supabase/supabase-js';

let _admin = null;
let _anon = null;

// Cliente con Service Role Key: acceso total, solo se usa en el backend.
export function supabaseAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _admin;
}

// Cliente con anon key: solo se usa para validar credenciales en /auth/login
// (signInWithPassword) y para verificar el JWT de un usuario ya logueado.
export function supabaseAnon() {
  if (!_anon) {
    _anon = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _anon;
}
