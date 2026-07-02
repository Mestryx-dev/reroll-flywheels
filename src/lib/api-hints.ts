export const PROD_STATIC_HOST = 'flywheels-calc.mestryx.dev';
export const DEV_DEPLOY_HOST = 'flywheels-calc-dev.mestryx.dev';

export function currentHost(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.hostname;
}

export function isProdStaticHost(host = currentHost()): boolean {
  return host === PROD_STATIC_HOST;
}

/** User-facing hint when /api/* returns HTML or is unreachable. */
export function apiUnavailableMessage(options?: { htmlResponse?: boolean }): string {
  const host = currentHost();

  if (isProdStaticHost(host)) {
    return `La prod (${PROD_STATIC_HOST}) est encore en mode statique (branche main, pas d’API SQLite). Utilise https://${DEV_DEPLOY_HOST} pour l’admin et la base.`;
  }

  if (options?.htmlResponse) {
    return `API indisponible (réponse HTML). En local : lance pnpm dev et ouvre l’URL Vite affichée (souvent :5174 si :5173 est pris) — l’API doit tourner sur le port 4783.`;
  }

  return 'API indisponible. Vérifie que le serveur Node flywheels tourne (pnpm dev ou déploiement dev Dokploy).';
}
