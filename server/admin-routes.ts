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

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function createAdminRoutes(db: Database.Database): Hono {
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

  return admin;
}
