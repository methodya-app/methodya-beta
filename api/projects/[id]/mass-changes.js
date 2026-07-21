import { withCors, ApiError } from '../../_lib/cors.js';
import { requireAuth, requireAdmin } from '../../_lib/auth.js';
import { getDb } from '../../_lib/mongo.js';

// Cambios masivos (punto 17 del documento de flujo / 2.1.5 del beta):
// reemplazo de texto específico o por expresión regular, sobre uno o varios
// documentos del proyecto. Con preview:true solo calcula el impacto sin
// escribir en la base de datos.
export default withCors(async (req, res) => {
  if (req.method !== 'POST') throw new ApiError(405, 'Método no permitido');

  const auth = await requireAuth(req);
  requireAdmin(auth);
  const { id: project_id } = req.query;
  const { document_ids, mode, search, replace, preview } = req.body || {};

  if (!Array.isArray(document_ids) || document_ids.length === 0) {
    throw new ApiError(400, 'document_ids debe ser un arreglo no vacío');
  }
  if (!search) throw new ApiError(400, 'search es obligatorio');

  let matcher;
  try {
    matcher = mode === 'regex' ? new RegExp(search, 'g') : null;
  } catch {
    throw new ApiError(400, 'El patrón regex no es válido');
  }

  const db = await getDb();
  const results = [];

  for (const documentId of document_ids) {
    const record = await db.collection('document_data').findOne({ document_id: documentId });
    if (!record) {
      results.push({ document_id: documentId, changed_fields: [], found: false });
      continue;
    }

    const newValues = { ...record.values };
    const changedFields = [];

    for (const [key, val] of Object.entries(newValues)) {
      if (typeof val !== 'string') continue;
      const contains = mode === 'regex' ? matcher.test(val) : val.includes(search);
      if (mode === 'regex') matcher.lastIndex = 0;
      if (contains) {
        changedFields.push(key);
        if (!preview) {
          newValues[key] =
            mode === 'regex' ? val.replace(new RegExp(search, 'g'), replace ?? '') : val.split(search).join(replace ?? '');
        }
      }
    }

    if (changedFields.length && !preview) {
      await db
        .collection('document_data')
        .updateOne({ document_id: documentId }, { $set: { values: newValues, updated_at: new Date() } });
    }

    results.push({ document_id: documentId, changed_fields: changedFields, found: true });
  }

  return res.status(200).json({
    preview: !!preview,
    total_documentos: document_ids.length,
    documentos_con_coincidencias: results.filter((r) => r.changed_fields.length > 0).length,
    detalle: results,
  });
});
