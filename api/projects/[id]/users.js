import { withCors, ApiError } from '../../_lib/cors.js';
import { requireAuth, requireAdmin, roleInProject } from '../../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';

export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  const admin = supabaseAdmin();
  const { id } = req.query;

  if (req.method === 'GET') {
    // Cualquier miembro del proyecto puede listar (se usa para @mencionar en
    // comentarios y para los selectores de asignación del Administrador).
    if (!roleInProject(auth, id)) throw new ApiError(403, 'Sin acceso al proyecto');
    const { data, error } = await admin
      .from('project_users')
      .select('id, role, profiles(id, nombre, apellido, email)')
      .eq('project_id', id);
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ project_users: data });
  }

  if (req.method === 'POST') {
    requireAdmin(auth);
    const { user_id, role } = req.body || {};
    const validRoles = ['Creador Experto', 'Revisor Pedagógico', 'Revisor de Estilo'];
    if (!user_id || !validRoles.includes(role)) {
      throw new ApiError(400, `role debe ser uno de: ${validRoles.join(', ')}`);
    }
    const { data, error } = await admin
      .from('project_users')
      .insert({ project_id: id, user_id, role })
      .select('id, role, profiles(id, nombre, apellido, email)')
      .single();
    if (error) throw new ApiError(500, error.message);
    return res.status(201).json({ project_user: data });
  }

  if (req.method === 'DELETE') {
    requireAdmin(auth);
    const { project_user_id } = req.body || {};
    if (!project_user_id) throw new ApiError(400, 'project_user_id es obligatorio');
    const { error } = await admin.from('project_users').delete().eq('id', project_user_id);
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ ok: true });
  }

  throw new ApiError(405, 'Método no permitido');
});
