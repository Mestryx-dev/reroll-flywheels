import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface SheetVehicle {
  model: string;
  priceHT: number;
  range: string;
  dealership: string;
}

export interface SheetRepairLine {
  id: string;
  label: string;
  price: number;
  defaultChecked: boolean;
  defaultQty: number | null;
}

const REPAIR_LABELS = new Set([
  'Réparations',
  'Ouvrable',
  'Vidange',
  'Pneu',
  'Transport sud',
  'Transport Nord',
  'Essence',
  'Kérosène',
  'Révision T',
  'Révision E',
  'Changement de plaque',
]);

export function parseMoney(value: unknown): number {
  if (!value) {
    return 0;
  }
  const normalized = String(value)
    .replace(/\u202f/g, '')
    .replace(/\s/g, '')
    .replace(/\$/g, '')
    .replace(/,/g, '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.map((cells) => cells.map((value) => value.trim()));
}

export function repairLabelToId(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '_').replace('é', 'e');
}

export function readVehiclesCsv(csvPath: string): SheetVehicle[] {
  if (!existsSync(csvPath)) {
    throw new Error(`Missing vehicles CSV at ${csvPath}`);
  }

  const rows = parseCsv(readFileSync(csvPath, 'utf8'));
  const header = rows[0] ?? [];
  const modelIdx = header.indexOf('model');
  const priceIdx = header.indexOf('priceHT');
  const categoryIdx = header.indexOf('category');
  const dealershipIdx = header.indexOf('dealership');

  return rows.slice(1).flatMap((cells) => {
    const model = cells[modelIdx] ?? '';
    const priceHT = parseMoney(cells[priceIdx]);
    if (!model || priceHT <= 0) {
      return [];
    }
    return [
      {
        model,
        priceHT,
        range: cells[categoryIdx] ?? '',
        dealership: cells[dealershipIdx] ?? '',
      },
    ];
  });
}

export function dedupeVehicles(list: SheetVehicle[]): SheetVehicle[] {
  const seen = new Set<string>();
  return list.filter((vehicle) => {
    const key = `${vehicle.model}|${vehicle.range}|${vehicle.dealership}|${vehicle.priceHT}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function parseRepairByRange(dataRows: string[][]): Record<string, number> {
  const repairByRange: Record<string, number> = {};
  for (const cells of dataRows.slice(1)) {
    const range = cells[6]?.trim();
    const price = parseMoney(cells[7]);
    if (!range || price <= 0) {
      continue;
    }
    const key = range.toLowerCase();
    if (!(key in repairByRange)) {
      repairByRange[key] = price;
    }
  }
  return repairByRange;
}

export function parseRepairs(rows: string[][]): SheetRepairLine[] {
  const repairs: SheetRepairLine[] = [];
  for (const cells of rows) {
    const label = cells[1];
    if (!label || !REPAIR_LABELS.has(label)) {
      continue;
    }
    repairs.push({
      id: repairLabelToId(label),
      label,
      price: parseMoney(cells[4]),
      defaultChecked: cells[3]?.toUpperCase() === 'TRUE',
      defaultQty: cells[2] ? Number.parseInt(cells[2], 10) : null,
    });
  }
  return repairs;
}

export async function fetchSheetCsv(sheetId: string, sheetName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet "${sheetName}": HTTP ${response.status}`);
  }
  return parseCsv(await response.text());
}

export function defaultSheetId(): string {
  return process.env.FLYWHEELS_SHEET_ID ?? '1eb4nnusdasnyUMIX9lf1JSgjJBeQLnAs3LWUuBkAm3s';
}

export function defaultVehiclesCsvPath(rootDir: string): string {
  return join(rootDir, 'src/data/vehicles.csv');
}
