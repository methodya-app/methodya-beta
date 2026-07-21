// Servidor de desarrollo local para las funciones de /api, SIN depender de
// la CLI de Vercel ni de una cuenta en la nube. Enruta las peticiones igual
// que Vercel (file-based routing, incluyendo segmentos dinámicos [id]),
// carga variables desde .env.local y llama al mismo handler que se
// desplegaría en producción (export default withCors(async (req,res)=>...)).
//
// Uso:  node dev-server.js   (o "npm run dev", ver package.json)
// Requiere Node 18+ (usa fetch global, ESM, fs.promises).

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

loadEnvFile('.env.local');
loadEnvFile('.env');

const PORT = process.env.PORT || 3000;
const API_DIR = path.join(process.cwd(), 'api');

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename);
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

// --- Construye la tabla de rutas recorriendo /api (igual que Vercel) -------
function collectRoutes(dir, baseDir = dir, routes = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '_lib') continue;
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      collectRoutes(fullPath, baseDir, routes);
      continue;
    }
    if (!entry.endsWith('.js')) continue;

    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    const noExt = relPath.replace(/\.js$/, '');
    let parts = noExt.split('/');
    if (parts[parts.length - 1] === 'index') parts = parts.slice(0, -1);

    const paramNames = [];
    const regexSegments = parts.map((p) => {
      const m = p.match(/^\[(.+)\]$/);
      if (m) {
        paramNames.push(m[1]);
        return '([^/]+)';
      }
      return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });

    const pattern = '^/api' + (regexSegments.length ? '/' + regexSegments.join('/') : '') + '/?$';
    routes.push({ regex: new RegExp(pattern), paramNames, filePath: fullPath });
  }
  return routes;
}

const routes = collectRoutes(API_DIR);
console.log(`Rutas de /api detectadas: ${routes.length}`);

function matchRoute(pathname) {
  for (const route of routes) {
    const m = pathname.match(route.regex);
    if (m) {
      const params = {};
      route.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(m[i + 1])));
      return { route, params };
    }
  }
  return null;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return undefined;
  const raw = Buffer.concat(chunks).toString('utf-8');
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json') && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return raw || undefined;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const match = matchRoute(url.pathname);

  // Aumenta el objeto de respuesta nativo con .status()/.json(), igual que
  // el runtime de Vercel, para que los handlers no necesiten cambiar nada.
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (body) {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
    return res;
  };

  if (!match) {
    res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${url.pathname}` });
    return;
  }

  req.query = { ...Object.fromEntries(url.searchParams), ...match.params };
  req.body = await readBody(req);

  try {
    const moduleUrl = pathToFileURL(match.route.filePath).href;
    const mod = await import(moduleUrl);
    await mod.default(req, res);
  } catch (err) {
    console.error(`Error en ${req.method} ${url.pathname}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error interno del servidor de desarrollo' });
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n  METHODYA API (local) escuchando en http://localhost:${PORT}`);
  console.log(`  Frontend: apunta VITE_API_BASE_URL=http://localhost:${PORT}\n`);
});
