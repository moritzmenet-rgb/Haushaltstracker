/**
 * Runs on the OLD address (GitHub Pages). Reads this device's own unlock (its device
 * doc holds the family code it was unlocked with) and the chosen profile, then opens
 * fishandwish.web.app with them in the URL fragment, which no server ever sees.
 * Anything missing or slow: just forward without it (the code prompt then appears).
 */
import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
  signInAnonymously,
} from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { encodeUmzug } from '../../src/utils/umzug';

const EMULATOR = import.meta.env.MODE === 'emulator';
const TARGET = EMULATOR ? 'http://localhost:3001/' : 'https://fishandwish.web.app/';
const HH = 'households/main_household';

let done = false;
const go = (hash = '') => {
  if (done) return;
  done = true;
  window.location.replace(TARGET + hash);
};
const fallback = setTimeout(() => go(), 6000);

const read = (k: string) => {
  try { return localStorage.getItem(k); } catch { return null; }
};

async function clearOldServiceWorker() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    const keys = (await caches?.keys?.()) ?? [];
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch { /* ignore */ }
}

async function run() {
  await clearOldServiceWorker();
  const payload: Record<string, string> = {};
  const profile = read('household_chore_active_user_id');
  const theme = read('household_chore_theme');
  const color = read('household_chore_color_theme');
  if (profile) payload.p = profile;
  if (theme) payload.t = theme;
  if (color) payload.ct = color;
  // small device settings that should survive the move
  const haptics = read('jarvis_haptics_enabled');
  const snow = read('wichteln_snow');
  if (haptics) payload.h = haptics;
  if (snow) payload.s = snow;
  try {
    const seen: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('wichteln_connect_gesehen_')) seen[k.slice('wichteln_connect_gesehen_'.length)] = localStorage.getItem(k) ?? '';
    }
    if (Object.keys(seen).length) payload.g = JSON.stringify(seen);
  } catch { /* ignore */ }

  const app = initializeApp(EMULATOR ? { ...firebaseConfig, projectId: 'demo-fishwish' } : firebaseConfig);
  const auth = initializeAuth(app, { persistence: [browserLocalPersistence, indexedDBLocalPersistence] });
  const db = getFirestore(app);
  if (EMULATOR) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    // test only: simulate a device unlocked on the old address (?test=CODE:profileId)
    const t = new URLSearchParams(location.search).get('test');
    if (t) {
      const [code, member] = t.split(':');
      const u = (await signInAnonymously(auth)).user;
      await setDoc(doc(db, `${HH}/devices/${u.uid}`), { uid: u.uid, code, label: 'Testhandy Ä', device_type: 'phone', created_at: new Date().toISOString() });
      payload.p = member;
    }
  }
  await auth.authStateReady();
  const user = auth.currentUser;
  if (user && user.isAnonymous) {
    const snap = await getDoc(doc(db, `${HH}/devices/${user.uid}`));
    const d = snap.exists() ? snap.data() : null;
    if (d && typeof d.code === 'string') {
      payload.c = d.code;
      if (typeof d.label === 'string') payload.l = d.label;
    }
  }
  clearTimeout(fallback);
  go(Object.keys(payload).length ? `#umzug=${encodeUmzug(payload)}` : '');
}

run().catch(() => go());
