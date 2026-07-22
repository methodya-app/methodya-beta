import { withCors, ApiError } from '../../_lib/cors.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';
import { exchangeGoogleAuthCode } from '../../_lib/googleAuth.js';

function redirectToParametros(res, query) {
  const origin = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
  const params = new URLSearchParams(query).toString();
  res.writeHead(302, { Location: `${origin}/#/admin/parametros?${params}` });
  res.end();
}

// Google redirige aquí (navegación normal del navegador, sin nuestro token
// de sesión) después de que el Administrador acepta el consentimiento. No
// requiere requireAuth: se valida con el "state" de un solo uso generado
// en /api/auth/google/start.
export default withCors(async (req, res) => {
  if (req.method !== 'GET') throw new ApiError(405, 'Método no permitido');

  const { code, state, error: googleError } = req.query || {};
  const admin = supabaseAdmin();

  if (googleError) {
    return redirectToParametros(res, { google: 'error', message: `Google: ${googleError}` });
  }
  if (!code || !state) {
    return redirectToParametros(res, { google: 'error', message: 'Falta code o state en la respuesta de Google' });
  }

  const { data: settings } = await admin
    .from('settings')
    .select('google_oauth_pending_state')
    .eq('id', 1)
    .single();

  if (!settings?.google_oauth_pending_state || settings.google_oauth_pending_state !== state) {
    return redirectToParametros(res, { google: 'error', message: 'state inválido o expirado, intenta de nuevo' });
  }

  try {
    const { refreshToken, email } = await exchangeGoogleAuthCode(code);
    await admin
      .from('settings')
      .update({
        google_oauth_refresh_token: refreshToken,
        google_oauth_connected_email: email,
        google_oauth_pending_state: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    return redirectToParametros(res, { google: 'connected' });
  } catch (err) {
    await admin.from('settings').update({ google_oauth_pending_state: null }).eq('id', 1);
    return redirectToParametros(res, { google: 'error', message: err.message || 'No se pudo conectar' });
  }
});
