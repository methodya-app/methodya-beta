import { withCors, ApiError } from '../../_lib/cors.js';
import { requireAuth, requireAdmin, roleInProject } from '../../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';

export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  const admin = supabaseAdmin();
  const { id } = req.query;

  if (req.method === 'GET') {
    if (!roleInProject(auth, id)) throw new ApiError(403, 'Sin acceso al proyecto');
    const { data, error } = await admin
      .from('global_validations')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ validations: data });
  }

  if (req.method === 'POST') {
    requireAdmin(auth);
    const { descripcion, pattern, mode } = req.body || {};
    if (!descripcion || !pattern) throw new ApiError(400, 'descripcion y pattern son obligatorios');
    try {
      new RegExp(pattern);
    } catch {
      throw new ApiError(400, 'El patrón regex no es válido');
    }
    const { data, error } = await admin
      .from('global_validations')
      .insert({
        project_id: id,
        descripcion,
        pattern,
        mode: mode === 'must_match' ? 'must_match' : 'must_not_match',
        created_by: auth.profile.id,
      })
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    return res.status(201).json({ validation: data });
  }

  throw new ApiError(405, 'Método no permitido');
});
