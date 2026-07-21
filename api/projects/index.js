import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth, requireAdmin } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

function genCodigo(nombre) {
  const slug = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos/diacriticos
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .slice(0, 12);
  return `${slug}-${Date.now().toString().slice(-5)}`;
}

export default withCors(async (req, res) => {
  const auth = await requireAuth(req);
  const admin = supabaseAdmin();

  if (req.method === 'GET') {
    let query = admin.from('projects').select('*').order('created_at', { ascending: false });
    if (!auth.isAdmin) {
      const projectIds = [...new Set(auth.projectRoles.map((pr) => pr.project_id))];
      if (projectIds.length === 0) return res.status(200).json({ projects: [] });
      query = query.in('id', projectIds);
    }
    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json({ projects: data });
  }

  if (req.method === 'POST') {
    requireAdmin(auth);
    const { nombre, fecha_inicio, fecha_fin, plantilla_tipo, plantilla_url, drive_folder_url, plantilla_texto_simulado } =
      req.body || {};
    if (!nombre) throw new ApiError(400, 'El nombre del proyecto es obligatorio');

    const { data, error } = await admin
      .from('projects')
      .insert({
        nombre,
        codigo: genCodigo(nombre),
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        plantilla_tipo: plantilla_tipo || null,
        plantilla_url: plantilla_url || null,
        drive_folder_url: drive_folder_url || null,
        plantilla_texto_simulado: plantilla_texto_simulado || null,
        estado: 'Pendiente',
        created_by: auth.profile.id,
      })
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    return res.status(201).json({ project: data });
  }

  throw new ApiError(405, 'Método no permitido');
});
