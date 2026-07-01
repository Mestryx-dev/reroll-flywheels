import catalog from './catalog.json';
import type { Catalog, CalculatorConfig, CatalogVehicle } from '../lib/types';
import { catalogVehicleKey } from '../lib/format';

export const data = catalog as unknown as Catalog;

function dedupeVehicles(list: CatalogVehicle[]): CatalogVehicle[] {
  const seen = new Set<string>();
  return list.filter((vehicle) => {
    const key = catalogVehicleKey(vehicle);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export const vehicles = dedupeVehicles(data.vehicles);

export const calculatorConfig: CalculatorConfig = {
  repairs: data.repairs,
};
