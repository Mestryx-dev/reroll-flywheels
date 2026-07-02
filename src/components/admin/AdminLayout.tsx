import type { ReactNode } from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { btnGhost, panelEyebrow } from '../../lib/ui';
import { adminShell } from './admin-ui';

interface AdminLayoutProps {
  children: ReactNode;
  vehicleCount: number;
}

export function AdminLayout({ children, vehicleCount }: AdminLayoutProps) {
  return (
    <div className="fw-scene flex min-h-screen flex-col">
      <div className="fw-scene-rust" aria-hidden />

      <header className="fw-header-plate sticky top-0 z-30 shrink-0 backdrop-blur-sm">
        <div
          className={`${adminShell} flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4`}
        >
          <div className="flex min-w-0 items-baseline gap-3">
            <p className={panelEyebrow}>Admin tarifs</p>
            <span className="truncate text-[11px] text-fg-muted">{vehicleCount} véhicules</span>
          </div>
          <div className="flex items-center gap-1.5">
            <a href="/" className={btnGhost}>
              Calculette
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className={`${adminShell} flex-1 px-3 py-3 sm:px-4 sm:py-4`}>{children}</main>
    </div>
  );
}
