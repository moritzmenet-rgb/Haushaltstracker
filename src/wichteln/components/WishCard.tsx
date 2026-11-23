import React from 'react';
import { Pencil, Star } from 'lucide-react';
import type { Wish } from '../types';

interface Props {
  wish: Wish;
  position: number; // 1-based ranking
  claimed?: boolean;
  /** right-hand slot: drag handle (own list) or claim button (someone else's list) */
  action?: React.ReactNode;
  /** slightly alternating tilt so the tags look hand-hung */
  tilt?: number;
  /** owner only: change "wie wichtig" by tapping the stars */
  onPrioChange?: (prio: number) => void;
  /** owner only: opens the sheet to change the description */
  onEdit?: () => void;
  /** Wichtel only: small note that the description changed */
  editedNote?: string | null;
}

const PRIO_LABEL = ['', 'Wäre nett', 'Wäre schön', 'Wünsche ich mir', 'Sehr wichtig', 'Herzenswunsch'];

/** "Wie wichtig ist dir das?" as 1–5 small stars; tappable when onChange is given. */
export const PrioStars: React.FC<{ value: number | null | undefined; onChange?: (v: number) => void; showLabel?: boolean }> = ({
  value, onChange, showLabel,
}) => {
  const v = value ?? 0;
  if (!onChange && !v) return null;
  return (
    <div className="w-prio" role={onChange ? 'radiogroup' : undefined} aria-label={`Wie wichtig: ${v} von 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={v === n}
            aria-label={`${n} von 5: ${PRIO_LABEL[n]}`}
            className={`w-prio-star ${n <= v ? 'is-on' : ''}`}
            onClick={() => onChange(n)}
          >
            <Star className="w-4 h-4" />
          </button>
        ) : (
          <span key={n} className={`w-prio-star ${n <= v ? 'is-on' : ''}`} aria-hidden="true">
            <Star className="w-3 h-3" />
          </span>
        ),
      )}
      {showLabel && v > 0 && <span className="w-prio-label">{PRIO_LABEL[v]}</span>}
    </div>
  );
};

function WhereText({ value }: { value: string }) {
  if (/^https?:\/\//i.test(value)) {
    let label = value;
    try {
      label = new URL(value).hostname.replace(/^www\./, '');
    } catch {
      /* keep raw text */
    }
    return (
      <a href={value} target="_blank" rel="noopener noreferrer nofollow">
        {label}
      </a>
    );
  }
  return <>{value}</>;
}

/** "(bearbeitet)" after the description, for everyone who sees the card. Date on hover. */
const EditedMark: React.FC<{ at: string }> = ({ at }) => {
  const d = new Date(at);
  const when = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('de-CH', { day: 'numeric', month: 'long' });
  return (
    <span className="w-tag-edited-mark" title={when ? `Bearbeitet am ${when}` : undefined}>
      (bearbeitet)
    </span>
  );
};

/** Round rubber stamp "Wunsch gemerkt": wine-red ink on a paper disc, text along the rim. */
const Stamp: React.FC = () => {
  const rimId = `w-rim-${React.useId().replace(/:/g, '')}`;
  return (
  <svg className="w-stamp" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <path id={rimId} d="M50 50 m-34 0 a34 34 0 1 1 68 0 a34 34 0 1 1 -68 0" />
    </defs>
    <circle cx="50" cy="50" r="47" fill="var(--w-papier)" />
    <g fill="none" stroke="var(--w-stempel)">
      <circle cx="50" cy="50" r="44" strokeWidth="3" />
      <circle cx="50" cy="50" r="26" strokeWidth="1.5" />
    </g>
    <text fill="var(--w-stempel)" fontSize="11.5" fontFamily="Albert Sans, sans-serif" fontWeight="500" letterSpacing="1.6">
      <textPath href={`#${rimId}`} startOffset="0">WUNSCH · GEMERKT · WUNSCH · GEMERKT ·</textPath>
    </text>
    <path
      fill="var(--w-stempel)"
      d="M50 36 l3.9 8.3 9.1 1.1 -6.7 6.3 1.8 9 -8.1-4.5 -8.1 4.5 1.8-9 -6.7-6.3 9.1-1.1z"
    />
  </svg>
  );
};

/** A wish as a gift tag: punched hole, gold string, big ranking number. */
export const WishCard: React.FC<Props> = ({ wish, position, claimed, action, tilt = 0, onPrioChange, onEdit, editedNote }) => {
  const meta = [wish.price ? `ca. ${wish.price.replace(/^ca\.?\s*/i, '')}` : null].filter(Boolean);
  return (
    <div className="w-tag-wrap" style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}>
      <span className="w-tag-string" aria-hidden="true" />
      <div className={`w-tag ${claimed ? 'is-claimed' : ''}`}>
        <div className={`w-rank ${position === 1 && !claimed ? 'is-top' : ''}`} aria-label={`Platz ${position}`}>
          {position}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="w-tag-title">{wish.title}</div>
          {(meta.length > 0 || wish.where) && (
            <div className="w-tag-meta">
              {meta.join('')}
              {meta.length > 0 && wish.where ? ' · ' : ''}
              {wish.where && <WhereText value={wish.where} />}
            </div>
          )}
          {wish.hint && (
            <div className="w-tag-hint">
              {wish.hint}
              {wish.edited_at && <EditedMark at={wish.edited_at} />}
            </div>
          )}
          {!wish.hint && wish.edited_at && (
            <div>
              <EditedMark at={wish.edited_at} />
            </div>
          )}
          <PrioStars value={wish.prio} onChange={onPrioChange} />
          {editedNote && <div className="w-tag-edited">{editedNote}</div>}
          {onEdit && (
            <button type="button" className="w-link w-tag-edit" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              {wish.hint ? 'Beschreibung ändern' : 'Beschreibung hinzufügen'}
            </button>
          )}
        </div>
        <div>{action}</div>
      </div>
      {claimed && <Stamp />}
    </div>
  );
};
