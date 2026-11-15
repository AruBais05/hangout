"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { LIMITS } from "@/lib/config";
import { formatCents, shareBreakdown } from "@/lib/money";
import { BOOKED, longDate } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./pay.module.css";

export default function Pay() {
  const router = useRouter();
  const [state] = useDemo();
  const [paying, setPaying] = useState(false);
  const hasPass = !!state.pass;
  const b = shareBreakdown(BOOKED.shareCents, BOOKED.partner, hasPass, state.feeFreeUsed);
  const limit = LIMITS.feeFreeBookingsPerMonth;

  function pay() {
    if (state.paid) {
      router.push("/demo/booked");
      return;
    }
    setPaying(true);
    // Simulated payment: no card, no network.
    setTimeout(() => {
      update((st) => ({
        paid: { totalCents: b.totalCents, feeCents: b.feeCents, at: new Date().toISOString() },
        feeFreeUsed: b.feeWaived ? st.feeFreeUsed + 1 : st.feeFreeUsed,
      }));
      router.push("/demo/booked");
    }, 1100);
  }

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>Pay my share</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          {BOOKED.title} at {BOOKED.venue}, {longDate(BOOKED.slot)}.
        </p>
      </div>

      <section className={s.cardOutline} aria-labelledby="bill-title">
        <h2 id="bill-title" className="visually-hidden">
          Your share
        </h2>
        <dl className={styles.bill}>
          <div>
            <dt>Share</dt>
            <dd className={s.money}>{formatCents(b.shareCents)}</dd>
          </div>
          {b.discountCents > 0 && (
            <div>
              <dt>Partner discount</dt>
              <dd className={s.money}>{formatCents(-b.discountCents)}</dd>
            </div>
          )}
          <div>
            <dt>Booking fee</dt>
            <dd className={s.money}>
              {b.feeWaived ? `${formatCents(0)} with Pass` : formatCents(b.feeCents)}
            </dd>
          </div>
          <div className={styles.total}>
            <dt>Total</dt>
            <dd className={s.money}>{formatCents(b.totalCents)}</dd>
          </div>
        </dl>
        <p className={styles.summary}>
          {b.feeWaived ? `Fee ${formatCents(0)} with Pass` : `Fee ${formatCents(b.feeCents)}`}, saved{" "}
          {formatCents(b.savedCents)}.
        </p>
      </section>

      {hasPass ? (
        <p className={styles.counter}>
          <Icon name="star" size={16} />
          {Math.min(state.feeFreeUsed, limit)} of {limit} fee-free bookings used this month
        </p>
      ) : (
        <Link href="/demo/plans" className={styles.skipFee}>
          Skip the fee with Hangout Pass.
        </Link>
      )}

      <div className={s.actions}>
        <button type="button" className={s.primary} onClick={pay} disabled={paying}>
          {paying ? (
            <>
              <span className={s.spinner} aria-hidden="true" />
              Paying…
            </>
          ) : state.paid ? (
            "Paid. See the plan"
          ) : (
            `Pay ${formatCents(b.totalCents)}`
          )}
        </button>
        <p className={s.small} aria-live="polite">
          {paying ? "Processing your payment" : "Demo payment. No real money moves."}
        </p>
      </div>
    </div>
  );
}
