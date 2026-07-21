import { withCors, ApiError } from '../../_lib/cors.js';
import { requireAuth } from '../../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';
import { getDb } from '../../_lib/mongo.js';
import { loadDocumentWithAccess } from '../../_lib/documentAccess.js';

// Módulo de vaciamiento (punto 2.1.4 del documento de la beta).
// FASE 1 / SIMULACIÓN: no llama a la API real de Google Slides/Docs (eso
// requiere credenciales OAuth de Google Cloud, fuera de alcance de esta
// primera versión). En su lugar reproduce el mismo motor de reemplazo que
// tendría la integración real: busca {{variable}} en la plantilla de texto
// configurada en el proyecto y la sustituye por el valor capturado en el
// formulario, dejando el resultado guardado y disponible para copiar/descargar.
export default withCors(async (req, res) => {
  if (req.method !== 'POST') throw new ApiError(405, 'Método no permitido');

  const auth = await requireAuth(req);
  const { id } = req.query;
  const access = await loadDocumentWithAccess(auth, id);

  // Según el documento: el botón "Vaciar" lo ve el Administrador (desde el
  // listado de documentos) y el Revisor de Estilo (desde la revisión).
  if (!auth.isAdmin && !access.isRevisorEstilo) {
    throw new ApiError(403, 'Solo el Administrador o el Revisor de Estilo pueden vaciar el documento');
  }

  const template = access.document.projects?.plantilla_texto_simulado;
  if (!template) {
    throw new ApiError(
      400,
      'El proyecto no tiene una plantilla de texto simulada configurada (Módulo de Selección de plantilla)'
    );
  }

  const db = await getDb();
  const data = await db.collection('document_data').findOne({ document_id: id });
  const values = data?.values || {};

  let resultado = template;
  for (const [key, val] of Object.entries(values)) {
    const text = Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? '' : String(val ?? '');
    resultado = resultado.replaceAll(`{{${key}}}`, text);
  }

  await db.collection('document_data').updateOne(
    { document_id: id },
    { $set: { vaciado_resultado: resultado, vaciado_at: new Date() } },
    { upsert: true }
  );

  const admin = supabaseAdmin();
  await admin.from('documents').update({ vaciado_at: new Date().toISOString() }).eq('id', id);

  return res.status(200).json({ vaciado_resultado: resultado });
});
