import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth, requireAdmin } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  const admin = supabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await admin
      .from('document_types')
      .select('*')
      .order('nombre');
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ document_types: data });
  }

  if (req.method === 'POST') {
    requireAdmin(auth);
    const { nombre } = req.body || {};
    if (!nombre) throw new ApiError(400, 'nombre es obligatorio');
    const { data, error } = await admin
      .from('document_types')
      .insert({ nombre })
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    return res.status(201).json({ document_type: data });
  }

  if (req.method === 'DELETE') {
    requireAdmin(auth);
    const { id } = req.body || {};
    if (!id) throw new ApiError(400, 'id es obligatorio');
    const { error } = await admin.from('document_types').update({ activo: false }).eq('id', id);
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ ok: true });
  }

  throw new ApiError(405, 'Método no permitido');
});
