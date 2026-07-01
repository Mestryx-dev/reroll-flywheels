const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatMoney(value: number): string {
  return currency.format(value).replace('US$', '$');
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Stable React key — model alone is not unique in the catalog CSV */
export function catalogVehicleKey(vehicle: {
  model: string;
  range: string;
  dealership: string;
  priceHT: number;
}): string {
  return `${vehicle.model}|${vehicle.range}|${vehicle.dealership}|${vehicle.priceHT}`;
}
