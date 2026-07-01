export const PLATE_CHANGE_ID = 'changement_de_plaque';

export function isPlateChangeLine(id: string): boolean {
  return id === PLATE_CHANGE_ID;
}

export interface PlateChangeFields {
  lastName: string;
  firstName: string;
  currentPlate: string;
  newPlate: string;
}

export const emptyPlateChange = (): PlateChangeFields => ({
  lastName: '',
  firstName: '',
  currentPlate: '',
  newPlate: '',
});

function plateChangeFullName(fields: PlateChangeFields): string {
  return [fields.lastName, fields.firstName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
}

/** Format: Lehmall Robert // Rumpo custom // 48DAH601 // ROBY */
export function formatPlateChange(fields: PlateChangeFields, vehicleModel?: string): string {
  return [plateChangeFullName(fields), vehicleModel?.trim(), fields.currentPlate, fields.newPlate]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' // ');
}

export function canFormatPlateChange(
  fields: PlateChangeFields,
  vehicleModel?: string,
): boolean {
  return Boolean(
    fields.lastName.trim() &&
      fields.firstName.trim() &&
      vehicleModel?.trim() &&
      fields.currentPlate.trim() &&
      fields.newPlate.trim(),
  );
}

export function buildPlateChangeCartLine(
  price: number,
  fields: PlateChangeFields,
  vehicle?: { model: string } | null,
): { label: string; amount: number; copyText: string } | null {
  if (!canFormatPlateChange(fields, vehicle?.model)) {
    return null;
  }
  const formatted = formatPlateChange(fields, vehicle?.model);
  return {
    label: formatted,
    amount: price,
    copyText: formatted,
  };
}
