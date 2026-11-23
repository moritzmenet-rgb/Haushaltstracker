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

/** "Zusammenlegen": a Wichtel asks the other Wichtel of the same person. */
export interface ConnectRequest {
  wish_id: string;
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
