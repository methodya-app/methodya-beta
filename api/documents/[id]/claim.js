import { withCors, ApiError } from '../../_lib/cors.js';
import { requireAuth } from '../../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';
import { READ_ONLY_STATES, READ_ONLY_PROJECT_STATES } from '../../_lib/documentAccess.js';
import { stageRoleForEstado } from '../../_lib/groupAssignment.js';

// Permite que cualquier persona con el rol correspondiente se autoasigne un
// documento que está sin nadie asignado en la etapa de ese rol. No usa
// loadDocumentWithAccess porque esa función niega acceso a quien todavía no
// esté asignado — justo el caso que este endpoint necesita permitir.
export default withCors(async (req, res) => {
  if (req.method !== 'POST') throw new ApiError(405, 'Método no permitido');

  const auth = await requireAuth(req);
  const { id } = req.query;
  const admin = supabaseAdmin();

  const { data: document, error } = await admin
    .from('documents')
    .select('*, projects(id, estado)')
    .eq('id', id)
    .single();
  if (error || !document) throw new ApiError(404, 'Documento no encontrado');

  if (
    READ_ONLY_STATES.includes(document.estado) ||
    READ_ONLY_PROJECT_STATES.includes(document.projects?.estado)
  ) {
    throw new ApiError(423, 'El documento está en modo solo lectura');
  }

  const match = stageRoleForEstado(document.estado);
  if (!match) {
    throw new ApiError(409, `El documento en estado "${document.estado}" no admite auto-asignación`);
  }
  if (document[match.field]) {
    throw new ApiError(409, 'Este documento ya tiene a alguien asignado en esta etapa');
  }

  const hasRole = auth.projectRoles.some(
    (pr) => pr.project_id === document.project_id && pr.role === match.role
  );
  if (!hasRole && !auth.isAdmin) {
    throw new ApiError(403, `No tienes el rol "${match.role}" en este proyecto`);
  }

  const { data, error: updError } = await admin
    .from('documents')
    .update({ [match.field]: auth.profile.id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (updError) throw new ApiError(500, updError.message);

  await admin.from('document_history').insert({
    document_id: id,
    estado_anterior: document.estado,
    estado_nuevo: document.estado,
    actor_id: auth.profile.id,
    nota: `Autoasignado por ${auth.profile.nombre} ${auth.profile.apellido} como ${match.role}`,
  });

  return res.status(200).json({ document: data });
});
