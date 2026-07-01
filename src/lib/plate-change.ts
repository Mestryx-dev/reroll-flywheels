export const PLATE_CHANGE_ID = 'changement_de_plaque';

export function isPlateChangeLine(id: string): boolean {
  return id === PLATE_CHANGE_ID;
}

export interface PlateChangeFields {
  fullName: string;
  vehicleModel: string;
  currentPlate: string;
  newPlate: string;
}

export const emptyPlateChange = (): PlateChangeFields => ({
  fullName: '',
  vehicleModel: '',
  currentPlate: '',
  newPlate: '',
});

/** Format: Lehmall Robert // Rumpo custom // 48DAH601 // ROBY */
export function formatPlateChange(fields: PlateChangeFields): string {
  return [fields.fullName, fields.vehicleModel, fields.currentPlate, fields.newPlate]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' // ');
}

export function canFormatPlateChange(fields: PlateChangeFields): boolean {
  return Boolean(
    fields.fullName.trim() &&
      fields.vehicleModel.trim() &&
      fields.currentPlate.trim() &&
      fields.newPlate.trim(),
  );
}
