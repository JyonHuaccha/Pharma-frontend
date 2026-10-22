import { environment } from '../../../environments/environment';

const API = environment.apiUrl.replace(/\/+$/, '');

export function esPeticionApi(url: string): boolean {
  return url === API || url.startsWith(`${API}/`) || url.startsWith(`${API}?`);
}

export function esLogin(url: string): boolean {
  return url.split(/[?#]/, 1)[0] === `${API}/auth/login`;
}
