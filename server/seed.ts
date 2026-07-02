import type Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import type { RepairLineKind } from './db.js';

interface CatalogJson {
  vehicles: Array<{
    model: string;
    priceHT: number;
    range: string;
    dealership: string;
  }>;
  repairs: Array<{
    id: string;
    label: string;
    price: number;
    defaultChecked: boolean;
    defaultQty: number | null;
  }>;
  repairByRange?: Record<string, number>;
}

const DEFAULT_FORMULAS: Record<string, number> = {
  ttc_rate: 1.1,
  explosion_rate: 0.1,
  noyade_rate: 0.05,
  rachat_rate: 0.5,
};

function inferKind(lineId: string): RepairLineKind {
  if (lineId === 'reparations') {
    return 'range_based';
  }
  if (lineId === 'changement_de_plaque') {
    return 'plate';
  }
  return 'fixed';
}

export function seedFromCatalogFile(db: Database.Database, catalogPath: string): void {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as CatalogJson;

  const seedFormulas = db.prepare(
    'INSERT OR IGNORE INTO pricing_formulas (key, value) VALUES (?, ?)',
  );
  for (const [key, value] of Object.entries(DEFAULT_FORMULAS)) {
    seedFormulas.run(key, value);
  }

  const insertLine = db.prepare(`
    INSERT INTO repair_lines (
      id, label, kind, price, default_checked, default_qty, sort_order, enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  catalog.repairs.forEach((line, index) => {
    insertLine.run(
      line.id,
      line.label,
      inferKind(line.id),
      line.price,
      line.defaultChecked ? 1 : 0,
      line.defaultQty,
      index,
    );
  });

  const insertRange = db.prepare(`
    INSERT INTO repair_by_range (range_key, label, price) VALUES (?, ?, ?)
  `);
  for (const [rangeKey, price] of Object.entries(catalog.repairByRange ?? {})) {
    insertRange.run(rangeKey, rangeKey, price);
  }

  const insertVehicle = db.prepare(`
    INSERT OR IGNORE INTO vehicles (model, price_ht, range, dealership)
    VALUES (?, ?, ?, ?)
  `);
  for (const vehicle of catalog.vehicles) {
    if (!vehicle.model || vehicle.priceHT <= 0) {
      continue;
    }
    insertVehicle.run(vehicle.model, vehicle.priceHT, vehicle.range, vehicle.dealership);
  }
}
