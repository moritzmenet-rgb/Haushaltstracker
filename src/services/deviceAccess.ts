import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { HOUSEHOLD_ID } from './firestoreSync';

/**
 * Geräte-Schutz (device unlock with the family code)
 *
 * - households/main_household/private/access  { code, enforce }  -> only Moritz can read/write
 * - households/main_household/devices/{uid}   one doc per unlocked device (anonymous auth uid)
 *
 * The Firestore rules only allow creating a device doc when its `code` matches the secret code.
 * When `enforce` is true, the rules only let unlocked devices (and Moritz) access household data.
 */

export const MORITZ_EMAIL = 'moritz.menet.bfsu@gmail.com';

// Letters + digits without look-alikes (0/O, 1/I/L)
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 8;

export interface UnlockedDevice {
  uid: string;
  label: string;
  device_type: string;
  created_at: string;
}

export interface AccessConfig {
  code: string | null;
  enforce: boolean;
}

const accessRef = () => doc(db, 'households', HOUSEHOLD_ID, 'private', 'access');
const deviceRef = (uid: string) => doc(db, 'households', HOUSEHOLD_ID, 'devices', uid);
const householdRef = () => doc(db, 'households', HOUSEHOLD_ID);

/** Uppercase, strip spaces/dashes and anything outside the alphabet. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** "K7M4P9XQ" -> "K7M4-P9XQ" */
export function formatCode(code: string): string {
  const c = normalizeCode(code);
  return c.length > 4 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}

export function isValidCode(code: string): boolean {
  const c = normalizeCode(code);
  return c.length === CODE_LENGTH && [...c].every(ch => CODE_ALPHABET.includes(ch));
}

export function generateCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export function detectDeviceType(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  if (/Mobi|Android/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

/** Rejects after `ms` so a hanging request never blocks the app. */
function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'timeout' })), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

export type RegistrationCheck = 'yes' | 'no' | 'error';

/**
 * Asks the SERVER whether this device (anonymous uid) is in the list of unlocked devices.
 * 'error' = no answer (offline, timeout) – never treated as "locked".
 */
export async function checkDeviceRegistration(uid: string): Promise<RegistrationCheck> {
  try {
    const snap = await withTimeout(getDoc(deviceRef(uid)));
    return snap.exists() ? 'yes' : 'no';
  } catch (err: any) {
    return err?.code === 'permission-denied' ? 'no' : 'error';
  }
}

export type HouseholdProbe = 'denied' | 'error' | { lockEnabled: boolean };

/**
 * For a device that is NOT unlocked: is the household protected right now?
 * - 'denied'  -> database protection is on, this device has no access
 * - { lockEnabled } -> household is readable (rollout phase); lockEnabled = code prompt switched on
 * - 'error'   -> no answer (offline, timeout)
 */
export async function probeHouseholdAccess(): Promise<HouseholdProbe> {
  try {
    const snap = await withTimeout(getDoc(householdRef()));
    return { lockEnabled: snap.exists() && snap.data()?.device_lock_enabled === true };
  } catch (err: any) {
    return err?.code === 'permission-denied' ? 'denied' : 'error';
  }
}

export type UnlockResult = 'ok' | 'wrong_code' | 'error';

/** Registers this device. The rules reject it unless the code is correct. */
export async function registerDevice(uid: string, code: string, label: string): Promise<UnlockResult> {
  const cleanCode = normalizeCode(code);
  if (!isValidCode(cleanCode)) return 'wrong_code';
  try {
    await setDoc(deviceRef(uid), {
      uid,
      code: cleanCode,
      label: (label.trim() || `${detectDeviceType()}-Gerät`).slice(0, 60),
      device_type: detectDeviceType(),
      created_at: new Date().toISOString()
    });
    return 'ok';
  } catch (err: any) {
    console.warn('Device unlock failed:', err?.code || err);
    return err?.code === 'permission-denied' ? 'wrong_code' : 'error';
  }
}

// ---------------------------------------------------------------------------
// Admin (Moritz) only – the rules reject these for everybody else
// ---------------------------------------------------------------------------

export async function getAccessConfig(): Promise<AccessConfig> {
  const snap = await getDoc(accessRef());
  const d = snap.exists() ? snap.data() : {};
  return { code: typeof d.code === 'string' ? d.code : null, enforce: d.enforce === true };
}

export async function saveAccessCode(code: string): Promise<void> {
  const clean = normalizeCode(code);
  if (!isValidCode(clean)) throw new Error('Ungültiger Code');
  await setDoc(accessRef(), { code: clean, updated_at: new Date().toISOString() }, { merge: true });
}

export async function setEnforcement(enforce: boolean): Promise<void> {
  await setDoc(accessRef(), { enforce, updated_at: new Date().toISOString() }, { merge: true });
}

export async function setDeviceLockEnabled(enabled: boolean): Promise<void> {
  await setDoc(householdRef(), { device_lock_enabled: enabled, updatedAt: new Date().toISOString() }, { merge: true });
}

export function subscribeDevices(cb: (devices: UnlockedDevice[]) => void, onError?: (e: unknown) => void) {
  return onSnapshot(
    collection(db, 'households', HOUSEHOLD_ID, 'devices'),
    snap => {
      const list: UnlockedDevice[] = [];
      snap.forEach(d => {
        const x = d.data();
        list.push({
          uid: d.id,
          label: String(x.label || 'Gerät'),
          device_type: String(x.device_type || ''),
          created_at: String(x.created_at || '')
        });
      });
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
      cb(list);
    },
    err => onError?.(err)
  );
}

export async function revokeDevice(uid: string): Promise<void> {
  await deleteDoc(deviceRef(uid));
}
