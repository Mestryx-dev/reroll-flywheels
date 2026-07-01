import { repairByRange } from '../data';

/** CSV / catalog spelling variants → canonical range key in repairByRange. */
const RANGE_ALIASES: Record<string, string> = {
  berline: 'sedans',
  sportclassics: 'sportsclassics',
};

function normalizeRangeKey(range: string): string {
  const key = range.trim().toLowerCase();
  return RANGE_ALIASES[key] ?? key;
}

export function repairPriceForRange(range: string): number {
  if (!range.trim()) {
    return 0;
  }
  return repairByRange[normalizeRangeKey(range)] ?? 0;
}

export function repairPriceForVehicle(
  vehicle: { range: string } | null | undefined,
): number {
  if (!vehicle) {
    return 0;
  }
  return repairPriceForRange(vehicle.range);
}

export const REPARATIONS_LINE_ID = 'reparations';

export function isReparationsLine(id: string): boolean {
  return id === REPARATIONS_LINE_ID;
}
