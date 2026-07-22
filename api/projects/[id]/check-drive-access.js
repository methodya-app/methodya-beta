import { withCors, ApiError } from '../../_lib/cors.js';
import { requireAuth, requireAdmin } from '../../_lib/auth.js';
import { supabaseAdmin } from '../../_lib/supabaseAdmin.js';
import { getGoogleOAuthConfig } from '../../_lib/googleAuth.js';
import { extractDriveId, checkFolderWriteAccess, getFile } from '../../_lib/googleDrive.js';

// Botón "Probar conexión y permisos" del módulo Plantilla y vaciamiento:
// confirma que la cuenta de Google conectada puede leer la plantilla y
// escribir en la carpeta destino configuradas, antes de intentar un
// vaciamiento real.
export default withCors(async (req, res) => {
  if (req.method !== 'POST') throw new ApiError(405, 'Método no permitido');
  const auth = await requireAuth(req);
  requireAdmin(auth);

  const { id } = req.query;
  const admin = supabaseAdmin();
  const { data: project, error } = await admin
    .from('projects')
    .select('plantilla_url, drive_folder_url')
    .eq('id', id)
    .single();
  if (error) throw new ApiError(404, 'Proyecto no encontrado');

  const googleConfig = await getGoogleOAuthConfig();
  if (!googleConfig?.refreshToken) {
    throw new ApiError(
      400,
      'No hay una cuenta de Google conectada todavía (Parámetros del servidor → Conectar cuenta de Google).'
    );
  }

  const folderId = extractDriveId(project.drive_folder_url);
  if (!folderId) {
    throw new ApiError(400, 'Configura primero la carpeta destino de Google Drive en este proyecto.');
  }

  const folderCheck = await checkFolderWriteAccess(folderId);

  let templateCheck = null;
  const templateId = extractDriveId(project.plantilla_url);
  if (templateId) {
    try {
      const file = await getFile(templateId);
      templateCheck = { ok: true, name: file.name };
    } catch (err) {
      templateCheck = { ok: false, error: err.message };
    }
  }

  return res.status(200).json({
    connected_email: googleConfig.connectedEmail,
    folder: folderCheck,
    template: templateCheck,
  });
});
