import { environment } from '../../../environments/environment';

export function esPeticionApi(url: string, apiUrl = environment.apiUrl): boolean {
  const origen = globalThis.location.origin;
  const api = new URL(apiUrl, origen);
  const destino = new URL(url, origen);
  const ruta = api.pathname.replace(/\/+$/, '');
  return destino.origin === api.origin &&
    (destino.pathname === ruta || destino.pathname.startsWith(`${ruta}/`));
}

export function esLogin(url: string): boolean {
  const origen = globalThis.location.origin;
  const api = new URL(environment.apiUrl, origen);
  const destino = new URL(url, origen);
  return destino.origin === api.origin &&
    destino.pathname === `${api.pathname.replace(/\/+$/, '')}/auth/login`;
}
