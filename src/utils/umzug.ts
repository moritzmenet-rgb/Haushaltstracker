/**
 * Move from the old GitHub Pages address to fishandwish.web.app without unlocking
 * every device again. The old address (tools/redirect) reads the device's own
 * unlock and profile and passes them in the URL fragment (#umzug=...), which never
 * reaches a server. Here we take it out of the URL right away and keep it in
 * sessionStorage until the app has registered the device with it.
 */
export interface Umzug {
  /** family code (from this device's own device doc on the old address) */
  c?: string;
  /** device label */
  l?: string;
  /** selected profile (member id) */
  p?: string;
}

const PENDING_KEY = 'fish_wish_umzug';
const THEME_KEY = 'household_chore_theme';
const COLOR_THEME_KEY = 'household_chore_color_theme';

export function encodeUmzug(data: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeUmzug(s: string): Record<string, unknown> | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const v = JSON.parse(new TextDecoder().decode(bytes));
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

const str = (v: unknown, max: number) => (typeof v === 'string' && v.length > 0 ? v.slice(0, max) : undefined);

/** Call once before the app renders. */
export function takeUmzugFromUrl(): void {
  if (typeof window === 'undefined') return;
  const m = window.location.hash.match(/^#umzug=([A-Za-z0-9_-]+)$/);
  if (!m) return;
  // remove it from the address bar and the history entry first
  try {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  } catch { /* ignore */ }
  const data = decodeUmzug(m[1]);
  if (!data) return;
  try {
    const t = str(data.t, 10);
    if ((t === 'light' || t === 'dark') && !localStorage.getItem(THEME_KEY)) localStorage.setItem(THEME_KEY, t);
    const ct = str(data.ct, 20);
    if (ct && !localStorage.getItem(COLOR_THEME_KEY)) localStorage.setItem(COLOR_THEME_KEY, ct);
  } catch { /* ignore */ }
  const pending: Umzug = { c: str(data.c, 32), l: str(data.l, 60), p: str(data.p, 128) };
  if (!pending.c && !pending.p) return;
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending)); } catch { /* ignore */ }
}

export function readPendingUmzug(): Umzug | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as Umzug) : null;
  } catch {
    return null;
  }
}

export function clearPendingUmzug(): void {
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}
