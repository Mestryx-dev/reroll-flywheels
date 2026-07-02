import type Database from 'better-sqlite3';

export interface PricingFormulasDto {
  ttcRate: number;
  explosionRate: number;
  noyadeRate: number;
}

export interface RepairLineDto {
  id: string;
  label: string;
  kind: string;
  price: number;
  defaultChecked: boolean;
  defaultQty: number | null;
}

export interface CatalogVehicleDto {
  model: string;
  priceHT: number;
  range: string;
  dealership: string;
}

export interface AppConfigDto {
  vehicles: CatalogVehicleDto[];
  repairs: RepairLineDto[];
  repairByRange: Record<string, number>;
  formulas: PricingFormulasDto;
}

const FORMULA_KEY_MAP: Record<string, keyof PricingFormulasDto> = {
  ttc_rate: 'ttcRate',
  explosion_rate: 'explosionRate',
  noyade_rate: 'noyadeRate',
};

const DEFAULT_FORMULAS: PricingFormulasDto = {
  ttcRate: 1.1,
  explosionRate: 0.1,
  noyadeRate: 0.05,
};

export function getAppConfig(db: Database.Database): AppConfigDto {
  const formulaRows = db
    .prepare('SELECT key, value FROM pricing_formulas')
    .all() as Array<{ key: string; value: number }>;

  const formulas = { ...DEFAULT_FORMULAS };
  for (const row of formulaRows) {
    const mapped = FORMULA_KEY_MAP[row.key];
    if (mapped) {
      formulas[mapped] = row.value;
    }
  }

  const repairRows = db
    .prepare(`
      SELECT id, label, kind, price, default_checked, default_qty
      FROM repair_lines
      WHERE enabled = 1
      ORDER BY sort_order ASC, label ASC
    `)
    .all() as Array<{
      id: string;
      label: string;
      kind: string;
      price: number;
      default_checked: number;
      default_qty: number | null;
    }>;

  const repairs: RepairLineDto[] = repairRows.map((row) => ({
    id: row.id,
    label: row.label,
    kind: row.kind,
    price: row.price,
    defaultChecked: row.default_checked === 1,
    defaultQty: row.default_qty,
  }));

  const rangeRows = db
    .prepare('SELECT range_key, price FROM repair_by_range ORDER BY range_key ASC')
    .all() as Array<{ range_key: string; price: number }>;

  const repairByRange: Record<string, number> = {};
  for (const row of rangeRows) {
    repairByRange[row.range_key] = row.price;
  }

  const vehicleRows = db
    .prepare(`
      SELECT model, price_ht, range, dealership
      FROM vehicles
      ORDER BY model ASC
    `)
    .all() as Array<{
      model: string;
      price_ht: number;
      range: string;
      dealership: string;
    }>;

  const vehicles: CatalogVehicleDto[] = vehicleRows.map((row) => ({
    model: row.model,
    priceHT: row.price_ht,
    range: row.range,
    dealership: row.dealership,
  }));

  return {
    vehicles,
    repairs,
    repairByRange,
    formulas,
  };
}
