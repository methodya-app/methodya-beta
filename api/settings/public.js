import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { getLanguageToolCredentials } from '../_lib/languagetool.js';

// Información NO sensible de Parámetros del servidor, visible para
// cualquier usuario autenticado (no solo Administrador). El frontend la usa
// para decidir si mostrar funciones que dependen de una integración
// configurada: el botón "Revisar ortografía" solo aparece si hay una cuenta
// de LanguageTool configurada, y spellcheck_submit_mode controla si al
// enviar un documento a la siguiente etapa se exige/advierte sobre posibles
// errores ortográficos.
export default withCors(async (req, res) => {
  if (req.method !== 'GET') throw new ApiError(405, 'Método no permitido');
  await requireAuth(req);

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('settings')
    .select('spellcheck_submit_mode')
    .eq('id', 1)
    .single();
  if (error) throw new ApiError(500, error.message);

  const credentials = await getLanguageToolCredentials();
  return res.status(200).json({
    languagetool_configured: !!credentials,
    spellcheck_submit_mode: credentials ? data.spellcheck_submit_mode || 'off' : 'off',
  });
});
