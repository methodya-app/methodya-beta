import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth, requireAdmin } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { getDb, toObjectId } from '../_lib/mongo.js';
import { loadDocumentWithAccess } from '../_lib/documentAccess.js';

export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  const { id } = req.query;

  if (req.method === 'GET') {
    const access = await loadDocumentWithAccess(auth, id);
    const db = await getDb();
    const form = await db.collection('forms').findOne({ _id: toObjectId(access.document.form_id) });
    const data = await db.collection('document_data').findOne({ document_id: id });

    return res.status(200).json({
      document: access.document,
      form,
      values: data?.values || {},
      comments: data?.comments || [],
      vaciado_resultado: data?.vaciado_resultado || null,
      access: {
        role: access.projectRole,
        is_creador: access.isCreador,
        is_revisor_pedagogico: access.isRevisorPedagogico,
        is_revisor_estilo: access.isRevisorEstilo,
        is_read_only: access.isReadOnly,
      },
    });
  }

  if (req.method === 'PUT') {
    requireAdmin(auth);
    const admin = supabaseAdmin();
    const allowed = [
      'document_type_id',
      'creador_id',
      'revisor_pedagogico_id',
      'revisor_estilo_id',
      'estado',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await admin
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ document: data });
  }

  throw new ApiError(405, 'Método no permitido');
});
