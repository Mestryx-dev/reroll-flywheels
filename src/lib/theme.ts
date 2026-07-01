export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'flywheels-calc-theme';

export function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

export function setStoredTheme(preference: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, preference);
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(preference: ThemePreference): 'light' | 'dark' {
  const resolved = resolveTheme(preference);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function initTheme(): 'light' | 'dark' {
  return applyTheme(getStoredTheme());
}

export function cycleTheme(current: ThemePreference): ThemePreference {
  const order: ThemePreference[] = ['light', 'dark', 'system'];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length] ?? 'system';
}
