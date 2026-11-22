import { useCallback, useEffect, useRef, useState } from 'react';
import { checkWichtelPin, createWichtelPin, describeError, subscribePin } from './wichtelService';

export type WichtelPhase = 'loading' | 'create-pin' | 'enter-pin' | 'ready' | 'error';

const UNLOCK_KEY = 'wichteln_unlocked_member';
const MAX_TRIES = 5;
const COOLDOWN_MS = 30_000;

function readUnlocked(): string | null {
  try {
    return localStorage.getItem(UNLOCK_KEY);
  } catch {
    return null;
  }
}

function writeUnlocked(memberId: string | null) {
  try {
    if (memberId) localStorage.setItem(UNLOCK_KEY, memberId);
    else localStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* private mode: stays unlocked for this visit only */
  }
}

/**
 * Wichtel-PIN of the active Fish & Wish profile:
 * - no PIN yet            -> 'create-pin'
 * - PIN set, not unlocked -> 'enter-pin'
 * - unlocked for this member on this device -> 'ready'
 * Switching to another profile locks Wichteln again (shared tablet).
 */
export function useWichtelSession(memberId: string | null) {
  const [pinHash, setPinHash] = useState<string | null | undefined>(undefined);
  const [unlockedFor, setUnlockedFor] = useState<string | null>(() => readUnlocked());
  const [loadError, setLoadError] = useState<string | null>(null);
  const wrongTries = useRef(0);
  const blockedUntil = useRef(0);

  useEffect(() => {
    if (!memberId) return;
    setPinHash(undefined);
    setLoadError(null);
    return subscribePin(memberId, setPinHash, (err) => setLoadError(describeError(err)));
  }, [memberId]);

  const unlock = useCallback((id: string | null) => {
    writeUnlocked(id);
    setUnlockedFor(id);
  }, []);

  // Another profile is active now: lock, so nobody inherits the previous person's view
  useEffect(() => {
    if (memberId && unlockedFor && unlockedFor !== memberId) unlock(null);
  }, [memberId, unlockedFor, unlock]);

  const createPin = useCallback(
    async (pin: string) => {
      if (!memberId) return;
      try {
        await createWichtelPin(memberId, pin);
      } catch (err) {
        throw new Error(describeError(err));
      }
      unlock(memberId);
    },
    [memberId, unlock],
  );

  const enterPin = useCallback(
    async (pin: string) => {
      if (!memberId || !pinHash) return;
      if (Date.now() < blockedUntil.current) {
        throw new Error('Zu viele Versuche. Warte kurz und versuch es dann nochmal.');
      }
      const ok = await checkWichtelPin(memberId, pinHash, pin);
      if (!ok) {
        wrongTries.current += 1;
        if (wrongTries.current >= MAX_TRIES) {
          wrongTries.current = 0;
          blockedUntil.current = Date.now() + COOLDOWN_MS;
          throw new Error('Zu viele Versuche. Warte 30 Sekunden und versuch es dann nochmal.');
        }
        throw new Error('Diese PIN stimmt nicht. Versuch es nochmal.');
      }
      wrongTries.current = 0;
      unlock(memberId);
    },
    [memberId, pinHash, unlock],
  );

  const lock = useCallback(() => unlock(null), [unlock]);

  let phase: WichtelPhase;
  if (loadError) phase = 'error';
  else if (pinHash === undefined) phase = 'loading';
  else if (!pinHash) phase = 'create-pin';
  else if (unlockedFor === memberId) phase = 'ready';
  else phase = 'enter-pin';

  return { phase, loadError, createPin, enterPin, lock };
}
