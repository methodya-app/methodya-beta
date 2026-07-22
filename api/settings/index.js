import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth, requireAdmin } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

// Módulo de Parámetros del Servidor (punto 2.3 del documento de la beta):
// el Administrador puede cambiar en caliente la clave de la API de IA y el
// endpoint del backend, sin necesidad de redeploy.
export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  requireAdmin(auth);
  const admin = supabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await admin.from('settings').select('*').eq('id', 1).single();
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({
      settings: {
        ...data,
        gemini_api_key: data.gemini_api_key ? '••••••••' + data.gemini_api_key.slice(-4) : null,
        languagetool_api_key: data.languagetool_api_key
          ? '••••••••' + data.languagetool_api_key.slice(-4)
          : null,
        google_oauth_client_secret: data.google_oauth_client_secret
          ? '••••••••' + data.google_oauth_client_secret.slice(-4)
          : null,
        google_oauth_connected: !!data.google_oauth_refresh_token,
        google_oauth_refresh_token: undefined,
      },
    });
  }

  if (req.method === 'PUT') {
    const {
      gemini_api_key,
      backend_endpoint,
      languagetool_username,
      languagetool_api_key,
      spellcheck_submit_mode,
      google_oauth_client_id,
      google_oauth_client_secret,
      google_disconnect,
    } = req.body || {};
    const updates = { updated_by: auth.profile.id, updated_at: new Date().toISOString() };
    if (gemini_api_key) updates.gemini_api_key = gemini_api_key;
    if (backend_endpoint !== undefined) updates.backend_endpoint = backend_endpoint;
    if (languagetool_username !== undefined) updates.languagetool_username = languagetool_username;
    if (languagetool_api_key) updates.languagetool_api_key = languagetool_api_key;
    if (spellcheck_submit_mode !== undefined) {
      if (!['off', 'warn', 'block'].includes(spellcheck_submit_mode)) {
        throw new ApiError(400, 'spellcheck_submit_mode inválido');
      }
      updates.spellcheck_submit_mode = spellcheck_submit_mode;
    }
    if (google_oauth_client_id !== undefined) updates.google_oauth_client_id = google_oauth_client_id;
    if (google_oauth_client_secret) updates.google_oauth_client_secret = google_oauth_client_secret;
    if (google_disconnect) {
      updates.google_oauth_refresh_token = null;
      updates.google_oauth_connected_email = null;
    }

    const { data, error } = await admin
      .from('settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({
      ok: true,
      settings: {
        ...data,
        gemini_api_key: undefined,
        languagetool_api_key: undefined,
        google_oauth_client_secret: undefined,
        google_oauth_refresh_token: undefined,
      },
    });
  }

  throw new ApiError(405, 'Método no permitido');
});
