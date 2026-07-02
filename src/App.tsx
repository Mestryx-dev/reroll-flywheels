import { DEV_API_PORT } from './lib/dev-port';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ConfigProvider, useAppConfig } from './context/ConfigContext';
import { Layout } from './components/Layout';
import { CalculatorPanel } from './components/CalculatorPanel';
import { VehicleCatalog } from './components/VehicleCatalog';
import { RpDisclaimerModal, useRpDisclaimerVisible } from './components/RpDisclaimerModal';
import { AdminPage } from './pages/AdminPage';
import { isAdminPath, usePathname } from './hooks/usePathname';

type View = 'calculator' | 'catalog';

function PublicApp() {
  const { config, loading, error, configSource } = useAppConfig();
  const [view, setView] = useState<View>('calculator');
  const [disclaimerOpen, dismissDisclaimer] = useRpDisclaimerVisible();

  const calculatorConfigKey = useMemo(() => {
    if (!config) {
      return '';
    }
    return JSON.stringify({
      repairs: config.repairs.map((line) => ({
        id: line.id,
        price: line.price,
        defaultChecked: line.defaultChecked,
        defaultQty: line.defaultQty,
      })),
      repairByRange: config.repairByRange,
    });
  }, [config]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-fg-muted">
        Chargement de la configuration…
      </div>
    );
  }

  if (!config || error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-4 text-center text-fg-muted">
        Impossible de charger la configuration
        {error ? ` : ${error}` : '.'}
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {disclaimerOpen ? (
          <RpDisclaimerModal key="rp-disclaimer" onAcknowledge={dismissDisclaimer} />
        ) : null}
      </AnimatePresence>
      <div inert={disclaimerOpen ? true : undefined} aria-hidden={disclaimerOpen ? true : undefined}>
        <Layout view={view} onViewChange={setView}>
        {configSource === 'fallback' ? (
          <p className="mb-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-800 dark:text-amber-200">
            Mode hors-ligne : données depuis <code>catalog.json</code> (API / SQLite non joignable).
            Relance <code>pnpm dev</code> — API sur le port {DEV_API_PORT}.
          </p>
        ) : null}
        <AnimatePresence mode="wait">
          {view === 'catalog' ? (
            <VehicleCatalog key="catalog" />
          ) : (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <CalculatorPanel configKey={calculatorConfigKey} />
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>
      </div>
    </>
  );
}

function AppContent() {
  const pathname = usePathname();

  if (isAdminPath(pathname)) {
    return <AdminPage />;
  }

  return <PublicApp />;
}

function App() {
  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  );
}

export default App;
