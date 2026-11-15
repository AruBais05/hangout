import { LIMITS, PRICES } from "./config";

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Whole-dollar prices print without cents ($4.99 stays, $5.00 becomes $5). */
export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : formatCents(cents);
}

export type ShareBreakdown = {
  shareCents: number;
  discountCents: number;
  feeCents: number;
  feeWaived: boolean;
  totalCents: number;
  savedCents: number;
};

/**
 * One person's payment for a booked hangout.
 * The fee is waived when the person has the Pass and has used fewer than
 * the monthly fee-free bookings.
 */
export function shareBreakdown(
  shareCents: number,
  partner: boolean,
  hasPass: boolean,
  feeFreeUsed: number,
): ShareBreakdown {
  const discountCents = partner
    ? Math.round((shareCents * PRICES.partnerDiscountPct) / 100)
    : 0;
  const feeWaived = hasPass && feeFreeUsed < LIMITS.feeFreeBookingsPerMonth;
  const feeCents = feeWaived ? 0 : PRICES.bookingFeeCents;
  const totalCents = shareCents - discountCents + feeCents;
  const savedCents = discountCents + (feeWaived ? PRICES.bookingFeeCents : 0);
  return { shareCents, discountCents, feeCents, feeWaived, totalCents, savedCents };
}
