import type { CatalogVehicle, RepairLine, RepairState, VehiclePricing } from './types';
import { isPlateRepairLine, isRangeBasedRepairLine } from './line-kind';
import { getFormulas } from './runtime-catalog';
import { repairPriceForVehicle } from './repair-prices';

export function pricingFromHT(
  model: string,
  range: string,
  priceHT: number,
  dealership = '',
): VehiclePricing {
  const rates = getFormulas();
  return {
    model,
    range,
    priceHT,
    priceTTC: Math.round(priceHT * rates.ttcRate),
    explosion: Math.round(priceHT * rates.explosionRate),
    noyade: Math.round(priceHT * rates.noyadeRate),
    rachat: Math.round(priceHT * rates.rachatRate),
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
  if (isRangeBasedRepairLine(line)) {
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
    if (isPlateRepairLine(line)) {
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
    if (isPlateRepairLine(line)) {
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
