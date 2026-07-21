import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth, requireAdmin } from '../_lib/auth.js';
import { getDb } from '../_lib/mongo.js';

// Biblioteca global de párrafos predefinidos, filtrable por tags.
export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  const db = await getDb();

  if (req.method === 'GET') {
    const { tag } = req.query;
    const filter = tag ? { tags: tag } : {};
    const paragraphs = await db
      .collection('paragraphs')
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();
    return res.status(200).json({ paragraphs });
  }

  if (req.method === 'POST') {
    requireAdmin(auth);
    const { titulo, texto, tags } = req.body || {};
    if (!titulo) throw new ApiError(400, 'titulo es obligatorio');
    if (!texto) throw new ApiError(400, 'texto es obligatorio');
    const doc = {
      titulo,
      texto,
      tags: Array.isArray(tags) ? tags : [],
      created_by: auth.profile.id,
      created_at: new Date(),
    };
    const result = await db.collection('paragraphs').insertOne(doc);
    return res.status(201).json({ paragraph: { ...doc, _id: result.insertedId } });
  }

  throw new ApiError(405, 'Método no permitido');
});
