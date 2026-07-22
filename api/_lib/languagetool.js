import { supabaseAdmin } from './supabaseAdmin.js';
import { ApiError } from './cors.js';

// Lee las credenciales de LanguageTool Premium: primero la tabla settings
// (editable en caliente por el Administrador), y si no existe usa las
// variables de entorno de Vercel. Devuelve null si no hay ninguna
// configurada (el frontend usa esto para decidir si mostrar el botón
// "Revisar ortografía").
export async function getLanguageToolCredentials() {
  try {
    const admin = supabaseAdmin();
    const { data } = await admin
      .from('settings')
      .select('languagetool_username, languagetool_api_key')
      .eq('id', 1)
      .single();
    if (data?.languagetool_api_key) {
      return { username: data.languagetool_username || '', apiKey: data.languagetool_api_key };
    }
  } catch {
    // ignore, cae a variables de entorno
  }
  if (process.env.LANGUAGETOOL_API_KEY) {
    return {
      username: process.env.LANGUAGETOOL_USERNAME || '',
      apiKey: process.env.LANGUAGETOOL_API_KEY,
    };
  }
  return null;
}

// Revisa ortografía/gramática de un texto en español con LanguageTool.
// Devuelve { issues: [{ offset, length, message, suggestions[] }], source }.
export async function checkSpelling(text) {
  if (!text || !text.trim()) return { issues: [], source: 'empty' };

  const creds = await getLanguageToolCredentials();
  const params = new URLSearchParams({ text, language: 'es' });
  // Las cuentas Premium se atienden en un host distinto al de la API
  // pública gratuita; enviar apiKey/username al host público falla siempre,
  // incluso con credenciales válidas.
  const endpoint = creds
    ? 'https://api.languagetoolplus.com/v2/check'
    : 'https://api.languagetool.org/v2/check';
  if (creds) {
    if (creds.username) params.set('username', creds.username);
    params.set('apiKey', creds.apiKey);
  }

  let resp;
  try {
    resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  } catch {
    throw new ApiError(502, 'No se pudo contactar el servicio de corrección ortográfica.');
  }

  if (!resp.ok) {
    if (resp.status === 429) {
      throw new ApiError(
        429,
        'Se alcanzó el límite de peticiones del corrector ortográfico. Intenta de nuevo en un momento.'
      );
    }
    if (creds && (resp.status === 401 || resp.status === 403)) {
      throw new ApiError(
        502,
        'La cuenta Premium de LanguageTool configurada en Parámetros no es válida.'
      );
    }
    throw new ApiError(502, `El servicio de corrección ortográfica respondió con error ${resp.status}.`);
  }

  const data = await resp.json();
  const issues = (data.matches || []).map((m) => ({
    offset: m.offset,
    length: m.length,
    message: (m.shortMessage && m.shortMessage.trim()) || m.message,
    suggestions: (m.replacements || []).slice(0, 5).map((r) => r.value),
  }));

  return { issues, source: creds ? 'languagetool_premium' : 'languagetool_free' };
}
