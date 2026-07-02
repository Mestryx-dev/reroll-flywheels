import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { catalogVehicleKey } from '../lib/format';
import {
  setRuntimeCatalog,
  type AppConfig,
} from '../lib/runtime-catalog';
import type { Catalog, CatalogVehicle } from '../lib/types';
import fallbackCatalog from '../data/catalog.json';
import { readJsonResponse } from '../lib/api-fetch';

interface ConfigContextValue {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  configSource: 'api' | 'fallback' | null;
  reloadConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue>({
  config: null,
  loading: true,
  error: null,
  configSource: null,
  reloadConfig: async () => {},
});

function dedupeVehicles(list: CatalogVehicle[]): CatalogVehicle[] {
  const seen = new Set<string>();
  return list.filter((vehicle) => {
    const key = catalogVehicleKey(vehicle);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function fetchAppConfig(): Promise<{ config: AppConfig; source: 'api' | 'fallback' }> {
  try {
    const response = await fetch('/api/config');
    const data = await readJsonResponse<AppConfig>(response);
    return { config: data, source: 'api' };
  } catch {
    // API down or wrong process on proxy port — use bundled catalog.json.
  }

  const catalog = fallbackCatalog as Catalog;
  return {
    source: 'fallback',
    config: {
      vehicles: catalog.vehicles,
      repairs: catalog.repairs,
      repairByRange: catalog.repairByRange ?? {},
      formulas: {
        ttcRate: 1.1,
        explosionRate: 0.1,
        noyadeRate: 0.05,
      },
    },
  };
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [configSource, setConfigSource] = useState<'api' | 'fallback' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async (): Promise<void> => {
    const { config: data, source } = await fetchAppConfig();
    const next: AppConfig = {
      ...data,
      vehicles: dedupeVehicles(data.vehicles),
    };
    setRuntimeCatalog(next);
    setConfig(next);
    setConfigSource(source);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadConfig()
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load config';
        setError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadConfig]);

  const reloadConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  const value = useMemo(
    () => ({
      config,
      loading,
      error,
      configSource,
      reloadConfig,
    }),
    [config, loading, error, configSource, reloadConfig],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useAppConfig(): ConfigContextValue {
  return useContext(ConfigContext);
}
