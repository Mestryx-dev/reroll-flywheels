#!/usr/bin/env node
/**
 * Build catalog.json from local CSV + Google Sheet (repairs only).
 *
 * Sources:
 *   src/data/vehicles.csv  — model, priceHT, category, dealership
 *   Google Sheet Data — repair price by gamme (columns G/H)
 *   Google Sheet Calculette — repair line tariffs (fallback: existing catalog.json repairs)
 *
 * Usage: node scripts/sync-from-sheet.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SHEET_ID = '1eb4nnusdasnyUMIX9lf1JSgjJBeQLnAs3LWUuBkAm3s';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV_PATH = join(ROOT, 'src/data/vehicles.csv');
const OUT = join(ROOT, 'src/data/catalog.json');
const FALLBACK = join(ROOT, 'src/data/catalog.json');

function parseMoney(value) {
  if (!value) return 0;
  const normalized = String(value).replace(/\u202f/g, '').replace(/\s/g, '').replace(/\$/g, '').replace(/,/g, '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
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
      if (char === '\r' && next === '\n') i += 1;
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

function readVehiclesCsv() {
  if (!existsSync(CSV_PATH)) {
    throw new Error(`Missing ${CSV_PATH} — export or create vehicles.csv first`);
  }
  const rows = parseCsv(readFileSync(CSV_PATH, 'utf8'));
  const header = rows[0] ?? [];
  const modelIdx = header.indexOf('model');
  const priceIdx = header.indexOf('priceHT');
  const categoryIdx = header.indexOf('category');
  const dealershipIdx = header.indexOf('dealership');

  return rows.slice(1).flatMap((cells) => {
    const model = cells[modelIdx] ?? '';
    const priceHT = parseMoney(cells[priceIdx]);
    if (!model || priceHT <= 0) return [];
    return [{
      model,
      priceHT,
      range: cells[categoryIdx] ?? '',
      dealership: cells[dealershipIdx] ?? '',
    }];
  });
}

async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${sheetName}: ${response.status}`);
  }
  return parseCsv(await response.text());
}

/** Repair base price by gamme — columns G/H on the Data sheet. */
function parseRepairByRange(dataRows) {
  const repairByRange = {};
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

function loadFallbackRepairByRange() {
  if (!existsSync(FALLBACK)) return {};
  const catalog = JSON.parse(readFileSync(FALLBACK, 'utf8'));
  return catalog.repairByRange ?? {};
}

function parseRepairs(rows) {
  const repairs = [];
  const repairLabels = new Set([
    'Réparations', 'Ouvrable', 'Vidange', 'Pneu', 'Transport sud', 'Transport Nord',
    'Essence', 'Kérosène', 'Révision T', 'Révision E', 'Changement de plaque',
  ]);
  for (const cells of rows) {
    if (!repairLabels.has(cells[1])) continue;
    repairs.push({
      id: cells[1].toLowerCase().replace(/\s+/g, '_').replace('é', 'e'),
      label: cells[1],
      price: parseMoney(cells[4]),
      defaultChecked: cells[3].toUpperCase() === 'TRUE',
      defaultQty: cells[2] ? Number.parseInt(cells[2], 10) : null,
    });
  }
  return repairs;
}

function loadFallbackRepairs() {
  if (!existsSync(FALLBACK)) return [];
  const catalog = JSON.parse(readFileSync(FALLBACK, 'utf8'));
  return catalog.repairs ?? catalog.profiles?.[0]?.repairs ?? [];
}

function vehicleKey(vehicle) {
  return `${vehicle.model}|${vehicle.range}|${vehicle.dealership}|${vehicle.priceHT}`;
}

function dedupeVehicles(list) {
  const seen = new Set();
  return list.filter((vehicle) => {
    const key = vehicleKey(vehicle);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function main() {
  const vehicles = dedupeVehicles(readVehiclesCsv());

  let repairs = [];
  let repairByRange = {};
  try {
    const [calc1, dataRows] = await Promise.all([
      fetchSheet('Calculette'),
      fetchSheet('Data'),
    ]);
    repairs = parseRepairs(calc1);
    repairByRange = parseRepairByRange(dataRows);
  } catch (error) {
    console.warn('Sheet fetch failed, keeping existing repairs:', error.message);
    repairs = loadFallbackRepairs();
    repairByRange = loadFallbackRepairByRange();
  }

  if (repairs.length === 0) {
    repairs = loadFallbackRepairs();
  }
  if (Object.keys(repairByRange).length === 0) {
    repairByRange = loadFallbackRepairByRange();
  }

  const catalog = { vehicles, repairs, repairByRange };
  writeFileSync(OUT, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(
    `Wrote ${vehicles.length} vehicles (CSV) + ${repairs.length} repair lines + ${Object.keys(repairByRange).length} gamme tariffs → ${OUT}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
