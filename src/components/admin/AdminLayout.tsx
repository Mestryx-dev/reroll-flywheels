import type { ReactNode } from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { btnGhost, panelEyebrow, panelTitle } from '../../lib/ui';

interface AdminLayoutProps {
  children: ReactNode;
  vehicleCount: number;
}

export function AdminLayout({ children, vehicleCount }: AdminLayoutProps) {
  return (
    <div className="fw-scene flex min-h-screen flex-col">
      <div className="fw-scene-rust" aria-hidden />

      <header className="fw-header-plate sticky top-0 z-30 shrink-0 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-2.5 sm:px-5">
          <div>
            <p className={panelEyebrow}>Flywheels · Direction</p>
            <h1 className={panelTitle}>Administration tarifs</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-fg-muted">{vehicleCount} véhicules en base</span>
            <a href="/" className={btnGhost}>
              ← Calculette
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-5 sm:py-6">
        <div className="space-y-4">{children}</div>
      </main>
    </div>
  );
}
