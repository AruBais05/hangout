"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import styles from "../plan/plan.module.css";
import { PRICES } from "@/lib/config";
import { formatCents } from "@/lib/money";
import { meetingOf, passBookingsUsed, rankIdeas, shareBreakdown, thisMonth, winnerOf } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";

export default function Pay() {
  const router = useRouter();
  const [state] = useDemo();
  const m = meetingOf(state);
  const idea = winnerOf(state, rankIdeas(state));
  const b = shareBreakdown(state, idea);
  const used = passBookingsUsed(state);
  const [paying, setPaying] = useState(false);
  const paid = state.paid;
  // Once paid, show what was actually charged, even if the Pass count changes later.
  const feeCents = paid ? paid.feeCents : b.feeCents;
  const covered = paid ? paid.feeCents === 0 : b.passCovers;

  function pay() {
    setPaying(true);
    // Demo payment: nothing leaves the browser.
    setTimeout(() => {
      update((st) => ({
        paid: { feeCents: b.feeCents, totalCents: b.totalCents },
        passBookings: b.passCovers ? { month: thisMonth(), used: used + 1 } : st.passBookings,
      }));
      setPaying(false);
    }, 900);
  }

  return (
    <div className={s.screen}>
      <h1 className={s.title}>{paid ? "Your share is paid" : "Pay my share"}</h1>

      <section className={styles.ticket} aria-labelledby="pay-plan">
        <p className={styles.when}>{idea.whenLabel}</p>
        <h2 id="pay-plan" className={styles.planTitle}>
          {idea.title}
        </h2>
        <p className={styles.where}>
          <Icon name="pin" size={18} />
          {idea.place}, {m.city}
        </p>
      </section>

      {b.shareCents === 0 ? (
        <p className={styles.freeNote}>
          <Icon name="check" size={18} />
          <span>
            <strong>Nothing to pay.</strong> This plan is free, so there&rsquo;s no booking fee either.
          </span>
        </p>
      ) : (
        <section className={styles.bill} aria-labelledby="bill-title">
          <h2 id="bill-title" className="visually-hidden">
            Your share
          </h2>
          <dl>
            <div>
              <dt>Your share</dt>
              <dd className={s.money}>{formatCents(b.shareCents)}</dd>
            </div>
            {b.discountCents > 0 && (
              <div>
                <dt>Partner discount ({PRICES.partnerDiscountPct}%)</dt>
                <dd className={s.money}>{formatCents(-b.discountCents)}</dd>
              </div>
            )}
            <div>
              <dt>Booking fee</dt>
              <dd className={s.money}>{covered && state.pass ? "$0.00 with Pass" : formatCents(feeCents)}</dd>
            </div>
            <div className={styles.total}>
              <dt>Total</dt>
              <dd className={s.money}>{formatCents(paid?.totalCents ?? b.totalCents)}</dd>
            </div>
          </dl>
          <p className={s.small}>
            Fee {formatCents(feeCents)}
            {b.discountCents > 0 ? `, saved ${formatCents(b.discountCents)}` : ""}.
          </p>
        </section>
      )}

      {state.pass ? (
        <p className={s.small} aria-live="polite">
          <strong>{Math.min(used, PRICES.passFreeBookings)} of {PRICES.passFreeBookings}</strong> fee-free bookings used this
          month.
        </p>
      ) : (
        b.shareCents > 0 && (
          <p className={s.small}>
            Skip the fee with Crew Pass.{" "}
            <Link href="/plans" className={s.textLink}>
              See plans
            </Link>
          </p>
        )
      )}

      <div className={s.actions}>
        {paid || b.shareCents === 0 ? (
          <button type="button" className={s.primary} onClick={() => router.push("/room/plan")}>
            See the plan
          </button>
        ) : (
          <button type="button" className={s.primary} onClick={pay} disabled={paying}>
            {paying ? (
              <>
                <span className={s.spinner} aria-hidden="true" />
                Paying…
              </>
            ) : (
              `Pay ${formatCents(b.totalCents)}`
            )}
          </button>
        )}
        <p className={s.small}>{paid ? `Paid ${formatCents(paid.totalCents)}. Demo payment, no real charge.` : "Demo payment. No real charge."}</p>
      </div>
    </div>
  );
}
