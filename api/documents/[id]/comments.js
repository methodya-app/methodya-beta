import { randomUUID } from 'node:crypto';
import { withCors, ApiError } from '../../_lib/cors.js';
import { requireAuth } from '../../_lib/auth.js';
import { getDb } from '../../_lib/mongo.js';
import { loadDocumentWithAccess } from '../../_lib/documentAccess.js';

// Comentarios estilo Word/Google Docs sobre un campo específico del
// documento, con posibilidad de etiquetar (@mencionar) a otro usuario y de
// marcarlos como resueltos.
export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  const { id } = req.query;
  const access = await loadDocumentWithAccess(auth, id);
  const db = await getDb();

  if (req.method === 'GET') {
    const data = await db.collection('document_data').findOne({ document_id: id });
    return res.status(200).json({ comments: data?.comments || [] });
  }

  if (req.method === 'POST') {
    const { field_id, text, mentions } = req.body || {};
    if (!field_id || !text) throw new ApiError(400, 'field_id y text son obligatorios');

    const comment = {
      id: randomUUID(),
      field_id,
      author_id: auth.profile.id,
      author_nombre: `${auth.profile.nombre} ${auth.profile.apellido}`,
      text,
      mentions: Array.isArray(mentions) ? mentions : [],
      resolved: false,
      created_at: new Date(),
    };

    await db.collection('document_data').updateOne(
      { document_id: id },
      {
        $push: { comments: comment },
        $setOnInsert: { document_id: id, form_id: access.document.form_id, values: {} },
      },
      { upsert: true }
    );

    return res.status(201).json({ comment });
  }

  if (req.method === 'PUT') {
    // Marcar como resuelto (el creador o quien fue etiquetado puede resolver).
    const { comment_id, resolved } = req.body || {};
    if (!comment_id) throw new ApiError(400, 'comment_id es obligatorio');

    await db.collection('document_data').updateOne(
      { document_id: id, 'comments.id': comment_id },
      { $set: { 'comments.$.resolved': !!resolved } }
    );

    return res.status(200).json({ ok: true });
  }

  throw new ApiError(405, 'Método no permitido');
});
