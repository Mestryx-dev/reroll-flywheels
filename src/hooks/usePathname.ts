import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void): () => void {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function getPathname(): string {
  return window.location.pathname;
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, getPathname, () => '/');
}

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}
