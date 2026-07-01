import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { shellCalc, shellCatalog } from '../lib/layout';
import { ThemeToggle } from './ThemeToggle';

type AppView = 'calculator' | 'catalog';

interface LayoutProps {
  children: ReactNode;
  view: AppView;
  onViewChange: (view: AppView) => void;
}

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'calculator', label: 'Calculette' },
  { id: 'catalog', label: 'Catalogue' },
];

export function Layout({ children, view, onViewChange }: LayoutProps) {
  const isCatalog = view === 'catalog';
  const shell = isCatalog ? shellCatalog : shellCalc;

  return (
    <div className="fw-scene flex min-h-screen flex-col">
      <div className="fw-scene-rust" aria-hidden />

      <header className="fw-header-plate sticky top-0 z-30 shrink-0 backdrop-blur-sm">
        <div className={`${shell} relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-2.5 sm:px-5`}>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="fw-logo-badge h-9 w-9 text-sm">FW</div>
            <div>
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-brand">
                Flywheels RP
              </p>
              <h1 className="font-display text-sm tracking-wide text-fg">Calculette garage</h1>
            </div>
          </motion.div>

          <nav className="flex flex-wrap items-center gap-2">
            <div className="fw-nav-rail flex gap-0.5 rounded-lg p-0.5">
              {NAV_ITEMS.map((tab) => {
                const active = view === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onViewChange(tab.id)}
                    className={`font-display relative rounded-md px-3 py-1.5 text-xs tracking-wide transition ${
                      active ? 'text-brand-fg' : 'text-fg-muted hover:text-fg'
                    }`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="main-nav"
                        className="absolute inset-0 rounded-md border border-brand bg-brand shadow-sm"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    ) : null}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className={`fw-content-frame ${shell} relative z-10 ${isCatalog ? 'fw-content-frame--catalog pb-24' : ''}`}>
        {children}
      </main>
    </div>
  );
}
