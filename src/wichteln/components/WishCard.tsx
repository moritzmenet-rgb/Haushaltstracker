import React from 'react';
import type { Wish } from '../types';

interface Props {
  wish: Wish;
  position: number; // 1-based ranking
  claimed?: boolean;
  /** right-hand slot: drag handle (own list) or claim button (someone else's list) */
  action?: React.ReactNode;
  /** slightly alternating tilt so the tags look hand-hung */
  tilt?: number;
}

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

/** A wish as a gift tag: punched hole, gold string, big ranking number. */
export const WishCard: React.FC<Props> = ({ wish, position, claimed, action, tilt = 0 }) => {
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
          {wish.hint && <div className="w-tag-hint">{wish.hint}</div>}
        </div>
        <div>{action}</div>
      </div>
      {claimed && (
        <div className="w-stamp" aria-hidden="true">
          Wunsch
          <br />
          gemerkt
        </div>
      )}
    </div>
  );
};
