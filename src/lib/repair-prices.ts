/** Repair base price by vehicle range (from sheet TARIFS RAPIDE / Offre). */
export const REPAIR_PRICE_BY_RANGE: Record<string, number> = {
  boats: 1000,
  coupes: 400,
  helicopters: 2000,
  motorcycles: 300,
  muscle: 550,
  offroad: 600,
  sedans: 400,
  sports: 750,
  super: 1500,
  suvs: 600,
  utility: 600,
  vans: 500,
};

function normalizeRangeKey(range: string): string {
  return range.trim().toLowerCase();
}

export function repairPriceForRange(range: string): number {
  if (!range.trim()) {
    return 0;
  }
  return REPAIR_PRICE_BY_RANGE[normalizeRangeKey(range)] ?? 0;
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
