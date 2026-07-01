import type { CatalogVehicle, RepairLine, RepairState, VehiclePricing } from './types';
import { isPlateChangeLine } from './plate-change';
import { isReparationsLine, repairPriceForVehicle } from './repair-prices';

const TTC_RATE = 1.1;
const EXPLOSION_RATE = 0.1;
const NOYADE_RATE = 0.05;
const RACHAT_RATE = 0.5;

export function pricingFromHT(
  model: string,
  range: string,
  priceHT: number,
  dealership = '',
): VehiclePricing {
  return {
    model,
    range,
    priceHT,
    priceTTC: Math.round(priceHT * TTC_RATE),
    explosion: Math.round(priceHT * EXPLOSION_RATE),
    noyade: Math.round(priceHT * NOYADE_RATE),
    rachat: Math.round(priceHT * RACHAT_RATE),
    dealership,
  };
}

export function pricingFromCatalog(vehicle: CatalogVehicle): VehiclePricing {
  return pricingFromHT(vehicle.model, vehicle.range, vehicle.priceHT, vehicle.dealership);
}

export function initialRepairState(repairs: RepairLine[]): RepairState {
  return Object.fromEntries(
    repairs.map((line) => [
      line.id,
      {
        checked: line.defaultChecked,
        qty: line.defaultQty ?? 1,
      },
    ]),
  );
}

export function effectiveRepairPrice(
  line: RepairLine,
  vehicle: VehiclePricing | null | undefined,
): number {
  if (isReparationsLine(line.id)) {
    return repairPriceForVehicle(vehicle);
  }
  return line.price;
}

export function repairLineTotal(
  line: RepairLine,
  checked: boolean,
  qty: number,
  vehicle?: VehiclePricing | null,
): number {
  if (!checked) {
    return 0;
  }
  return effectiveRepairPrice(line, vehicle) * Math.max(qty, 1);
}

export function repairSelectionTotal(
  repairs: RepairLine[],
  state: RepairState,
  vehicle?: VehiclePricing | null,
): number {
  return repairs.reduce((sum, line) => {
    const row = state[line.id];
    return sum + repairLineTotal(line, row?.checked ?? false, row?.qty ?? 1, vehicle);
  }, 0);
}

export function canAddSelectionToCart(
  repairs: RepairLine[],
  state: RepairState,
  vehicle?: VehiclePricing | null,
): boolean {
  return repairs.some((line) => {
    if (isPlateChangeLine(line.id)) {
      return false;
    }
    const row = state[line.id];
    if (!row?.checked) {
      return false;
    }
    return effectiveRepairPrice(line, vehicle) > 0;
  });
}

export function buildCartLinesFromSelection(
  repairs: RepairLine[],
  state: RepairState,
  vehicle?: VehiclePricing | null,
): Array<{ label: string; amount: number }> {
  const prefix = vehicle?.model ? `${vehicle.model} · ` : '';
  const parts: Array<{ part: string; amount: number }> = [];

  for (const line of repairs) {
    if (isPlateChangeLine(line.id)) {
      continue;
    }
    const row = state[line.id];
    if (!row?.checked) {
      continue;
    }
    const qty = Math.max(row.qty, 1);
    const unitPrice = effectiveRepairPrice(line, vehicle);
    if (unitPrice <= 0) {
      continue;
    }
    const qtySuffix = qty > 1 ? ` ×${qty}` : '';
    parts.push({
      part: `${line.label}${qtySuffix}`,
      amount: unitPrice * qty,
    });
  }

  if (parts.length === 0) {
    return [];
  }

  const total = parts.reduce((sum, part) => sum + part.amount, 0);
  const label = `${prefix}${parts.map((part) => part.part).join(', ')}`;

  return [{ label, amount: total }];
}
