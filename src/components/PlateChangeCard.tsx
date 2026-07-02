import { AnimatePresence, motion } from 'framer-motion';
import type { RepairLine } from '../lib/types';
import type { VehiclePricing } from '../lib/types';
import {
  canFormatPlateChange,
  formatPlateChange,
  type PlateChangeEntry,
  type PlateChangeFields,
} from '../lib/plate-change';
import { formatMoney } from '../lib/format';
import {
  btnGhost,
  btnPrimary,
  inputCompact,
  money,
  panel,
  panelEyebrow,
  panelTitle,
  rowBase,
  textBrand,
  textMuted,
} from '../lib/ui';

interface PlateChangeCardProps {
  line: RepairLine;
  checked: boolean;
  onToggle: () => void;
  fields: PlateChangeFields;
  onFieldsChange: (fields: PlateChangeFields) => void;
  onCommit: () => void;
  committedLines: PlateChangeEntry[];
  onRemoveCommitted: (id: string) => void;
  vehicle: VehiclePricing | null;
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
  onCommit,
  committedLines,
  onRemoveCommitted,
  vehicle,
}: PlateChangeCardProps) {
  const lineTotal = checked ? line.price : 0;
  const vehicleModel = vehicle?.model ?? '';
  const isReady = canFormatPlateChange(fields, vehicleModel);

  function setField<K extends keyof PlateChangeFields>(key: K, value: string) {
    onFieldsChange({ ...fields, [key]: value });
  }

  async function copyFormatted() {
    const text = formatPlateChange(fields, vehicleModel);
    if (!text) return;
    await navigator.clipboard.writeText(text);
  }

  async function copyCommitted(entry: PlateChangeEntry) {
    await navigator.clipboard.writeText(entry.copyText);
  }

  return (
    <section className={panel}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-brand"
          />
          <div className="min-w-0">
            <h2 className={`${panelTitle} leading-snug`}>{line.label}</h2>
            <p
              className={`mt-0.5 ${panelEyebrow} normal-case tracking-wide ${vehicle ? '' : 'opacity-60'}`}
            >
              {vehicle?.model ?? 'Aucun véhicule'}
            </p>
          </div>
        </label>
        <span className={`shrink-0 pt-0.5 text-right text-sm font-semibold ${textBrand} ${money}`}>
          {formatMoney(lineTotal)}
        </span>
      </div>

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
            <div className="space-y-2.5 border-t border-border pt-2.5 text-center">
              <div className="mx-auto grid w-full max-w-md gap-2 px-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={fields.lastName}
                  onChange={(event) => setField('lastName', event.target.value)}
                  placeholder="Nom"
                  className={`${inputCompact} text-xs`}
                />
                <input
                  type="text"
                  value={fields.firstName}
                  onChange={(event) => setField('firstName', event.target.value)}
                  placeholder="Prénom"
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

              <div className="flex flex-wrap items-center justify-center gap-2 px-2">
                <button
                  type="button"
                  onClick={() => void copyFormatted()}
                  disabled={!isReady}
                  className={`${btnGhost} inline-flex h-8 w-8 shrink-0 items-center justify-center p-0`}
                  title="Copier le format ticket"
                  aria-label="Copier le format ticket"
                >
                  <CopyIcon />
                </button>
                <button
                  type="button"
                  onClick={onCommit}
                  disabled={!isReady}
                  className={`${btnPrimary} shrink-0 px-3 py-1.5 text-xs`}
                >
                  + Ligne · {formatMoney(line.price)}
                </button>
              </div>
              {isReady ? (
                <p className={`mx-auto max-w-md px-2 text-[10px] leading-snug break-words ${textMuted}`}>
                  {formatPlateChange(fields, vehicleModel)}
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {committedLines.length > 0 ? (
        <ul className="mt-2 max-h-32 space-y-1.5 overflow-y-auto border-t border-border pt-2.5 pr-0.5">
          <AnimatePresence initial={false}>
            {committedLines.map((entry) => (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, x: -12, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 12, scale: 0.98 }}
                className={`group flex items-center gap-1.5 px-2 py-1.5 text-xs ${rowBase} hover:border-brand/30 hover:bg-brand-subtle`}
              >
                <button
                  type="button"
                  onClick={() => void copyCommitted(entry)}
                  className={`${btnGhost} inline-flex h-7 w-7 shrink-0 items-center justify-center p-0`}
                  title="Copier le format ticket"
                  aria-label="Copier le format ticket"
                >
                  <CopyIcon />
                </button>
                <span className="min-w-0 flex-1 text-fg-secondary leading-snug line-clamp-2" title={entry.label}>
                  {entry.label}
                </span>
                <span className={`shrink-0 font-semibold ${textBrand} ${money}`}>
                  {formatMoney(entry.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveCommitted(entry.id)}
                  className="shrink-0 rounded px-1 text-fg-subtle opacity-0 transition group-hover:opacity-100 hover:bg-brand-subtle hover:text-brand"
                  aria-label="Retirer"
                >
                  ×
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : null}
    </section>
  );
}
