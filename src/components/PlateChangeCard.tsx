import { AnimatePresence, motion } from 'framer-motion';
import type { RepairLine } from '../lib/types';
import {
  canFormatPlateChange,
  formatPlateChange,
  type PlateChangeFields,
} from '../lib/plate-change';
import { formatMoney } from '../lib/format';
import {
  btnGhost,
  inputCompact,
  money,
  panel,
  panelHeader,
  panelTitle,
  textBrand,
  textMuted,
} from '../lib/ui';

interface PlateChangeCardProps {
  line: RepairLine;
  checked: boolean;
  onToggle: () => void;
  fields: PlateChangeFields;
  onFieldsChange: (fields: PlateChangeFields) => void;
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
    </svg>
  );
}

export function PlateChangeCard({
  line,
  checked,
  onToggle,
  fields,
  onFieldsChange,
}: PlateChangeCardProps) {
  const lineTotal = checked ? line.price : 0;

  function setField<K extends keyof PlateChangeFields>(key: K, value: string) {
    onFieldsChange({ ...fields, [key]: value });
  }

  async function copyFormatted() {
    const text = formatPlateChange(fields);
    if (!text) return;
    await navigator.clipboard.writeText(text);
  }

  return (
    <section className={panel}>
      <label className={`${panelHeader} cursor-pointer`}>
        <span className="flex min-w-0 items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="h-4 w-4 shrink-0 rounded border-border accent-brand"
          />
          <h2 className={panelTitle}>{line.label}</h2>
        </span>
        <span className={`shrink-0 text-sm font-semibold ${textBrand} ${money}`}>
          {formatMoney(lineTotal)}
        </span>
      </label>

      <AnimatePresence initial={false}>
        {checked ? (
          <motion.div
            key="plate-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-border pt-2.5">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={fields.fullName}
                  onChange={(event) => setField('fullName', event.target.value)}
                  placeholder="Nom prénom"
                  className={`${inputCompact} text-xs`}
                />
                <input
                  type="text"
                  value={fields.vehicleModel}
                  onChange={(event) => setField('vehicleModel', event.target.value)}
                  placeholder="Modèle véhicule"
                  className={`${inputCompact} text-xs`}
                />
                <input
                  type="text"
                  value={fields.currentPlate}
                  onChange={(event) => setField('currentPlate', event.target.value)}
                  placeholder="Plaque actuelle"
                  className={`${inputCompact} text-xs uppercase`}
                />
                <input
                  type="text"
                  value={fields.newPlate}
                  onChange={(event) => setField('newPlate', event.target.value)}
                  placeholder="Nouvelle plaque"
                  className={`${inputCompact} text-xs uppercase`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyFormatted()}
                  disabled={!canFormatPlateChange(fields)}
                  className={`${btnGhost} inline-flex items-center gap-1.5`}
                  title="Copier le format ticket"
                >
                  <CopyIcon />
                  Copier
                </button>
                {canFormatPlateChange(fields) ? (
                  <p className={`min-w-0 flex-1 truncate text-[10px] ${textMuted}`}>
                    {formatPlateChange(fields)}
                  </p>
                ) : (
                  <p className="text-[10px] text-fg-subtle">Remplis les 4 champs pour copier</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
