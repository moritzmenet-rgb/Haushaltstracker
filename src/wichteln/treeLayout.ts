import type { FamilyMember } from '../types';

/**
 * Branch slots measured on the tree illustration (assets/wunschbaum.webp, 3:4).
 * All values are fractions of the picture: `y` is where the strings start (just
 * under the outer part of the branch), `x0..x1` the stretch where things can hang.
 * Ordered from the most prominent (big, low) to the least (small, high).
 */
export interface BranchSlot {
  side: 'left' | 'right';
  y: number;
  x0: number;
  x1: number;
  /** room below the branch, as a fraction of the picture height */
  drop: number;
}

export const BRANCH_SLOTS: BranchSlot[] = [
  { side: 'left', y: 0.775, x0: 0.11, x1: 0.4, drop: 0.08 },
  { side: 'right', y: 0.775, x0: 0.6, x1: 0.89, drop: 0.08 },
  { side: 'left', y: 0.635, x0: 0.15, x1: 0.4, drop: 0.06 },
  { side: 'right', y: 0.635, x0: 0.6, x1: 0.84, drop: 0.06 },
  { side: 'left', y: 0.505, x0: 0.2, x1: 0.4, drop: 0.045 },
  { side: 'right', y: 0.505, x0: 0.6, x1: 0.8, drop: 0.045 },
  { side: 'left', y: 0.37, x0: 0.27, x1: 0.42, drop: 0.045 },
  { side: 'right', y: 0.37, x0: 0.58, x1: 0.73, drop: 0.045 },
];

/** At most this many things hang on one branch; the rest is in the list after zooming in. */
export const MAX_ON_BRANCH = 6;

export type BranchRole = 'me' | 'receiver' | 'other';

export interface PlacedBranch {
  member: FamilyMember;
  role: BranchRole;
  slot: BranchSlot;
}

/** Me first, then the two people I gift, then everybody else (further back). */
export function placeBranches(members: FamilyMember[], meId: string, receiverIds: string[]): PlacedBranch[] {
  const me = members.find((m) => m.id === meId);
  const receivers = receiverIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is FamilyMember => !!m);
  const others = members.filter((m) => m.id !== meId && !receiverIds.includes(m.id));
  const ordered: Array<[FamilyMember, BranchRole]> = [
    ...(me ? [[me, 'me'] as [FamilyMember, BranchRole]] : []),
    ...receivers.map((m) => [m, 'receiver'] as [FamilyMember, BranchRole]),
    ...others.map((m) => [m, 'other'] as [FamilyMember, BranchRole]),
  ];
  return ordered
    .slice(0, BRANCH_SLOTS.length)
    .map(([member, role], i) => ({ member, role, slot: BRANCH_SLOTS[i] }));
}

/** Where the camera looks when zoomed in on a branch (fractions of the picture). */
export function branchFocus(slot: BranchSlot): { x: number; y: number } {
  return { x: (slot.x0 + slot.x1) / 2, y: slot.y + slot.drop * 0.4 };
}
