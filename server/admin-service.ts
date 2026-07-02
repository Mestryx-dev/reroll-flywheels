import type Database from 'better-sqlite3';
import type { PricingFormulasDto, RepairLineDto } from './config-service.js';

const FORMULA_DB_KEYS: Record<keyof PricingFormulasDto, string> = {
  ttcRate: 'ttc_rate',
  explosionRate: 'explosion_rate',
  noyadeRate: 'noyade_rate',
  rachatRate: 'rachat_rate',
};

const DEFAULT_FORMULAS: PricingFormulasDto = {
  ttcRate: 1.1,
  explosionRate: 0.1,
  noyadeRate: 0.05,
  rachatRate: 0.5,
};

export interface AdminRepairLineRow extends RepairLineDto {
  sortOrder: number;
  enabled: boolean;
}

export interface AdminRangeRow {
  rangeKey: string;
  label: string;
  price: number;
}

export interface AdminStateDto {
  formulas: PricingFormulasDto;
  repairLines: AdminRepairLineRow[];
  repairByRange: AdminRangeRow[];
  vehicleCount: number;
}

export interface CreateRepairLineInput {
  label: string;
  price: number;
  defaultChecked?: boolean;
  defaultQty?: number | null;
}

export interface UpdateRepairLineInput {
  label?: string;
  price?: number;
  defaultChecked?: boolean;
  defaultQty?: number | null;
  sortOrder?: number;
}

function getLineKind(db: Database.Database, id: string): string | undefined {
  const row = db
    .prepare('SELECT kind FROM repair_lines WHERE id = ? AND enabled = 1')
    .get(id) as { kind: string } | undefined;
  return row?.kind;
}

export function getAdminState(db: Database.Database): AdminStateDto {
  const formulaRows = db
    .prepare('SELECT key, value FROM pricing_formulas')
    .all() as Array<{ key: string; value: number }>;

  const formulas = { ...DEFAULT_FORMULAS };
  for (const row of formulaRows) {
    const entry = Object.entries(FORMULA_DB_KEYS).find(([, dbKey]) => dbKey === row.key);
    if (entry) {
      const [dtoKey] = entry as [keyof PricingFormulasDto, string];
      formulas[dtoKey] = row.value;
    }
  }

  const lineRows = db
    .prepare(`
      SELECT id, label, kind, price, default_checked, default_qty, sort_order, enabled
      FROM repair_lines
      ORDER BY sort_order ASC, label ASC
    `)
    .all() as Array<{
      id: string;
      label: string;
      kind: string;
      price: number;
      default_checked: number;
      default_qty: number | null;
      sort_order: number;
      enabled: number;
    }>;

  const repairLines: AdminRepairLineRow[] = lineRows.map((row) => ({
    id: row.id,
    label: row.label,
    kind: row.kind,
    price: row.price,
    defaultChecked: row.default_checked === 1,
    defaultQty: row.default_qty,
    sortOrder: row.sort_order,
    enabled: row.enabled === 1,
  }));

  const rangeRows = db
    .prepare('SELECT range_key, label, price FROM repair_by_range ORDER BY range_key ASC')
    .all() as Array<{ range_key: string; label: string | null; price: number }>;

  const vehicleCount = (
    db.prepare('SELECT COUNT(*) AS count FROM vehicles').get() as { count: number }
  ).count;

  return {
    formulas,
    repairLines,
    repairByRange: rangeRows.map((row) => ({
      rangeKey: row.range_key,
      label: row.label ?? row.range_key,
      price: row.price,
    })),
    vehicleCount,
  };
}

export function updateFormulas(db: Database.Database, formulas: PricingFormulasDto): PricingFormulasDto {
  const stmt = db.prepare(`
    INSERT INTO pricing_formulas (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  const tx = db.transaction(() => {
    for (const [dtoKey, value] of Object.entries(formulas) as Array<
      [keyof PricingFormulasDto, number]
    >) {
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`Invalid formula value for ${dtoKey}`);
      }
      stmt.run(FORMULA_DB_KEYS[dtoKey], value);
    }
  });

  tx();
  return getAdminState(db).formulas;
}

function slugifyLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

function uniqueLineId(db: Database.Database, base: string): string {
  let candidate = base || 'line';
  let suffix = 0;
  while (true) {
    const id = suffix === 0 ? candidate : `${candidate}_${suffix}`;
    const exists = db.prepare('SELECT 1 FROM repair_lines WHERE id = ?').get(id);
    if (!exists) {
      return id;
    }
    suffix += 1;
  }
}

export function createRepairLine(
  db: Database.Database,
  input: CreateRepairLineInput,
): AdminRepairLineRow {
  const label = input.label.trim();
  if (!label) {
    throw new Error('Label is required');
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error('Price must be a non-negative number');
  }

  const id = uniqueLineId(db, slugifyLabel(label));
  const maxOrder = (
    db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM repair_lines').get() as {
      max_order: number;
    }
  ).max_order;

  db.prepare(`
    INSERT INTO repair_lines (
      id, label, kind, price, default_checked, default_qty, sort_order, enabled
    ) VALUES (?, ?, 'fixed', ?, ?, ?, ?, 1)
  `).run(
    id,
    label,
    Math.round(input.price),
    input.defaultChecked ? 1 : 0,
    input.defaultQty ?? null,
    maxOrder + 1,
  );

  return getAdminState(db).repairLines.find((line) => line.id === id)!;
}

export function updateRepairLine(
  db: Database.Database,
  id: string,
  input: UpdateRepairLineInput,
): AdminRepairLineRow {
  const existing = db
    .prepare('SELECT id, kind FROM repair_lines WHERE id = ? AND enabled = 1')
    .get(id) as { id: string; kind: string } | undefined;

  if (!existing) {
    throw new Error('Repair line not found');
  }

  const kind = existing.kind;
  const updates: string[] = [];
  const values: Array<string | number | null> = [];

  if (input.label !== undefined) {
    const label = input.label.trim();
    if (!label) {
      throw new Error('Label cannot be empty');
    }
    updates.push('label = ?');
    values.push(label);
  }

  if (input.defaultChecked !== undefined) {
    updates.push('default_checked = ?');
    values.push(input.defaultChecked ? 1 : 0);
  }

  if (input.defaultQty !== undefined) {
    updates.push('default_qty = ?');
    values.push(input.defaultQty);
  }

  if (input.sortOrder !== undefined) {
    updates.push('sort_order = ?');
    values.push(input.sortOrder);
  }

  if (input.price !== undefined) {
    if (!Number.isFinite(input.price) || input.price < 0) {
      throw new Error('Price must be a non-negative number');
    }
    if (kind === 'range_based') {
      throw new Error('Cannot set price on range-based repair line');
    }
    updates.push('price = ?');
    values.push(Math.round(input.price));
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  db.prepare(`UPDATE repair_lines SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return getAdminState(db).repairLines.find((line) => line.id === id)!;
}

export function disableRepairLine(db: Database.Database, id: string): void {
  const kind = getLineKind(db, id);
  if (!kind) {
    throw new Error('Repair line not found');
  }
  if (kind === 'range_based' || kind === 'plate') {
    throw new Error('System repair lines cannot be removed');
  }

  db.prepare('UPDATE repair_lines SET enabled = 0 WHERE id = ?').run(id);
}

export function updateRepairByRange(
  db: Database.Database,
  ranges: AdminRangeRow[],
): AdminRangeRow[] {
  const stmt = db.prepare(`
    INSERT INTO repair_by_range (range_key, label, price) VALUES (?, ?, ?)
    ON CONFLICT(range_key) DO UPDATE SET
      label = excluded.label,
      price = excluded.price
  `);

  const tx = db.transaction(() => {
    for (const row of ranges) {
      const rangeKey = row.rangeKey.trim().toLowerCase();
      if (!rangeKey) {
        throw new Error('Range key is required');
      }
      if (!Number.isFinite(row.price) || row.price < 0) {
        throw new Error(`Invalid price for range ${rangeKey}`);
      }
      stmt.run(rangeKey, row.label.trim() || rangeKey, Math.round(row.price));
    }
  });

  tx();
  return getAdminState(db).repairByRange;
}

export function resetFormulasToDefaults(db: Database.Database): PricingFormulasDto {
  return updateFormulas(db, DEFAULT_FORMULAS);
}
