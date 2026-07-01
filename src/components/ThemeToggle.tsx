import { useEffect, useState } from 'react';
import {
  applyTheme,
  cycleTheme,
  getStoredTheme,
  type ThemePreference,
  setStoredTheme,
} from '../lib/theme';
import { btnGhost } from '../lib/ui';

const LABELS: Record<ThemePreference, string> = {
  light: 'Clair',
  dark: 'Sombre',
  system: 'Auto',
};

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredTheme());

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function onChange() {
      if (getStoredTheme() === 'system') {
        applyTheme('system');
      }
    }
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  function toggle() {
    const next = cycleTheme(preference);
    setPreference(next);
    setStoredTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={btnGhost}
      title={`Thème : ${LABELS[preference]}`}
      aria-label={`Thème actuel : ${LABELS[preference]}. Cliquer pour changer.`}
    >
      {preference === 'dark' ? '☾' : preference === 'light' ? '☀' : '◐'}{' '}
      {LABELS[preference]}
    </button>
  );
}
