import { useEffect, useState } from 'react';
import { subscribeClaimsFor, subscribeCounts, subscribeWishesOf } from './wichtelService';
import type { Wish, WishClaim } from './types';

export interface TreeData {
  /** true once my own wishes have arrived the first time */
  myLoaded: boolean;
  myWishes: Wish[];
  receiverWishes: Record<string, Wish[]>;
  receiverClaims: Record<string, Record<string, WishClaim>>;
  counts: Record<string, number>;
}

/**
 * Everything the tree shows, and nothing more:
 * - my own wishes (never claims on them)
 * - wishes + claims of the two people I gift
 * - only the NUMBER of wishes of everybody else
 */
export function useTreeData(season: string, myId: string, receiverIds: string[]): TreeData {
  const [myWishes, setMyWishes] = useState<Wish[]>([]);
  const [myLoaded, setMyLoaded] = useState(false);
  const [receiverWishes, setReceiverWishes] = useState<Record<string, Wish[]>>({});
  const [receiverClaims, setReceiverClaims] = useState<Record<string, Record<string, WishClaim>>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const receiverKey = receiverIds.join('|');

  useEffect(
    () =>
      subscribeWishesOf(
        season,
        myId,
        (w) => {
          setMyWishes(w);
          setMyLoaded(true);
        },
        () => undefined,
      ),
    [season, myId],
  );

  useEffect(() => {
    const ids = receiverKey ? receiverKey.split('|') : [];
    const unsubs = ids.flatMap((id) => [
      subscribeWishesOf(season, id, (w) => setReceiverWishes((prev) => ({ ...prev, [id]: w })), () => undefined),
      subscribeClaimsFor(season, id, (c) => setReceiverClaims((prev) => ({ ...prev, [id]: c })), () => undefined),
    ]);
    return () => unsubs.forEach((u) => u());
  }, [season, receiverKey]);

  useEffect(() => subscribeCounts(season, setCounts, () => undefined), [season]);

  return { myLoaded, myWishes, receiverWishes, receiverClaims, counts };
}
