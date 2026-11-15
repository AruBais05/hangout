"use client";

import { useRouter } from "next/navigation";
import BookLinks from "@/components/BookLinks";
import CostSplit from "@/components/CostSplit";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import styles from "../plan/plan.module.css";
import { PRICES } from "@/lib/config";
import { formatCents } from "@/lib/money";
import { meetingOf, rankIdeas, shareBreakdown, winnerOf } from "@/lib/plan";
import { venmoUrl } from "@/lib/split";
import { update, useDemo } from "@/lib/store";

export default function SettleUp() {
  const router = useRouter();
  const [state] = useDemo();
  const m = meetingOf(state);
  const idea = winnerOf(state, rankIdeas(state));
  const b = shareBreakdown(idea);
  const handle = state.venmoHandle;

  function markPaid() {
    update((st) => ({ paid: true, spentThisMonth: st.spentThisMonth + (st.paid ? 0 : b.totalCents) }));
  }

  return (
    <div className={s.screen}>
      <h1 className={s.title}>Settle up</h1>

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

      <BookLinks idea={idea} city={m.city} />

      {b.shareCents === 0 ? (
        <p className={styles.freeNote}>
          <Icon name="check" size={18} />
          <span>
            <strong>Nothing to pay.</strong> This plan is free.
          </span>
        </p>
      ) : (
        <section className={styles.bill} aria-labelledby="bill-title">
          <h2 id="bill-title" className="visually-hidden">
            Your share
          </h2>
          <dl>
            <div>
              <dt>Per person</dt>
              <dd className={s.money}>{formatCents(b.shareCents)}</dd>
            </div>
            {b.discountCents > 0 && (
              <div>
                <dt>Partner discount ({PRICES.partnerDiscountPct}%)</dt>
                <dd className={s.money}>{formatCents(-b.discountCents)}</dd>
              </div>
            )}
            <div className={styles.total}>
              <dt>Your share</dt>
              <dd className={s.money}>{formatCents(b.totalCents)}</dd>
            </div>
          </dl>
          <p className={s.small}>
            {state.paid
              ? "You marked your share as paid."
              : handle
                ? "The host paid the place. Pay them back on Venmo."
                : "Ask the host how to pay them back."}
          </p>
          <div className={styles.calButtons}>
            {handle && !state.paid && (
              <a className={s.secondary} href={venmoUrl(handle, b.totalCents, idea.title)} target="_blank" rel="noopener noreferrer">
                Pay @{handle} on Venmo
                <span className="visually-hidden">(opens in a new tab)</span>
              </a>
            )}
            <button type="button" className={s.secondary} onClick={markPaid} disabled={state.paid} aria-pressed={state.paid}>
              <Icon name="check" size={18} />
              {state.paid ? "Paid" : "I paid"}
            </button>
          </div>
        </section>
      )}

      <CostSplit title={idea.title} />

      <div className={s.actions}>
        <button type="button" className={s.primary} onClick={() => router.push("/room/plan")}>
          See the plan
        </button>
        <p className={s.small}>Planning, voting and booking links are free. Hangout never holds your money.</p>
      </div>
    </div>
  );
}
