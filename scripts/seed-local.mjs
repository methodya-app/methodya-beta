// Crea el primer usuario Administrador contra un Supabase LOCAL (CLI/Docker)
// para poder iniciar sesión sin tener que hacerlo a mano desde el dashboard.
//
// Uso:
//   1. supabase start   (deja corriendo Postgres+Auth locales)
//   2. Aplica db/supabase_schema.sql (ver README)
//   3. Copia .env.local.example a .env.local y completa SUPABASE_URL /
//      SUPABASE_SERVICE_ROLE_KEY con lo que imprimió "supabase start"
//   4. npm run seed:local
//
// Variables opcionales para personalizar el usuario creado:
//   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NOMBRE, SEED_ADMIN_APELLIDO

import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(filename) {
  if (!existsSync(filename)) return;
  for (const rawLine of readFileSync(filename, 'utf-8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    '\nFaltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local.\n' +
      'Copia .env.local.example a .env.local y complétalas con lo que imprime `supabase start`.\n'
  );
  process.exit(1);
}

const email = process.env.SEED_ADMIN_EMAIL || 'admin@methodya.local';
const password = process.env.SEED_ADMIN_PASSWORD || 'Methodya2026!';
const nombre = process.env.SEED_ADMIN_NOMBRE || 'Admin';
const apellido = process.env.SEED_ADMIN_APELLIDO || 'Methodya';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Creando usuario Administrador ${email} en ${SUPABASE_URL} ...`);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message?.toLowerCase().includes('registered')) {
      console.log('El usuario ya existe en Auth, se continúa para asegurar el perfil...');
    } else {
      console.error('Error creando el usuario en Auth:', createError.message);
      process.exit(1);
    }
  }

  let userId = created?.user?.id;
  if (!userId) {
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list.users.find((u) => u.email === email)?.id;
  }
  if (!userId) {
    console.error('No se pudo determinar el id del usuario creado.');
    process.exit(1);
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    email,
    nombre,
    apellido,
    is_admin: true,
    activo: true,
  });

  if (profileError) {
    console.error('Error creando el perfil:', profileError.message);
    process.exit(1);
  }

  console.log('\nListo. Usuario Administrador de prueba:');
  console.log(`  Correo:  ${email}`);
  console.log(`  Clave:   ${password}`);
  console.log('\nInicia sesión con estas credenciales en el frontend (npm run dev en /web).\n');
}

main();
