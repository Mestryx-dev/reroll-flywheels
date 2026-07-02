import type Database from 'better-sqlite3';
import { inferRepairLineKind } from './line-kind.js';
import {
  dedupeVehicles,
  defaultSheetId,
  defaultVehiclesCsvPath,
  fetchSheetCsv,
  parseRepairByRange,
  parseRepairs,
  readVehiclesCsv,
  type SheetRepairLine,
  type SheetVehicle,
} from './sync/sheet-parser.js';

export type SyncSource = 'data' | 'calculette';

export interface SyncChange {
  entity: 'vehicle' | 'repair_line' | 'repair_range';
  key: string;
  action: 'add' | 'update' | 'remove';
  summary: string;
}

export interface SyncSectionPreview {
  source: SyncSource;
  label: string;
  changes: SyncChange[];
  counts: {
    added: number;
    updated: number;
    removed: number;
    unchanged: number;
  };
}

export interface SyncPreviewResult {
  sections: SyncSectionPreview[];
  fetchedAt: string;
}

export interface SyncApplyResult {
  sections: SyncSectionPreview[];
  appliedAt: string;
}

export interface SyncRunDto {
  id: number;
  source: string;
  startedAt: string;
  status: 'ok' | 'error';
  summary: Record<string, unknown> | null;
}

interface DataPayload {
  vehicles: SheetVehicle[];
  repairByRange: Record<string, number>;
}

interface CalculettePayload {
  repairs: SheetRepairLine[];
}

async function fetchDataPayload(rootDir: string): Promise<DataPayload> {
  const sheetId = defaultSheetId();
  const vehicles = dedupeVehicles(readVehiclesCsv(defaultVehiclesCsvPath(rootDir)));
  const dataRows = await fetchSheetCsv(sheetId, 'Data');
  const repairByRange = parseRepairByRange(dataRows);
  return { vehicles, repairByRange };
}

async function fetchCalculettePayload(): Promise<CalculettePayload> {
  const sheetId = defaultSheetId();
  const rows = await fetchSheetCsv(sheetId, 'Calculette');
  return { repairs: parseRepairs(rows) };
}

function getCurrentVehicles(db: Database.Database): SheetVehicle[] {
  return (
    db
      .prepare('SELECT model, price_ht AS priceHT, range, dealership FROM vehicles ORDER BY model ASC')
      .all() as SheetVehicle[]
  );
}

function getCurrentRepairByRange(db: Database.Database): Record<string, number> {
  const rows = db
    .prepare('SELECT range_key, price FROM repair_by_range')
    .all() as Array<{ range_key: string; price: number }>;
  return Object.fromEntries(rows.map((row) => [row.range_key, row.price]));
}

function getCurrentRepairLines(db: Database.Database): SheetRepairLine[] {
  return (
    db
      .prepare(`
      SELECT id, label, price, default_checked, default_qty
      FROM repair_lines
      WHERE enabled = 1
    `)
      .all() as Array<{
      id: string;
      label: string;
      price: number;
      default_checked: number;
      default_qty: number | null;
    }>
  ).map((row) => ({
    id: row.id,
    label: row.label,
    price: row.price,
    defaultChecked: row.default_checked === 1,
    defaultQty: row.default_qty,
  }));
}

function diffRepairByRange(
  before: Record<string, number>,
  after: Record<string, number>,
): SyncChange[] {
  const changes: SyncChange[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of [...keys].sort()) {
    const prev = before[key];
    const next = after[key];
    if (prev === undefined && next !== undefined) {
      changes.push({
        entity: 'repair_range',
        key,
        action: 'add',
        summary: `${key} → ${next}`,
      });
    } else if (prev !== undefined && next === undefined) {
      changes.push({
        entity: 'repair_range',
        key,
        action: 'remove',
        summary: `${key} (${prev})`,
      });
    } else if (prev !== next) {
      changes.push({
        entity: 'repair_range',
        key,
        action: 'update',
        summary: `${key}: ${prev} → ${next}`,
      });
    }
  }

  return changes;
}

function diffRepairLines(before: SheetRepairLine[], after: SheetRepairLine[]): SyncChange[] {
  const beforeMap = new Map(before.map((line) => [line.id, line]));
  const afterMap = new Map(after.map((line) => [line.id, line]));
  const ids = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const changes: SyncChange[] = [];

  for (const id of [...ids].sort()) {
    const prev = beforeMap.get(id);
    const next = afterMap.get(id);
    if (!prev && next) {
      changes.push({
        entity: 'repair_line',
        key: id,
        action: 'add',
        summary: `${next.label} (${next.price})`,
      });
      continue;
    }
    if (prev && !next) {
      changes.push({
        entity: 'repair_line',
        key: id,
        action: 'remove',
        summary: prev.label,
      });
      continue;
    }
    if (prev && next) {
      const same =
        prev.label === next.label &&
        prev.price === next.price &&
        prev.defaultChecked === next.defaultChecked &&
        prev.defaultQty === next.defaultQty;
      if (!same) {
        changes.push({
          entity: 'repair_line',
          key: id,
          action: 'update',
          summary: `${next.label}: ${prev.price} → ${next.price}`,
        });
      }
    }
  }

  return changes;
}

function summarizeChanges(changes: SyncChange[]): SyncSectionPreview['counts'] {
  return {
    added: changes.filter((change) => change.action === 'add').length,
    updated: changes.filter((change) => change.action === 'update').length,
    removed: changes.filter((change) => change.action === 'remove').length,
    unchanged: 0,
  };
}

function buildVehicleSummary(beforeCount: number, afterCount: number): SyncChange[] {
  if (beforeCount === afterCount) {
    return [];
  }
  return [
    {
      entity: 'vehicle',
      key: 'catalog',
      action: beforeCount < afterCount ? 'add' : 'update',
      summary: `Véhicules: ${beforeCount} → ${afterCount} (CSV local)`,
    },
  ];
}

function sectionFromChanges(
  source: SyncSource,
  label: string,
  changes: SyncChange[],
): SyncSectionPreview {
  const counts = summarizeChanges(changes);
  return {
    source,
    label,
    changes,
    counts,
  };
}

export async function previewSheetSync(
  db: Database.Database,
  rootDir: string,
  sources: SyncSource[],
): Promise<SyncPreviewResult> {
  const sections: SyncSectionPreview[] = [];

  if (sources.includes('data')) {
    const payload = await fetchDataPayload(rootDir);
    const rangeChanges = diffRepairByRange(getCurrentRepairByRange(db), payload.repairByRange);
    const vehicleChanges = buildVehicleSummary(
      getCurrentVehicles(db).length,
      payload.vehicles.length,
    );
    sections.push(
      sectionFromChanges('data', 'Data (CSV véhicules + gammes G/H)', [
        ...vehicleChanges,
        ...rangeChanges,
      ]),
    );
  }

  if (sources.includes('calculette')) {
    const payload = await fetchCalculettePayload();
    const lineChanges = diffRepairLines(getCurrentRepairLines(db), payload.repairs);
    sections.push(sectionFromChanges('calculette', 'Calculette (lignes facture)', lineChanges));
  }

  return {
    sections,
    fetchedAt: new Date().toISOString(),
  };
}

function applyDataSync(db: Database.Database, payload: DataPayload): void {
  const deleteVehicles = db.prepare('DELETE FROM vehicles');
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (model, price_ht, range, dealership)
    VALUES (?, ?, ?, ?)
  `);
  const upsertRange = db.prepare(`
    INSERT INTO repair_by_range (range_key, label, price) VALUES (?, ?, ?)
    ON CONFLICT(range_key) DO UPDATE SET label = excluded.label, price = excluded.price
  `);

  const tx = db.transaction(() => {
    deleteVehicles.run();
    for (const vehicle of payload.vehicles) {
      insertVehicle.run(vehicle.model, vehicle.priceHT, vehicle.range, vehicle.dealership);
    }
    for (const [rangeKey, price] of Object.entries(payload.repairByRange)) {
      upsertRange.run(rangeKey, rangeKey, price);
    }
  });

  tx();
}

function applyCalculetteSync(db: Database.Database, repairs: SheetRepairLine[]): void {
  const existing = db
    .prepare('SELECT id, sort_order FROM repair_lines')
    .all() as Array<{ id: string; sort_order: number }>;
  const sortById = new Map(existing.map((row) => [row.id, row.sort_order]));
  const maxOrder = existing.reduce((max, row) => Math.max(max, row.sort_order), -1);

  const upsert = db.prepare(`
    INSERT INTO repair_lines (
      id, label, kind, price, default_checked, default_qty, sort_order, enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      price = excluded.price,
      default_checked = excluded.default_checked,
      default_qty = excluded.default_qty,
      enabled = 1
  `);

  const tx = db.transaction(() => {
    repairs.forEach((line, index) => {
      const sortOrder = sortById.get(line.id) ?? maxOrder + index + 1;
      upsert.run(
        line.id,
        line.label,
        inferRepairLineKind(line.id),
        line.price,
        line.defaultChecked ? 1 : 0,
        line.defaultQty,
        sortOrder,
      );
    });
  });

  tx();
}

export async function applySheetSync(
  db: Database.Database,
  rootDir: string,
  sources: SyncSource[],
): Promise<SyncApplyResult> {
  const preview = await previewSheetSync(db, rootDir, sources);

  if (sources.includes('data')) {
    const payload = await fetchDataPayload(rootDir);
    applyDataSync(db, payload);
  }

  if (sources.includes('calculette')) {
    const payload = await fetchCalculettePayload();
    applyCalculetteSync(db, payload.repairs);
  }

  const appliedAt = new Date().toISOString();
  for (const section of preview.sections) {
    recordSyncRun(db, section.source, 'ok', {
      appliedAt,
      counts: section.counts,
      changeCount: section.changes.length,
    });
  }

  return {
    sections: preview.sections,
    appliedAt,
  };
}

export function recordSyncRun(
  db: Database.Database,
  source: string,
  status: 'ok' | 'error',
  summary: Record<string, unknown>,
): void {
  db.prepare(`
    INSERT INTO sync_runs (source, started_at, status, summary)
    VALUES (?, ?, ?, ?)
  `).run(source, new Date().toISOString(), status, JSON.stringify(summary));
}

export function listSyncRuns(db: Database.Database, limit = 10): SyncRunDto[] {
  const rows = db
    .prepare(`
      SELECT id, source, started_at, status, summary
      FROM sync_runs
      ORDER BY id DESC
      LIMIT ?
    `)
    .all(limit) as Array<{
    id: number;
    source: string;
    started_at: string;
    status: 'ok' | 'error';
    summary: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    startedAt: row.started_at,
    status: row.status,
    summary: row.summary ? (JSON.parse(row.summary) as Record<string, unknown>) : null,
  }));
}

/** Build catalog-shaped payload for scripts/sync-from-sheet.ts */
export async function buildCatalogFromSheets(rootDir: string): Promise<{
  vehicles: SheetVehicle[];
  repairs: SheetRepairLine[];
  repairByRange: Record<string, number>;
}> {
  const data = await fetchDataPayload(rootDir);
  const calculette = await fetchCalculettePayload();
  return {
    vehicles: data.vehicles,
    repairs: calculette.repairs,
    repairByRange: data.repairByRange,
  };
}
