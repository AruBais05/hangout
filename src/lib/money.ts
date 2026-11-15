export function formatCents(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  return `${sign}$${dollars}.${String(abs % 100).padStart(2, "0")}`;
}

/** Whole-dollar prices print without cents ($4.99 stays, $5.00 becomes $5). */
export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? `$${(cents / 100).toLocaleString("en-US")}` : formatCents(cents);
}

export type Split = {
  stayCents: number;
  unlockCents: number;
  totalCents: number;
  people: number;
  eachCents: number; // what each friend sends the organizer
  unlockEachCents: number; // the unlock's part of that
  organizerCents: number; // organizer's own share, absorbs the rounding
};

/**
 * Splits the group cost evenly. The organizer paid the venue (and the unlock),
 * so everyone else pays the organizer back. Rounding leftovers stay with the organizer.
 */
export function splitCost(stayCents: number, unlockCents: number, people: number): Split {
  const totalCents = stayCents + unlockCents;
  const eachCents = Math.floor(totalCents / people);
  const organizerCents = totalCents - eachCents * (people - 1);
  const unlockEachCents = Math.round(unlockCents / people);
  return { stayCents, unlockCents, totalCents, people, eachCents, unlockEachCents, organizerCents };
}
