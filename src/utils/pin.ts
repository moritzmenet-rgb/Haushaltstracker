import type { FamilyMember } from '../types';

/**
 * PIN handling: PINs are never stored in plain text anymore.
 * We store a PBKDF2-SHA256 hash, salted with the member id.
 * Format: "pbkdf2$<iterations>$<hex>"
 */
const PBKDF2_ITERATIONS = 100_000;
const SALT_PREFIX = 'fish-and-wish:pin:';

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

export const isValidPinFormat = (pin: string) => /^\d{4}$/.test(pin);

export async function hashPin(memberId: string, pin: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(SALT_PREFIX + memberId), iterations },
    key,
    256
  );
  return `pbkdf2$${iterations}$${toHex(bits)}`;
}

/** True if the member has a PIN (hashed or legacy plain text). */
export function memberHasPin(member?: Partial<FamilyMember> | null): boolean {
  if (!member) return false;
  return Boolean(member.pin_hash) || Boolean(member.pin_code && String(member.pin_code).trim().length > 0);
}

/** Checks an entered PIN against the stored hash (or the legacy plain PIN during migration). */
export async function verifyPin(member: Partial<FamilyMember> & { id: string }, entered: string): Promise<boolean> {
  if (member.pin_hash) {
    const [scheme, iter] = member.pin_hash.split('$');
    if (scheme !== 'pbkdf2') return false;
    const candidate = await hashPin(member.id, entered, Number(iter) || PBKDF2_ITERATIONS);
    return candidate === member.pin_hash;
  }
  if (member.pin_code) {
    return String(member.pin_code) === entered;
  }
  return false;
}
