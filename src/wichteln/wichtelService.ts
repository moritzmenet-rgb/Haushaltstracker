import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { HOUSEHOLD_ID } from '../services/firestoreSync';
import { hashPin, verifyPin } from '../utils/pin';
import type { ConnectRequest, NewWishInput, Wish, WishClaim, WichtelAssignment, WichtelPin } from './types';

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
    prio: input.prio && input.prio >= 1 && input.prio <= 5 ? Math.round(input.prio) : null,
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

/** The owner changes how important a wish is (1..5). */
export async function setWishPrio(season: string, wishId: string, prio: number | null) {
  await updateDoc(doc(db, `${seasonPath(season)}/wishes/${wishId}`), { prio });
}

/**
 * Owner changes a wish later (everything except deleting it). Only changed fields
 * are written; "(bearbeitet)" is set only when the text changed, not for the importance.
 * Returns false when nothing changed.
 */
export async function updateWish(season: string, wish: Wish, input: NewWishInput): Promise<boolean> {
  const next = {
    title: input.title.trim().slice(0, 120),
    price: clean(input.price)?.slice(0, 40) ?? null,
    where: clean(input.where)?.slice(0, 300) ?? null,
    hint: clean(input.hint)?.slice(0, 300) ?? null,
  };
  if (!next.title) throw new Error('title required');
  const changes: Record<string, string | number | null> = {};
  (Object.keys(next) as (keyof typeof next)[]).forEach((k) => {
    if ((wish[k] ?? null) !== next[k]) changes[k] = next[k];
  });
  const textChanged = Object.keys(changes).length > 0;
  const prio = input.prio && input.prio >= 1 && input.prio <= 5 ? Math.round(input.prio) : null;
  if ((wish.prio ?? null) !== prio) changes.prio = prio;
  if (!Object.keys(changes).length) return false;
  if (textChanged) changes.edited_at = nowIso();
  await updateDoc(doc(db, `${seasonPath(season)}/wishes/${wish.id}`), changes);
  return true;
}

// ---------------------------------------------------------------------------
// "Zusammenlegen" with the other Wichtel of the same person
// ---------------------------------------------------------------------------

/** Requests on the wishes of one person I gift. Never loaded for my own wishes. */
export function subscribeConnectsFor(
  season: string,
  ownerId: string,
  onData: (requests: Record<string, ConnectRequest>) => void,
  onError: (err: Error) => void,
) {
  const q = query(collection(db, `${seasonPath(season)}/connects`), where('owner_id', '==', ownerId));
  return onSnapshot(
    q,
    (snap) => {
      const map: Record<string, ConnectRequest> = {};
      snap.docs.forEach((d) => {
        // keyed by doc id: the wish id, or person_{owner} for a general request
        map[d.id] = d.data() as ConnectRequest;
      });
      onData(map);
    },
    onError,
  );
}

/** Returns false if somebody already asked about this wish. */
export async function requestConnect(season: string, wish: Wish, myId: string): Promise<boolean> {
  try {
    await setDoc(doc(db, `${seasonPath(season)}/connects/${wish.id}`), {
      wish_id: wish.id,
      owner_id: wish.owner_id,
      from_id: myId,
      status: 'pending',
      created_at: nowIso(),
    });
    return true;
  } catch (err) {
    if ((err as { code?: string })?.code === 'permission-denied') return false;
    throw err;
  }
}

/**
 * The other Wichtel answers. On "yes" the wish is marked as gemerkt for both
 * together (claim with with_id), so it disappears for nobody of the two.
 */
export async function answerConnect(
  season: string,
  request: ConnectRequest,
  myId: string,
  accept: boolean,
  myExistingClaim: WishClaim | undefined,
) {
  if (!request.wish_id) throw new Error('not a wish request');
  const reqRef = doc(db, `${seasonPath(season)}/connects/${request.wish_id}`);
  await updateDoc(reqRef, { status: accept ? 'accepted' : 'declined', to_id: myId, answered_at: nowIso() });
  if (!accept) return;
  const claimRef = doc(db, `${seasonPath(season)}/claims/${request.wish_id}`);
  if (myExistingClaim && myExistingClaim.claimed_by === myId && !myExistingClaim.with_id) {
    await deleteDoc(claimRef);
  }
  await setDoc(claimRef, {
    wish_id: request.wish_id,
    owner_id: request.owner_id,
    claimed_by: myId,
    with_id: request.from_id,
    claimed_at: nowIso(),
  });
}

/** Doc id of the general "zusammentun" request for one person. */
export const personConnectId = (ownerId: string) => `person_${ownerId}`;

/** Ask the other Wichtel of `ownerId` to team up in general (own idea, not tied to a wish). */
export async function requestPersonConnect(season: string, ownerId: string, myId: string, note: string): Promise<boolean> {
  try {
    await setDoc(doc(db, `${seasonPath(season)}/connects/${personConnectId(ownerId)}`), {
      kind: 'person',
      owner_id: ownerId,
      from_id: myId,
      status: 'pending',
      note: clean(note)?.slice(0, 300) ?? null,
      created_at: nowIso(),
    });
    return true;
  } catch (err) {
    if ((err as { code?: string })?.code === 'permission-denied') return false;
    throw err;
  }
}

export async function answerPersonConnect(season: string, request: ConnectRequest, myId: string, accept: boolean) {
  await updateDoc(doc(db, `${seasonPath(season)}/connects/${personConnectId(request.owner_id)}`), {
    status: accept ? 'accepted' : 'declined',
    to_id: myId,
    answered_at: nowIso(),
  });
}

/** Withdraw a pending request, or dismiss a declined one (doc id: wish id or person_{owner}). */
export async function removeConnect(season: string, connectId: string) {
  await deleteDoc(doc(db, `${seasonPath(season)}/connects/${connectId}`));
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
