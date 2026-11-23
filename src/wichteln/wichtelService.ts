import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { HOUSEHOLD_ID } from '../services/firestoreSync';
import { hashPin, verifyPin } from '../utils/pin';
import type { NewWishInput, Wish, WishClaim, WichtelAssignment, WichtelPin } from './types';

/*
 * All Wichteln data lives next to the household data and is protected like it
 * (unlocked devices only). The Wichtel-PIN is checked in the app: a family
 * decision, nobody is expected to dig through the browser tools. The app only
 * ever loads what the active person may see (never claims on own wishes).
 */
const HH = `households/${HOUSEHOLD_ID}`;
const seasonPath = (season: string) => `${HH}/wichteln/${season}`;

const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Wichtel-PIN (separate from the profile PIN: different salt, 6 digits)
// ---------------------------------------------------------------------------

const pinSaltId = (memberId: string) => `wichteln:${memberId}`;

export function subscribePin(
  memberId: string,
  onData: (pinHash: string | null) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    doc(db, `${HH}/wichteln_pins/${memberId}`),
    (snap) => onData(snap.exists() ? (snap.data() as WichtelPin).pin_hash : null),
    onError,
  );
}

export async function createWichtelPin(memberId: string, pin: string): Promise<void> {
  const pin_hash = await hashPin(pinSaltId(memberId), pin);
  await setDoc(doc(db, `${HH}/wichteln_pins/${memberId}`), {
    member_id: memberId,
    pin_hash,
    created_at: nowIso(),
  });
}

export function checkWichtelPin(memberId: string, pinHash: string, entered: string): Promise<boolean> {
  return verifyPin({ id: pinSaltId(memberId), pin_hash: pinHash }, entered);
}

/** Human-readable message for loading/saving problems. */
export function describeError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'permission-denied') return 'Dieses Gerät ist nicht freigeschaltet. Gib zuerst den Familien-Code ein.';
  if (code === 'unavailable') return 'Keine Verbindung. Prüf dein Internet und versuch es nochmal.';
  return 'Das hat nicht geklappt. Versuch es nochmal.';
}

// ---------------------------------------------------------------------------
// Assignment ("Wen beschenkst du?")
// ---------------------------------------------------------------------------

export function subscribeAssignment(
  season: string,
  memberId: string,
  onData: (assignment: WichtelAssignment | null) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    doc(db, `${seasonPath(season)}/assign/${memberId}`),
    (snap) => onData(snap.exists() ? (snap.data() as WichtelAssignment) : null),
    onError,
  );
}

export async function saveAssignment(season: string, giverId: string, receivers: [string, string]) {
  await setDoc(doc(db, `${seasonPath(season)}/assign/${giverId}`), {
    giver_id: giverId,
    receivers,
    created_at: nowIso(),
  });
}

// ---------------------------------------------------------------------------
// Wishes
// ---------------------------------------------------------------------------

export function subscribeWishesOf(
  season: string,
  ownerId: string,
  onData: (wishes: Wish[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(collection(db, `${seasonPath(season)}/wishes`), where('owner_id', '==', ownerId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Wish);
      list.sort((a, b) => a.rank - b.rank || a.created_at.localeCompare(b.created_at));
      onData(list);
    },
    onError,
  );
}

const clean = (v: string) => {
  const t = v.trim();
  return t.length ? t : null;
};

export async function addWish(season: string, ownerId: string, input: NewWishInput, existing: Wish[]) {
  const ref = doc(collection(db, `${seasonPath(season)}/wishes`));
  const rank = existing.length ? Math.max(...existing.map((w) => w.rank)) + 1 : 0;
  const wish: Wish = {
    id: ref.id,
    owner_id: ownerId,
    title: input.title.trim().slice(0, 120),
    price: clean(input.price)?.slice(0, 40) ?? null,
    where: clean(input.where)?.slice(0, 300) ?? null,
    hint: clean(input.hint)?.slice(0, 300) ?? null,
    rank,
    created_at: nowIso(),
  };
  await setDoc(ref, wish);
  // Envelope counter for the tree (best effort, not critical)
  setDoc(doc(db, `${seasonPath(season)}/counts/${ownerId}`), { count: existing.length + 1 }).catch(() => undefined);
  return wish;
}

/** Saves a new ranking. Only wishes whose position changed are written. */
export async function saveRanking(season: string, ordered: Wish[]) {
  const batch = writeBatch(db);
  let changes = 0;
  ordered.forEach((wish, index) => {
    if (wish.rank !== index) {
      batch.update(doc(db, `${seasonPath(season)}/wishes/${wish.id}`), { rank: index });
      changes++;
    }
  });
  if (changes) await batch.commit();
}

/** Number of wishes per member (sealed envelopes on the branches of everybody else). */
export function subscribeCounts(
  season: string,
  onData: (counts: Record<string, number>) => void,
  onError: (err: Error) => void,
) {
  return onSnapshot(
    collection(db, `${seasonPath(season)}/counts`),
    (snap) => {
      const map: Record<string, number> = {};
      snap.docs.forEach((d) => {
        const c = (d.data() as { count?: number }).count;
        map[d.id] = typeof c === 'number' ? c : 0;
      });
      onData(map);
    },
    onError,
  );
}

// ---------------------------------------------------------------------------
// Claims ("Ich besorge das")
// ---------------------------------------------------------------------------

export function subscribeClaimsFor(
  season: string,
  ownerId: string,
  onData: (claims: Record<string, WishClaim>) => void,
  onError: (err: Error) => void,
) {
  const q = query(collection(db, `${seasonPath(season)}/claims`), where('owner_id', '==', ownerId));
  return onSnapshot(
    q,
    (snap) => {
      const map: Record<string, WishClaim> = {};
      snap.docs.forEach((d) => {
        const c = d.data() as WishClaim;
        map[c.wish_id] = c;
      });
      onData(map);
    },
    onError,
  );
}

/** Returns false if somebody else was faster. */
export async function claimWish(season: string, wish: Wish, myId: string): Promise<boolean> {
  try {
    await setDoc(doc(db, `${seasonPath(season)}/claims/${wish.id}`), {
      wish_id: wish.id,
      owner_id: wish.owner_id,
      claimed_by: myId,
      claimed_at: nowIso(),
    });
    return true;
  } catch (err) {
    if ((err as { code?: string })?.code === 'permission-denied') return false;
    throw err;
  }
}

export async function unclaimWish(season: string, wishId: string) {
  await deleteDoc(doc(db, `${seasonPath(season)}/claims/${wishId}`));
}

// ---------------------------------------------------------------------------
// Admin (Moritz, main app Google login)
// ---------------------------------------------------------------------------

export async function loadAdminOverview(season: string) {
  const [assignSnap, pinSnap] = await Promise.all([
    getDocs(collection(db, `${seasonPath(season)}/assign`)),
    getDocs(collection(db, `${HH}/wichteln_pins`)),
  ]);
  return {
    assignments: assignSnap.docs.map((d) => d.data() as WichtelAssignment),
    pinMemberIds: pinSnap.docs.map((d) => (d.data() as WichtelPin).member_id),
  };
}

export async function adminResetAssignment(season: string, giverId: string) {
  await deleteDoc(doc(db, `${seasonPath(season)}/assign/${giverId}`));
}

/** "Wichtel-PIN vergessen": the member sets a new PIN on next open. Wishes stay. */
export async function adminResetPin(memberId: string) {
  await deleteDoc(doc(db, `${HH}/wichteln_pins/${memberId}`));
}
