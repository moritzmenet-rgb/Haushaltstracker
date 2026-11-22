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
  created_at: string;
}

/** "Ich besorge das". Never readable by the owner of the wish. */
export interface WishClaim {
  wish_id: string;
  owner_id: string;
  claimed_by: string;
  claimed_at: string;
}

export interface NewWishInput {
  title: string;
  price: string;
  where: string;
  hint: string;
}

export const WICHTEL_PIN_LENGTH = 6;
export const MIN_MEMBERS = 3;
export const RECEIVERS_PER_PERSON = 2;
