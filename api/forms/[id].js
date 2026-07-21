import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth, requireAdmin, roleInProject } from '../_lib/auth.js';
import { getDb, toObjectId } from '../_lib/mongo.js';
import { findFieldsMissingCustomMessage } from '../_lib/validation.js';

export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  const db = await getDb();
  const oid = toObjectId(req.query.id);
  if (!oid) throw new ApiError(400, 'id inválido');

  if (req.method === 'GET') {
    const form = await db.collection('forms').findOne({ _id: oid });
    if (!form) throw new ApiError(404, 'Formulario no encontrado');
    if (!roleInProject(auth, form.project_id)) throw new ApiError(403, 'Sin acceso al proyecto');
    return res.status(200).json({ form });
  }

  if (req.method === 'PUT') {
    requireAdmin(auth);
    const { titulo, descripcion, document_type_id, sections } = req.body || {};
    const updates = { updated_at: new Date() };
    if (titulo !== undefined) updates.titulo = titulo;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (document_type_id !== undefined) updates.document_type_id = document_type_id;
    if (sections !== undefined) {
      const missing = findFieldsMissingCustomMessage(sections.flatMap((s) => s.fields || []));
      if (missing.length > 0) {
        throw new ApiError(
          422,
          `Falta el mensaje de error personalizado en: ${missing.map((f) => f.label).join(', ')}`
        );
      }
      updates.sections = sections;
    }

    await db.collection('forms').updateOne({ _id: oid }, { $set: updates });
    const form = await db.collection('forms').findOne({ _id: oid });
    return res.status(200).json({ form });
  }

  if (req.method === 'DELETE') {
    requireAdmin(auth);
    await db.collection('forms').deleteOne({ _id: oid });
    return res.status(200).json({ ok: true });
  }

  throw new ApiError(405, 'Método no permitido');
});
