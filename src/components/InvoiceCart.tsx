import { motion, AnimatePresence } from 'framer-motion';
import type { CartLine } from '../lib/cart';
import { cartTotal } from '../lib/cart';
import { formatMoney } from '../lib/format';
import {
  btnGhost,
  btnPrimary,
  money,
  panel,
  panelAccent,
  panelEyebrow,
  panelHeader,
  panelTitle,
  rowBase,
  textBrand,
  textMuted,
} from '../lib/ui';

interface InvoiceCartProps {
  lines: CartLine[];
  onRemove: (id: string) => void;
  onClear: () => void;
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

export function InvoiceCart({ lines, onRemove, onClear }: InvoiceCartProps) {
  const total = cartTotal(lines);

  async function copyLine(line: CartLine) {
    const text = line.copyText ?? line.label;
    await navigator.clipboard.writeText(text);
  }

  async function copyCart() {
    const text = [
      'FACTURE FLYWHEELS',
      ...lines.map((line) => `${line.label}: ${formatMoney(line.amount)}`),
      `Total: ${formatMoney(total)}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
  }

  return (
    <section className={panel}>
      <div className={panelHeader}>
        <h2 className={panelTitle}>Panier · {lines.length} ligne{lines.length !== 1 ? 's' : ''}</h2>
        <div className="flex gap-1.5">
          {lines.length > 0 ? (
            <button type="button" onClick={onClear} className={btnGhost}>
              Vider
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void copyCart()}
            disabled={lines.length === 0}
            className={btnGhost}
          >
            Copier
          </button>
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-sunken py-8 text-center">
          <p className={`mt-2 text-xs ${textMuted}`}>Panier vide</p>
          <p className="mt-1 max-w-[200px] text-[10px] leading-relaxed text-fg-subtle">
            Coche des lignes puis ajoute-les au panier
          </p>
        </div>
      ) : (
        <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-0.5">
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              <motion.li
                key={line.id}
                layout
                initial={{ opacity: 0, x: -12, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 12, scale: 0.98 }}
                className={`group flex items-center gap-1.5 px-2 py-1.5 text-xs ${rowBase} hover:border-brand/30 hover:bg-brand-subtle`}
              >
                <button
                  type="button"
                  onClick={() => void copyLine(line)}
                  className={`${btnGhost} inline-flex h-7 w-7 shrink-0 items-center justify-center p-0`}
                  title="Copier la ligne"
                  aria-label="Copier la ligne"
                >
                  <CopyIcon />
                </button>
                <span className="min-w-0 flex-1 truncate text-fg-secondary">{line.label}</span>
                <span className={`shrink-0 font-semibold ${textBrand} ${money}`}>
                  {formatMoney(line.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(line.id)}
                  className="shrink-0 rounded px-1 text-fg-subtle opacity-0 transition group-hover:opacity-100 hover:bg-brand-subtle hover:text-brand"
                  aria-label="Retirer"
                >
                  ×
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between rounded-lg border border-brand/25 bg-brand-subtle px-3 py-2">
        <span className="text-sm font-medium text-fg-secondary">Total panier</span>
        <span className={`text-lg font-bold ${textBrand} ${money}`}>{formatMoney(total)}</span>
      </div>
    </section>
  );
}

export function TotalBadge({
  total,
  onValidate,
  canValidate,
}: {
  total: number;
  onValidate: () => void;
  canValidate: boolean;
}) {
  return (
    <section className={`${panelAccent} flex w-full flex-col items-center justify-center gap-3 text-center`}>
      <div className="w-full">
        <p className={panelEyebrow}>Total à facturer</p>
        <p className={`mt-1 font-display text-3xl leading-none ${textBrand} ${money}`}>
          {formatMoney(total)}
        </p>
      </div>
      <button
        type="button"
        onClick={onValidate}
        disabled={!canValidate}
        className={`${btnPrimary} w-full`}
      >
        Valider facture
      </button>
    </section>
  );
}
