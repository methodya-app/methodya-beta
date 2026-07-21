import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth, requireAdmin } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  requireAdmin(auth);
  const admin = supabaseAdmin();
  const { id } = req.query;

  if (req.method === 'DELETE') {
    const { error } = await admin.from('global_validations').delete().eq('id', id);
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'PUT') {
    const { activo } = req.body || {};
    const { data, error } = await admin
      .from('global_validations')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ validation: data });
  }

  throw new ApiError(405, 'Método no permitido');
});
