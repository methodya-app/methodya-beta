import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

export default withCors(async (req, res) => {
  if (req.method !== 'GET') throw new ApiError(405, 'Método no permitido');

  const auth = await requireAuth(req);
  const admin = supabaseAdmin();
  const { data: projectRoles } = await admin
    .from('project_users')
    .select('project_id, role, projects(nombre, codigo, estado)')
    .eq('user_id', auth.profile.id);

  res.status(200).json({
    profile: auth.profile,
    is_admin: auth.isAdmin,
    project_roles: projectRoles || [],
  });
});
