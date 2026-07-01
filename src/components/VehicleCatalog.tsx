import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vehicles } from '../data';
import { pricingFromCatalog } from '../lib/formulas';
import { formatMoney, normalizeSearch, catalogVehicleKey } from '../lib/format';
import { catalogGrid, catalogShell, shellCatalog } from '../lib/layout';
import type { CatalogVehicle, VehiclePricing } from '../lib/types';
import { btnGhost, inputCompact, money, panelEyebrow, panelTitle, textBrand, textMuted } from '../lib/ui';

type SortKey = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

const CATALOG_HEADER =
  'font-display text-[10px] uppercase tracking-wider text-fg-muted';

const CATALOG_STICKY_TOP = 'top-[58px]';
const CATALOG_HEADER_OFFSET_PX = 58;

function useCatalogFiltersStuck() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: `-${CATALOG_HEADER_OFFSET_PX}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return { sentinelRef, stuck };
}

function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    function sync() {
      setHeight(node?.offsetHeight ?? 0);
    }

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, height };
}

function uniqueSorted(values: string[]): string[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = normalizeSearch(trimmed);
    if (!seen.has(key)) {
      seen.set(key, trimmed);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'fr'));
}

function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>, onSelect: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onSelect();
  }
}

export function VehicleCatalog() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [dealership, setDealership] = useState('');
  const [sort, setSort] = useState<SortKey>('name-asc');
  const [selected, setSelected] = useState<VehiclePricing | null>(null);

  const categories = useMemo(
    () => uniqueSorted(vehicles.map((vehicle) => vehicle.range)),
    [],
  );

  const dealerships = useMemo(
    () => uniqueSorted(vehicles.map((vehicle) => vehicle.dealership)),
    [],
  );

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    let list = vehicles.filter((vehicle) => {
      if (q && !normalizeSearch(vehicle.model).includes(q)) {
        return false;
      }
      if (category && normalizeSearch(vehicle.range) !== normalizeSearch(category)) {
        return false;
      }
      if (dealership && normalizeSearch(vehicle.dealership) !== normalizeSearch(dealership)) {
        return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'name-desc':
          return b.model.localeCompare(a.model, 'fr');
        case 'price-asc':
          return a.priceHT - b.priceHT;
        case 'price-desc':
          return b.priceHT - a.priceHT;
        default:
          return a.model.localeCompare(b.model, 'fr');
      }
    });

    return list;
  }, [query, category, dealership, sort]);

  const { sentinelRef, stuck } = useCatalogFiltersStuck();
  const { ref: filtersRef, height: filtersHeight } = useElementHeight<HTMLDivElement>();
  const columnHeaderTop = CATALOG_HEADER_OFFSET_PX + filtersHeight;

  function selectVehicle(vehicle: CatalogVehicle) {
    setSelected(pricingFromCatalog(vehicle));
  }

  function resetFilters() {
    setQuery('');
    setCategory('');
    setDealership('');
    setSort('name-asc');
    setSelected(null);
  }

  const hasFilters = query || category || dealership || sort !== 'name-asc';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`overflow-x-auto ${catalogShell}`}
    >
      <div ref={sentinelRef} className="h-px" aria-hidden />

      <header
        ref={filtersRef}
        className={`sticky ${CATALOG_STICKY_TOP} z-30 fw-catalog-filters pb-3 ${stuck ? 'is-stuck' : ''}`}
      >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className={panelEyebrow}>Catalogue complet</p>
              <h2 className={panelTitle}>
                <span className={textBrand}>{filtered.length}</span>
                <span className={textMuted}> / {vehicles.length} véhicules</span>
              </h2>
            </div>
            {hasFilters ? (
              <button type="button" onClick={resetFilters} className={btnGhost}>
                Réinitialiser
              </button>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(null);
              }}
              placeholder="Rechercher un modèle…"
              className={`${inputCompact} w-full`}
            />
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setSelected(null);
              }}
              className={`${inputCompact} w-full`}
            >
              <option value="">Toutes les catégories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={dealership}
              onChange={(event) => {
                setDealership(event.target.value);
                setSelected(null);
              }}
              className={`${inputCompact} w-full`}
            >
              <option value="">Toutes les concessions</option>
              {dealerships.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className={`${inputCompact} w-full`}
            >
              <option value="name-asc">Nom A → Z</option>
              <option value="name-desc">Nom Z → A</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>

          <div className="fw-catalog-divider mt-3" aria-hidden />
        </header>

        <div
          className={`${catalogGrid} sticky z-20 border-y border-border bg-surface py-2`}
          style={{ top: columnHeaderTop }}
        >
          <span className={CATALOG_HEADER}>Modèle</span>
          <span className={CATALOG_HEADER}>Catégorie</span>
          <span className={CATALOG_HEADER}>Concession</span>
          <span className={`${CATALOG_HEADER} text-right`}>Prix HT</span>
          <span className={`${CATALOG_HEADER} text-right`}>TTC</span>
          <span className={`${CATALOG_HEADER} text-right`}>Rachat</span>
        </div>

        {filtered.length === 0 ? (
          <p className={`py-16 text-center text-sm ${textMuted}`}>
            Aucun véhicule ne correspond aux filtres.
          </p>
        ) : (
          filtered.map((vehicle, index) => {
            const pricing = pricingFromCatalog(vehicle);
            const rowKey = `${catalogVehicleKey(vehicle)}#${index}`;
            const active =
              selected !== null && catalogVehicleKey(selected) === catalogVehicleKey(vehicle);

            return (
              <div
                key={rowKey}
                role="button"
                tabIndex={0}
                onClick={() => selectVehicle(vehicle)}
                onKeyDown={(event) => handleRowKeyDown(event, () => selectVehicle(vehicle))}
                className={`${catalogGrid} fw-catalog-row border-b border-border py-2.5 ${active ? 'is-active' : ''}`}
              >
                <span
                  className={`min-w-0 truncate font-semibold ${active ? textBrand : 'text-fg'}`}
                >
                  {vehicle.model}
                </span>
                <span className="fw-badge max-w-full truncate">{vehicle.range}</span>
                <span className={`min-w-0 truncate ${textMuted}`}>
                  {vehicle.dealership || '—'}
                </span>
                <span className={`text-right text-fg ${money}`}>
                  {formatMoney(vehicle.priceHT)}
                </span>
                <span className={`text-right text-fg-secondary ${money}`}>
                  {formatMoney(pricing.priceTTC)}
                </span>
                <span className={`text-right font-semibold ${textBrand} ${money}`}>
                  {formatMoney(pricing.rachat)}
                </span>
              </div>
            );
          })
        )}

      <AnimatePresence>
        {selected ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-brand/25 bg-surface-overlay py-3 backdrop-blur-xl"
            style={{ boxShadow: 'var(--fw-shadow-float)' }}
          >
            <div className={`${shellCatalog} flex flex-wrap items-center justify-between gap-4 px-4 sm:px-5`}>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-fg">{selected.model}</p>
                <p className={`text-xs ${textMuted}`}>{selected.range}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ['Concess', formatMoney(selected.priceHT), false],
                  ['TTC', formatMoney(selected.priceTTC), false],
                  ['Explo.', formatMoney(selected.explosion), false],
                  ['Noyade', formatMoney(selected.noyade), false],
                  ['Rachat', formatMoney(selected.rachat), true],
                ].map(([label, value, highlight]) => (
                  <div
                    key={label as string}
                    className={`rounded-lg border px-3 py-1.5 text-center ${
                      highlight
                        ? 'border-brand/30 bg-brand-subtle'
                        : 'border-border bg-surface-sunken'
                    }`}
                  >
                    <p className={`text-[10px] uppercase ${textMuted}`}>{label as string}</p>
                    <p
                      className={`text-xs font-bold ${money} ${
                        highlight ? textBrand : 'text-fg'
                      }`}
                    >
                      {value as string}
                    </p>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setSelected(null)} className={btnGhost}>
                Fermer
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
