import { randomBytes } from 'node:crypto';
import { withCors, ApiError } from '../../_lib/cors.js';
import { requireAuth, requireAdmin } from '../../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';
import { generateGoogleAuthUrl } from '../../_lib/googleAuth.js';

// Botón "Conectar cuenta de Google" en Parámetros del servidor: genera la
// URL del consentimiento de Google (con un "state" de un solo uso para
// evitar que el callback acepte códigos de terceros) y la devuelve para
// que el frontend la abra en una pestaña nueva.
export default withCors(async (req, res) => {
  if (req.method !== 'GET') throw new ApiError(405, 'Método no permitido');
  const auth = await requireAuth(req);
  requireAdmin(auth);

  const state = randomBytes(24).toString('hex');
  const admin = supabaseAdmin();
  const { error } = await admin
    .from('settings')
    .update({ google_oauth_pending_state: state })
    .eq('id', 1);
  if (error) throw new ApiError(500, error.message);

  const url = await generateGoogleAuthUrl(state);
  return res.status(200).json({ url });
});
