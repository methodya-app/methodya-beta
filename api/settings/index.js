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
      },
    });
  }

  if (req.method === 'PUT') {
    const { gemini_api_key, backend_endpoint } = req.body || {};
    const updates = { updated_by: auth.profile.id, updated_at: new Date().toISOString() };
    if (gemini_api_key) updates.gemini_api_key = gemini_api_key;
    if (backend_endpoint !== undefined) updates.backend_endpoint = backend_endpoint;

    const { data, error } = await admin
      .from('settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ ok: true, settings: { ...data, gemini_api_key: undefined } });
  }

  throw new ApiError(405, 'Método no permitido');
});
