import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth } from '../_lib/auth.js';
import { checkSpelling } from '../_lib/languagetool.js';

// Revisa ortografía/gramática de un texto (LanguageTool), usado por el
// botón "Revisar ortografía" en los campos de texto libre del formulario.
// Si en Parámetros del servidor hay una cuenta Premium de LanguageTool
// configurada, se usa esa cuenta; si no, cae a la API pública gratuita.
export default withCors(async (req, res) => {
  if (req.method !== 'POST') throw new ApiError(405, 'Método no permitido');
  await requireAuth(req);

  const { text } = req.body || {};
  const result = await checkSpelling(text);
  return res.status(200).json(result);
});
