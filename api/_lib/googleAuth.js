import { OAuth2Client } from 'google-auth-library';
import { supabaseAdmin } from './supabaseAdmin.js';
import { ApiError } from './cors.js';

// drive: crear subcarpetas, copiar/leer/editar archivos.
// documents/presentations: reemplazar {{variable}} en Docs/Slides.
// userinfo.email: solo para mostrar en Parámetros qué cuenta quedó conectada.
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/userinfo.email',
];

async function getSettingsRow() {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from('settings')
    .select(
      'google_oauth_client_id, google_oauth_client_secret, google_oauth_refresh_token, google_oauth_connected_email, backend_endpoint'
    )
    .eq('id', 1)
    .single();
  return data || {};
}

// URL a la que Google debe redirigir después del consentimiento. Debe
// coincidir EXACTAMENTE con una de las "URI de redireccionamiento
// autorizadas" configuradas en el OAuth Client de Google Cloud.
export function getGoogleRedirectUri(backendEndpoint) {
  const base =
    backendEndpoint ||
    process.env.BACKEND_ENDPOINT ||
    `http://localhost:${process.env.PORT || 3000}`;
  return `${base.replace(/\/$/, '')}/api/auth/google/callback`;
}

// Credenciales OAuth2 (settings table primero, env vars como respaldo). No
// incluye "conectado o no": eso depende de si además hay refresh_token.
export async function getGoogleOAuthConfig() {
  let row = {};
  try {
    row = await getSettingsRow();
  } catch {
    // ignore, cae a variables de entorno
  }
  const clientId = row.google_oauth_client_id || process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = row.google_oauth_client_secret || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = row.google_oauth_refresh_token || process.env.GOOGLE_OAUTH_REFRESH_TOKEN || null;
  const connectedEmail = row.google_oauth_connected_email || null;
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    refreshToken,
    connectedEmail,
    redirectUri: getGoogleRedirectUri(row.backend_endpoint),
  };
}

export async function isGoogleConnected() {
  const config = await getGoogleOAuthConfig();
  return !!config?.refreshToken;
}

function buildClient(config) {
  return new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
}

// URL de consentimiento de Google para iniciar/renovar la conexión.
// prompt=consent fuerza que Google vuelva a entregar un refresh_token cada
// vez (si no, solo lo entrega la primera vez que el usuario autoriza).
export async function generateGoogleAuthUrl(state) {
  const config = await getGoogleOAuthConfig();
  if (!config) {
    throw new ApiError(400, 'Configura primero el Client ID y Client Secret de Google OAuth.');
  }
  const client = buildClient(config);
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_OAUTH_SCOPES,
    state,
  });
}

// Intercambia el "code" que Google manda al callback por los tokens, y de
// paso consulta qué cuenta de correo quedó conectada.
export async function exchangeGoogleAuthCode(code) {
  const config = await getGoogleOAuthConfig();
  if (!config) {
    throw new ApiError(400, 'Configura primero el Client ID y Client Secret de Google OAuth.');
  }
  const client = buildClient(config);
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new ApiError(
      502,
      'Google no devolvió un refresh_token. Vuelve a intentar el botón "Conectar cuenta de Google" (asegúrate de aceptar todos los permisos solicitados).'
    );
  }
  client.setCredentials(tokens);
  let email = null;
  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (resp.ok) email = (await resp.json()).email || null;
  } catch {
    // no crítico: si falla, simplemente no mostramos el correo conectado
  }
  return { refreshToken: tokens.refresh_token, email };
}

// Token de acceso (Bearer) listo para llamar a Drive/Docs/Slides, obtenido
// a partir del refresh_token guardado.
export async function getGoogleAccessToken() {
  const config = await getGoogleOAuthConfig();
  if (!config?.refreshToken) {
    throw new ApiError(
      400,
      'La cuenta de Google no está conectada. Ve a Parámetros del servidor y usa "Conectar cuenta de Google".'
    );
  }
  const client = buildClient(config);
  client.setCredentials({ refresh_token: config.refreshToken });
  try {
    const { token } = await client.getAccessToken();
    if (!token) throw new Error('sin token');
    return token;
  } catch {
    // Causa típica: el refresh_token expiró (las apps de Google Cloud sin
    // verificar, en modo "Prueba", revocan el acceso a los 7 días) o el
    // usuario revocó el permiso manualmente.
    throw new ApiError(
      401,
      'El acceso a Google Drive expiró o fue revocado. Reconecta la cuenta en Parámetros del servidor.'
    );
  }
}
