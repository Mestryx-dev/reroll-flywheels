import { useCallback, useEffect, useState } from 'react';
import { DEV_API_PORT } from '../lib/dev-port';
import { AdminLayout } from '../components/admin/AdminLayout';
import { FormulasSection } from '../components/admin/FormulasSection';
import { RepairLinesSection } from '../components/admin/RepairLinesSection';
import { RepairRangesSection } from '../components/admin/RepairRangesSection';
import { useAppConfig } from '../context/ConfigContext';
import { fetchAdminState, type AdminState } from '../lib/admin-api';
import { adminPanel } from '../components/admin/admin-ui';

export function AdminPage() {
  const { reloadConfig } = useAppConfig();
  const [state, setState] = useState<AdminState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchAdminState();
      setState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger l’admin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  async function refreshPublicConfig() {
    await reloadConfig();
  }

  async function handleLinesChange(lines: AdminState['repairLines']) {
    setState((current) => (current ? { ...current, repairLines: lines } : current));
    await refreshPublicConfig();
  }

  async function handleRangesSaved(ranges: AdminState['repairByRange']) {
    setState((current) => (current ? { ...current, repairByRange: ranges } : current));
    await refreshPublicConfig();
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-fg-muted">
        Chargement admin…
      </div>
    );
  }

  if (!state || error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-4 text-center text-fg-muted">
        <p className="max-w-md">
          Admin indisponible{error ? ` : ${error}` : '.'}
        </p>
        <p className="max-w-md text-xs">
          Vérifie que <code className="text-fg">pnpm dev</code> tourne avec l’API sur le port{' '}
          <strong>{DEV_API_PORT}</strong> (évite les conflits avec Next.js sur 3000/3010).
        </p>
        <a href="/" className="text-brand underline">
          Retour calculette
        </a>
      </div>
    );
  }

  return (
    <AdminLayout vehicleCount={state.vehicleCount}>
      <div className={`${adminPanel} divide-y divide-border`}>
        <FormulasSection
          formulas={state.formulas}
          onSaved={(formulas) => {
            setState((current) => (current ? { ...current, formulas } : current));
            void refreshPublicConfig();
          }}
        />
        <RepairLinesSection
          lines={state.repairLines}
          onChange={(lines) => void handleLinesChange(lines)}
        />
        <RepairRangesSection
          ranges={state.repairByRange}
          onSaved={(ranges) => void handleRangesSaved(ranges)}
        />
      </div>
      <p className="mt-2 text-center text-[11px] text-fg-muted">
        Modifications actives sur la calculette · sync Sheet (phase C) à venir
      </p>
    </AdminLayout>
  );
}
