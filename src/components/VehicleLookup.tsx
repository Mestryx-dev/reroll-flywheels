import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppConfig } from '../context/ConfigContext';
import { pricingFromCatalog } from '../lib/formulas';
import { formatMoney, normalizeSearch, catalogVehicleKey } from '../lib/format';
import type { VehiclePricing } from '../lib/types';
import { inputCompact, money, panel, panelEyebrow, panelTitle, textBrand } from '../lib/ui';

interface VehicleLookupProps {
  onSelect?: (vehicle: VehiclePricing | null) => void;
  hideInlinePricing?: boolean;
  compact?: boolean;
  /** Restores search field after sessionStorage reload (calculator only). */
  selectedVehicle?: VehiclePricing | null;
}

const MAX_RESULTS = 8;

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

function useDropdownPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  open: boolean,
): DropdownPosition {
  const [position, setPosition] = useState<DropdownPosition>({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      return;
    }

    function update() {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, open]);

  return position;
}

export function VehicleLookup({
  onSelect,
  hideInlinePricing = false,
  compact = false,
  selectedVehicle = null,
}: VehicleLookupProps) {
  const { config } = useAppConfig();
  const vehicles = config?.vehicles ?? [];
  const formulas = config?.formulas;
  const [query, setQuery] = useState(selectedVehicle?.model ?? '');
  const [selected, setSelected] = useState<VehiclePricing | null>(selectedVehicle);
  const inputWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedVehicle) {
      setSelected(selectedVehicle);
      setQuery(selectedVehicle.model);
      return;
    }
    setSelected(null);
  }, [selectedVehicle]);

  const results = useMemo(() => {
    const q = normalizeSearch(query);
    if (q.length < 2 || !formulas) {
      return [];
    }
    return vehicles
      .filter((vehicle) => normalizeSearch(vehicle.model).includes(q))
      .slice(0, MAX_RESULTS)
      .map((vehicle) => pricingFromCatalog(vehicle, formulas));
  }, [query, vehicles, formulas]);

  const dropdownOpen = results.length > 0 && !selected;
  const dropdownPosition = useDropdownPosition(inputWrapRef, dropdownOpen);

  function handleSelect(pricing: VehiclePricing) {
    setSelected(pricing);
    onSelect?.(pricing);
    setQuery(pricing.model);
  }

  const dropdown = (
    <AnimatePresence>
      {dropdownOpen ? (
        <motion.ul
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 9999,
            boxShadow: 'var(--fw-shadow-float)',
          }}
          className="fw-panel max-h-52 overflow-auto p-1"
        >
          {results.map((vehicle) => (
            <li key={catalogVehicleKey(vehicle)}>
              <button
                type="button"
                onClick={() => handleSelect(vehicle)}
                className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm transition hover:bg-brand-subtle"
              >
                <span className="min-w-0 truncate font-semibold text-fg">{vehicle.model}</span>
              </button>
            </li>
          ))}
        </motion.ul>
      ) : null}
    </AnimatePresence>
  );

  return (
    <section className={panel}>
      {!compact ? (
        <div className="mb-2">
          <p className={panelEyebrow}>Catalogue · {vehicles.length} modèles</p>
          <h2 className={panelTitle}>Recherche véhicule</h2>
        </div>
      ) : (
        <p className={`${panelEyebrow} mb-1.5 text-center`}>Véhicule</p>
      )}

      <div ref={inputWrapRef} className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle">
          ⌕
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
            onSelect?.(null);
          }}
          placeholder="Sultan, Maverick, GB200…"
          className={`${inputCompact} w-full pl-7`}
        />
      </div>

      {typeof document !== 'undefined' ? createPortal(dropdown, document.body) : null}

      {selected && !hideInlinePricing ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-brand/25 bg-brand-subtle p-2 sm:grid-cols-5"
        >
          {[
            ['Type', selected.range, false],
            ['HT', formatMoney(selected.priceHT), false],
            ['TTC', formatMoney(selected.priceTTC), true],
            ['Explo.', formatMoney(selected.explosion), false],
            ['Noyade', formatMoney(selected.noyade), false],
          ].map(([label, value, highlight]) => (
            <div key={label as string} className="text-center">
              <p className="text-[10px] uppercase text-fg-muted">{label as string}</p>
              <p
                className={`truncate text-xs font-semibold ${money} ${
                  highlight ? textBrand : 'text-fg'
                }`}
                title={value as string}
              >
                {value as string}
              </p>
            </div>
          ))}
        </motion.div>
      ) : null}
    </section>
  );
}
