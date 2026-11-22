import { useCallback, useEffect, useRef, useState } from 'react';
import { checkWichtelPin, createWichtelPin, describeError, subscribePin } from './wichtelService';

export type WichtelPhase = 'loading' | 'create-pin' | 'enter-pin' | 'ready' | 'error';

const MAX_TRIES = 5;
const COOLDOWN_MS = 30_000;
/** Locks again after this long without any touch, click or key press */
const IDLE_LOCK_MS = 3 * 60_000;
/** Locks again when the app was in the background (other app, screen off) this long */
const HIDDEN_LOCK_MS = 60_000;

/** Old versions remembered the unlock on the device; never trust that again. */
const LEGACY_UNLOCK_KEY = 'wichteln_unlocked_member';
try {
  localStorage.removeItem(LEGACY_UNLOCK_KEY);
} catch {
  /* ignore */
}

/**
 * Wichtel-PIN of the active Fish & Wish profile:
 * - no PIN yet            -> 'create-pin'
 * - PIN set, not unlocked -> 'enter-pin'
 * - unlocked              -> 'ready'
 *
 * The unlock is only kept in memory, so it is gone when the person leaves the
 * Wichteln area, reloads or closes the app, switches profile, is idle for 3
 * minutes or puts the app in the background for a minute. Nobody can pick up a
 * phone or the kitchen tablet and see whom the previous person gifts.
 */
export function useWichtelSession(memberId: string | null) {
  const [pinHash, setPinHash] = useState<string | null | undefined>(undefined);
  const [unlockedFor, setUnlockedFor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const wrongTries = useRef(0);
  const blockedUntil = useRef(0);

  useEffect(() => {
    if (!memberId) return;
    setPinHash(undefined);
    setLoadError(null);
    return subscribePin(memberId, setPinHash, (err) => setLoadError(describeError(err)));
  }, [memberId]);

  const lock = useCallback(() => setUnlockedFor(null), []);

  // Another profile is active now: lock immediately
  useEffect(() => {
    if (unlockedFor && unlockedFor !== memberId) lock();
  }, [memberId, unlockedFor, lock]);

  // Auto-lock: idle for a while, or the app was in the background for a while
  useEffect(() => {
    if (!unlockedFor) return;
    let idleTimer = setTimeout(lock, IDLE_LOCK_MS);
    let hiddenAt = 0;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(lock, IDLE_LOCK_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt >= HIDDEN_LOCK_MS) lock();
      else resetIdle();
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [unlockedFor, lock]);

  const createPin = useCallback(
    async (pin: string) => {
      if (!memberId) return;
      try {
        await createWichtelPin(memberId, pin);
      } catch (err) {
        throw new Error(describeError(err));
      }
      setUnlockedFor(memberId);
    },
    [memberId],
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
      setUnlockedFor(memberId);
    },
    [memberId, pinHash],
  );

  let phase: WichtelPhase;
  if (loadError) phase = 'error';
  else if (pinHash === undefined) phase = 'loading';
  else if (!pinHash) phase = 'create-pin';
  else if (memberId && unlockedFor === memberId) phase = 'ready';
  else phase = 'enter-pin';

  return { phase, loadError, createPin, enterPin, lock };
}
