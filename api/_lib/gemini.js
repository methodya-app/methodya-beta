import { supabaseAdmin } from './supabaseAdmin.js';
import { ApiError } from './cors.js';

// Heurística offline: se usa como respaldo si no hay API key configurada o
// si la llamada a Gemini falla, para que el módulo nunca deje de funcionar.
function heuristicRegex(ruleText) {
  const text = ruleText.toLowerCase();
  if (text.includes('correo') || text.includes('email')) {
    return '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
  }
  if (text.includes('solo letras') || text.includes('mayúscula') || text.includes('mayuscula')) {
    return '^[A-ZÁÉÍÓÚÑ][a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$';
  }
  if (text.includes('número') || text.includes('numero') || text.includes('entero')) {
    return '^\\d+$';
  }
  if (text.includes('fecha')) {
    return '^\\d{4}-\\d{2}-\\d{2}$';
  }
  if (text.includes('url') || text.includes('enlace') || text.includes('link')) {
    return '^https?:\\/\\/[\\w.-]+(\\/\\S*)?$';
  }
  return '^.{1,}$';
}

// Lee la clave de Gemini: primero la tabla settings (editable en caliente por
// el Administrador), y si no existe usa la variable de entorno de Vercel.
async function resolveGeminiKey() {
  try {
    const admin = supabaseAdmin();
    const { data } = await admin.from('settings').select('gemini_api_key').eq('id', 1).single();
    if (data?.gemini_api_key) return data.gemini_api_key;
  } catch {
    // ignore, cae a variable de entorno
  }
  return process.env.GEMINI_API_KEY || null;
}

// Convierte una descripción en lenguaje natural en una expresión regular,
// usando Google Gemini. Devuelve { pattern, explanation, source }.
export async function generateRegexFromDescription(ruleText) {
  if (!ruleText || !ruleText.trim()) {
    throw new ApiError(400, 'Debes describir la regla de validación');
  }

  const apiKey = await resolveGeminiKey();
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return {
      pattern: heuristicRegex(ruleText),
      explanation: 'Generado con heurística local (no hay clave de Gemini configurada).',
      source: 'heuristic',
    };
  }

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    'Eres un asistente experto de la plataforma editorial educativa METHODYA. ' +
                    'Analiza la siguiente regla de validación en lenguaje natural y tradúcela a ' +
                    'una expresión regular estándar (compatible con JavaScript RegExp), en texto ' +
                    `plano, sin barras iniciales ni finales. REGLA: "${ruleText}". ` +
                    'Responde ÚNICAMENTE un JSON válido (sin markdown, sin texto extra) con el ' +
                    'formato: {"pattern": "expresion_regular", "explanation": "explicación breve"}',
                },
              ],
            },
          ],
        }),
      }
    );

    if (!resp.ok) throw new Error(`Gemini respondió ${resp.status}`);
    const result = await resp.json();
    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed.pattern) throw new Error('Respuesta de Gemini sin patrón');

    // Validar que el patrón compile antes de devolverlo
    new RegExp(parsed.pattern);

    return {
      pattern: parsed.pattern,
      explanation: parsed.explanation || '',
      source: 'gemini',
    };
  } catch (err) {
    console.error('Error generando regex con Gemini, usando heurística:', err.message);
    return {
      pattern: heuristicRegex(ruleText),
      explanation: `Generado con heurística local (falló Gemini: ${err.message}).`,
      source: 'heuristic',
    };
  }
}
