import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAppConfig } from './config-service.js';
import { createAdminRoutes } from './admin-routes.js';
import { ensureSchema, isDatabaseEmpty, openDatabase } from './db.js';
import { seedFromCatalogFile } from './seed.js';

const DEV_API_PORT = 4783;

const serverDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(serverDir, '..');
const distDir = join(rootDir, 'dist');
const catalogPath = join(rootDir, 'src/data/catalog.json');
const dataDir = process.env.DATA_DIR ?? join(rootDir, 'data');
const dbPath = join(dataDir, 'flywheels.db');
const port = Number.parseInt(
  process.env.PORT ?? (process.env.NODE_ENV === 'production' ? '3000' : String(DEV_API_PORT)),
  10,
);

const db = openDatabase(dbPath);
ensureSchema(db);

if (isDatabaseEmpty(db)) {
  if (!existsSync(catalogPath)) {
    throw new Error(`Missing seed catalog at ${catalogPath}`);
  }
  seedFromCatalogFile(db, catalogPath);
  console.log(`Seeded SQLite database from ${catalogPath}`);
}

const app = new Hono();

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    db: dbPath,
    vehicles: db.prepare('SELECT COUNT(*) AS count FROM vehicles').get(),
  }),
);

app.get('/api/config', (c) => c.json(getAppConfig(db)));

app.route('/api/admin', createAdminRoutes(db, rootDir));

if (existsSync(distDir)) {
  app.use('/assets/*', serveStatic({ root: distDir }));
  app.use('/favicon.svg', serveStatic({ root: distDir }));
  app.use('/*', serveStatic({ root: distDir }));
  app.get('*', serveStatic({ root: distDir, path: 'index.html' }));
}

const listener = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`flywheels-calc server listening on :${info.port}`);
  },
);

listener.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${port} already in use. Stop the other process or run: PORT=<free-port> pnpm dev:api`,
    );
    process.exit(1);
  }
  throw error;
});
