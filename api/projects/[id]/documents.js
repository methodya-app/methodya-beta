import { withCors, ApiError } from '../../_lib/cors.js';
import { requireAuth, requireAdmin, roleInProject } from '../../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';

export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  const admin = supabaseAdmin();
  const { id: project_id } = req.query;

  const role = roleInProject(auth, project_id);
  if (!role) throw new ApiError(403, 'Sin acceso al proyecto');

  if (req.method === 'GET') {
    let query = admin
      .from('documents')
      .select(
        'id, codigo, estado, form_id, document_type_id, creador_id, revisor_pedagogico_id, revisor_estilo_id, vaciado_at, created_at, updated_at,' +
          'creador:creador_id(nombre, apellido, email),' +
          'revisor_pedagogico:revisor_pedagogico_id(nombre, apellido, email),' +
          'revisor_estilo:revisor_estilo_id(nombre, apellido, email),' +
          'document_types(nombre)'
      )
      .eq('project_id', project_id)
      .order('created_at', { ascending: false });

    // Filtra según el rol: cada perfil solo ve los documentos que le
    // corresponden por asignación y/o etapa del flujo.
    if (role === 'Creador Experto') {
      query = query.eq('creador_id', auth.profile.id);
    } else if (role === 'Revisor Pedagógico') {
      query = query.eq('revisor_pedagogico_id', auth.profile.id);
    } else if (role === 'Revisor de Estilo') {
      query = query.eq('revisor_estilo_id', auth.profile.id);
    }
    // Administrador ve todos los documentos del proyecto.

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ documents: data, my_role: role });
  }

  if (req.method === 'POST') {
    requireAdmin(auth);
    const {
      codigo,
      form_id,
      document_type_id,
      creador_id,
      revisor_pedagogico_id,
      revisor_estilo_id,
    } = req.body || {};

    if (!codigo || !form_id) throw new ApiError(400, 'codigo y form_id son obligatorios');

    const { data, error } = await admin
      .from('documents')
      .insert({
        project_id,
        codigo,
        form_id,
        document_type_id: document_type_id || null,
        creador_id: creador_id || null,
        revisor_pedagogico_id: revisor_pedagogico_id || null,
        revisor_estilo_id: revisor_estilo_id || null,
        estado: 'Pendiente',
      })
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);

    await admin.from('document_history').insert({
      document_id: data.id,
      estado_anterior: null,
      estado_nuevo: 'Pendiente',
      actor_id: auth.profile.id,
      nota: 'Documento creado',
    });

    return res.status(201).json({ document: data });
  }

  throw new ApiError(405, 'Método no permitido');
});
