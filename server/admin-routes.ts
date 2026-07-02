import { Hono } from 'hono';
import type Database from 'better-sqlite3';
import type { PricingFormulasDto } from './config-service.js';
import {
  createRepairLine,
  disableRepairLine,
  getAdminState,
  resetFormulasToDefaults,
  updateFormulas,
  updateRepairByRange,
  updateRepairLine,
  type AdminRangeRow,
  type CreateRepairLineInput,
  type UpdateRepairLineInput,
} from './admin-service.js';
import {
  applySheetSync,
  listSyncRuns,
  previewSheetSync,
  recordSyncRun,
  type SyncSource,
} from './sync-service.js';

function parseSyncSources(raw: unknown): SyncSource[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('sources array is required (data, calculette)');
  }
  const allowed = new Set<SyncSource>(['data', 'calculette']);
  const sources = raw.filter((value): value is SyncSource => typeof value === 'string' && allowed.has(value as SyncSource));
  if (sources.length === 0) {
    throw new Error('Invalid sync sources');
  }
  return sources;
}

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function createAdminRoutes(db: Database.Database, rootDir: string): Hono {
  const admin = new Hono();

  admin.get('/state', (c) => c.json(getAdminState(db)));

  admin.put('/formulas', async (c) => {
    try {
      const body = (await c.req.json()) as PricingFormulasDto;
      const formulas = updateFormulas(db, body);
      return c.json({ formulas });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid formulas payload';
      return jsonError(message);
    }
  });

  admin.post('/formulas/reset', (c) => {
    const formulas = resetFormulasToDefaults(db);
    return c.json({ formulas });
  });

  admin.post('/repair-lines', async (c) => {
    try {
      const body = (await c.req.json()) as CreateRepairLineInput;
      const line = createRepairLine(db, body);
      return c.json({ line }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid repair line payload';
      return jsonError(message);
    }
  });

  admin.patch('/repair-lines/:id', async (c) => {
    try {
      const body = (await c.req.json()) as UpdateRepairLineInput;
      const line = updateRepairLine(db, c.req.param('id'), body);
      return c.json({ line });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid repair line update';
      const status = message === 'Repair line not found' ? 404 : 400;
      return jsonError(message, status);
    }
  });

  admin.delete('/repair-lines/:id', (c) => {
    try {
      disableRepairLine(db, c.req.param('id'));
      return c.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cannot delete repair line';
      const status = message === 'Repair line not found' ? 404 : 400;
      return jsonError(message, status);
    }
  });

  admin.put('/repair-by-range', async (c) => {
    try {
      const body = (await c.req.json()) as { ranges: AdminRangeRow[] };
      if (!Array.isArray(body.ranges)) {
        return jsonError('ranges array is required');
      }
      const ranges = updateRepairByRange(db, body.ranges);
      return c.json({ ranges });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid range payload';
      return jsonError(message);
    }
  });

  admin.get('/sync/runs', (c) => c.json({ runs: listSyncRuns(db) }));

  admin.post('/sync/preview', async (c) => {
    try {
      const body = (await c.req.json()) as { sources?: unknown };
      const sources = parseSyncSources(body.sources);
      const preview = await previewSheetSync(db, rootDir, sources);
      return c.json(preview);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync preview failed';
      return jsonError(message, 502);
    }
  });

  admin.post('/sync/apply', async (c) => {
    let sources: SyncSource[] = [];
    try {
      const body = (await c.req.json()) as { sources?: unknown };
      sources = parseSyncSources(body.sources);
      const result = await applySheetSync(db, rootDir, sources);
      return c.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync apply failed';
      if (sources.length > 0) {
        recordSyncRun(db, sources.join(','), 'error', { message });
      }
      return jsonError(message, 502);
    }
  });

  return admin;
}
