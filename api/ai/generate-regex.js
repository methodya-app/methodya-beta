import { withCors, ApiError } from '../_lib/cors.js';
import { requireAuth } from '../_lib/auth.js';
import { generateRegexFromDescription } from '../_lib/gemini.js';

// Traduce una descripción en lenguaje natural a una expresión regular,
// usada por el diseñador de formularios (validación de campo) y por el
// módulo de Validaciones Globales del proyecto.
export default withCors(async (req, res) => {
  if (req.method !== 'POST') throw new ApiError(405, 'Método no permitido');
  await requireAuth(req); // cualquier usuario autenticado puede usarlo al diseñar

  const { description } = req.body || {};
  const result = await generateRegexFromDescription(description);
  return res.status(200).json(result);
});
