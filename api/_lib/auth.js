import { supabaseAdmin } from './supabaseAdmin.js';
import { ApiError } from './cors.js';

// Extrae y valida el JWT de Supabase enviado como "Authorization: Bearer <token>".
// Devuelve { user, profile, isAdmin, projectRoles: [{project_id, role}] }
export async function requireAuth(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) throw new ApiError(401, 'No se proporcionó token de autenticación');

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) throw new ApiError(401, 'Sesión inválida o expirada');

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) throw new ApiError(401, 'Perfil de usuario no encontrado');
  if (!profile.activo) throw new ApiError(403, 'Usuario suspendido');

  const { data: projectRoles } = await admin
    .from('project_users')
    .select('project_id, role')
    .eq('user_id', profile.id);

  return {
    user: data.user,
    profile,
    isAdmin: !!profile.is_admin,
    projectRoles: projectRoles || [],
  };
}

export function requireAdmin(auth) {
  if (!auth.isAdmin) throw new ApiError(403, 'Requiere permisos de Administrador');
}

// Verifica que el usuario tenga alguno de los roles indicados en ese proyecto
// (los administradores siempre tienen acceso).
export function requireProjectRole(auth, projectId, roles = []) {
  if (auth.isAdmin) return true;
  const has = auth.projectRoles.some(
    (pr) => pr.project_id === projectId && roles.includes(pr.role)
  );
  if (!has) throw new ApiError(403, 'No tienes el rol requerido en este proyecto');
  return true;
}

export function roleInProject(auth, projectId) {
  if (auth.isAdmin) return 'Administrador';
  const pr = auth.projectRoles.find((p) => p.project_id === projectId);
  return pr ? pr.role : null;
}
