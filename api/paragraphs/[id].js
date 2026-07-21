import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth, requireAdmin } from '../_lib/auth.js';
import { getDb, toObjectId } from '../_lib/mongo.js';

export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  requireAdmin(auth);
  const db = await getDb();
  const oid = toObjectId(req.query.id);
  if (!oid) throw new ApiError(400, 'id inválido');

  if (req.method === 'PUT') {
    const { texto, tags } = req.body || {};
    const updates = {};
    if (texto !== undefined) updates.texto = texto;
    if (tags !== undefined) updates.tags = tags;
    await db.collection('paragraphs').updateOne({ _id: oid }, { $set: updates });
    const paragraph = await db.collection('paragraphs').findOne({ _id: oid });
    return res.status(200).json({ paragraph });
  }

  if (req.method === 'DELETE') {
    await db.collection('paragraphs').deleteOne({ _id: oid });
    return res.status(200).json({ ok: true });
  }

  throw new ApiError(405, 'Método no permitido');
});
