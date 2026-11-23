import React, { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { GripVertical, Paperclip, Plus } from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { addWish, saveRanking, setWishPrio, subscribeWishesOf } from '../wichtelService';
import type { NewWishInput, Wish } from '../types';
import { WishCard } from './WishCard';
import { AddWishSheet } from './AddWishSheet';
import fensterUrl from '../assets/wichtel-fenster.webp';

interface Props {
  season: string;
  myId: string;
  /** request to open the add sheet: opens when it differs from `openConsumed` */
  openRequest: number;
  openConsumed: number;
  onOpenConsumed: (n: number) => void;
  showFab: boolean;
  /** hide the section title (when the surrounding panel already shows one) */
  hideTitle?: boolean;
}

const DraggableWish: React.FC<{ wish: Wish; position: number; onDragEnd: () => void; onPrio: (p: number) => void }> = ({ wish, position, onDragEnd, onPrio }) => {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={wish}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, rotate: 0.8, zIndex: 5 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'relative', listStyle: 'none' }}
    >
      <WishCard
        wish={wish}
        position={position}
        tilt={position % 2 ? -0.5 : 0.5}
        onPrioChange={onPrio}
        action={
          <button
            type="button"
            className="w-handle"
            aria-label={`${wish.title} verschieben`}
            onPointerDown={(e) => {
              haptic.selection();
              controls.start(e);
            }}
          >
            <GripVertical className="w-5 h-5" />
          </button>
        }
      />
    </Reorder.Item>
  );
};

/** "Meine Wünsche": add (fixed after saving) and sort by priority. Never shows claims. */
export const MyWishes: React.FC<Props> = ({ season, myId, openRequest, openConsumed, onOpenConsumed, showFab, hideTitle }) => {
  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [order, setOrder] = useState<Wish[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const orderRef = useRef<Wish[]>([]);
  const draggingRef = useRef(false);

  useEffect(
    () =>
      subscribeWishesOf(
        season,
        myId,
        (list) => {
          setWishes(list);
          if (!draggingRef.current) setOrder(list);
        },
        () => setError('Deine Wünsche konnten nicht geladen werden.'),
      ),
    [season, myId],
  );

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    if (openRequest !== openConsumed) {
      setSheetOpen(true);
      onOpenConsumed(openRequest);
    }
  }, [openRequest, openConsumed, onOpenConsumed]);

  const persistOrder = async () => {
    draggingRef.current = false;
    try {
      await saveRanking(season, orderRef.current);
    } catch {
      setError('Die neue Reihenfolge konnte nicht gespeichert werden.');
      if (wishes) setOrder(wishes);
    }
  };

  const onReorder = (next: Wish[]) => {
    draggingRef.current = true;
    setOrder(next);
  };

  const changePrio = async (wish: Wish, p: number) => {
    const next = wish.prio === p ? null : p; // tapping the same star again clears it
    try {
      await setWishPrio(season, wish.id, next);
    } catch {
      setError('Die Wichtigkeit konnte nicht gespeichert werden.');
    }
  };

  const save = async (input: NewWishInput) => {
    await addWish(season, myId, input, wishes ?? []);
    haptic.medium();
  };

  if (wishes === null && !error) return <div className="w-spinner" aria-label="Wird geladen" />;

  return (
    <div>
      {!hideTitle && <h3 className="w-h3 w-only-desktop">Meine Wünsche</h3>}
      {error && <p className="w-error" style={{ marginBottom: 12 }}>{error}</p>}

      {order.length > 0 && order.length < 3 && (
        <div className="w-note" role="note">
          <Paperclip className="w-note-clip w-5 h-5" aria-hidden="true" />
          Tipp: Trag am besten mindestens drei Wünsche ein, dann haben deine Wichtel genug Auswahl.
        </div>
      )}

      {order.length === 0 ? (
        <div className="w-empty">
          <img className="w-empty-figure" src={fensterUrl} alt="" width={168} height={168} />
          <p className="w-empty-title">Was wünschst du dir?</p>
          <p className="w-muted" style={{ marginBottom: 16 }}>
            Schreib deine Wünsche auf. Nur deine zwei Wichtel sehen sie.
          </p>
          <button type="button" className="w-btn w-btn-primary" onClick={() => setSheetOpen(true)}>
            Wunsch hinzufügen
          </button>
        </div>
      ) : (
        <>
          <Reorder.Group axis="y" values={order} onReorder={onReorder} as="ol" className="w-list">
            {order.map((w, i) => (
              <DraggableWish key={w.id} wish={w} position={i + 1} onDragEnd={persistOrder} onPrio={(p) => changePrio(w, p)} />
            ))}
          </Reorder.Group>
          <p className="w-muted" style={{ marginTop: 16 }}>
            Zieh einen Wunsch am Griff nach oben oder unten. Deine Wichtel sehen ihn in dieser Reihenfolge.
          </p>
        </>
      )}

      {showFab && order.length > 0 && (
        <button type="button" className="w-fab" aria-label="Wunsch hinzufügen" onClick={() => setSheetOpen(true)}>
          <Plus className="w-7 h-7" strokeWidth={2.25} />
        </button>
      )}

      <AddWishSheet
        open={sheetOpen}
        nextPosition={order.length + 1}
        onClose={() => setSheetOpen(false)}
        onSave={save}
      />
    </div>
  );
};
