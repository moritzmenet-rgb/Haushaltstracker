/** Hashed Wichtel-PIN of a member (separate from the profile PIN). */
export interface WichtelPin {
  member_id: string;
  pin_hash: string;
  created_at: string;
}

/** Whom a member gifts this season (exactly two people). */
export interface WichtelAssignment {
  giver_id: string;
  receivers: string[];
  created_at: string;
}

export interface Wish {
  id: string;
  owner_id: string;
  title: string;
  price?: string | null;
  where?: string | null;
  hint?: string | null;
  rank: number;
  /** "Wie wichtig ist dir das?" 1..5 */
  prio?: number | null;
  created_at: string;
  /** set when the owner changed the description later (the Wichtel see a note) */
  edited_at?: string | null;
}

/** "Ich besorge das". Never readable by the owner of the wish. */
export interface WishClaim {
  wish_id: string;
  owner_id: string;
  claimed_by: string;
  claimed_at: string;
  /** pooled with the other Wichtel ("Zusammenlegen") */
  with_id?: string | null;
}

/**
 * "Zusammenlegen": a Wichtel asks the other Wichtel of the same person, either for
 * one wish (doc id = wish id) or for the person in general (kind 'person',
 * doc id = person_{owner}, e.g. for an own idea that is not on the list).
 */
export interface ConnectRequest {
  /** only for wish requests */
  wish_id?: string;
  kind?: 'person';
  /** optional idea the asker writes for a person request */
  note?: string | null;
  owner_id: string;
  from_id: string;
  status: 'pending' | 'accepted' | 'declined';
  to_id?: string;
  created_at: string;
  answered_at?: string;
}

export interface NewWishInput {
  title: string;
  price: string;
  where: string;
  hint: string;
  prio: number | null;
}

export const WICHTEL_PIN_LENGTH = 6;
export const MIN_MEMBERS = 3;
export const RECEIVERS_PER_PERSON = 2;
