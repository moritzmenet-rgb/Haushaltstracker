import React, { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { GripVertical, Paperclip, Plus } from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { addWish, saveRanking, subscribeWishesOf } from '../wichtelService';
import type { NewWishInput, Wish } from '../types';
import { WishCard } from './WishCard';
import { AddWishSheet } from './AddWishSheet';

interface Props {
  season: string;
  myId: string;
  /** increments when the "Wunsch" button in the top bar is pressed */
  openTrigger: number;
  showFab: boolean;
}

const DraggableWish: React.FC<{ wish: Wish; position: number; onDragEnd: () => void }> = ({ wish, position, onDragEnd }) => {
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
export const MyWishes: React.FC<Props> = ({ season, myId, openTrigger, showFab }) => {
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

  const firstTrigger = useRef(openTrigger);
  useEffect(() => {
    if (openTrigger !== firstTrigger.current) setSheetOpen(true);
  }, [openTrigger]);

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

  const save = async (input: NewWishInput) => {
    await addWish(season, myId, input, wishes ?? []);
    haptic.medium();
  };

  if (wishes === null && !error) return <div className="w-spinner" aria-label="Wird geladen" />;

  return (
    <div>
      <h3 className="w-h3 w-only-desktop">Meine Wünsche</h3>
      {error && <p className="w-error" style={{ marginBottom: 12 }}>{error}</p>}

      {order.length > 0 && order.length < 3 && (
        <div className="w-note" role="note">
          <Paperclip className="w-note-clip w-5 h-5" aria-hidden="true" />
          Tipp: Trag am besten mindestens drei Wünsche ein, dann haben deine Wichtel genug Auswahl.
        </div>
      )}

      {order.length === 0 ? (
        <div className="w-empty">
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
              <DraggableWish key={w.id} wish={w} position={i + 1} onDragEnd={persistOrder} />
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
