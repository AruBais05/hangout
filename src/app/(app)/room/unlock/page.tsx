"use client";

import Link from "next/link";
import { useState } from "react";
import { currentAccount } from "@/lib/auth";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { PLAN_FEATURES, PRICES } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { AFTER_UNLOCK, bigReasons, joinedCount, meetingOf } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./unlock.module.css";

export default function Unlock() {
  const [state] = useDemo();
  const [choice, setChoice] = useState<"once" | "pass">("once");
  const m = meetingOf(state);

  if (state.pass || state.unlocked) {
    return (
      <div className={s.screen}>
        <h1 className={s.title}>Big plan unlocked</h1>
        <p className={s.lede}>
          {state.pass ? "Included in your Crew Pass." : `Unlocked for ${formatPrice(PRICES.unlockCents)}.`} Budget
          match, who&rsquo;s in and weekend dates are on.
        </p>
        <div className={s.actions}>
          <Link href={AFTER_UNLOCK} className={s.primary}>
            See the ideas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>This is a big plan</h1>
        <ul className={`${s.chips} ${styles.reasons}`} aria-label="Why">
          {bigReasons(m, joinedCount(state)).map((r) => (
            <li key={r} className={s.chipYellow}>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <section className={s.cardInk} aria-labelledby="found">
        <p id="found" className={styles.found}>
          Hangout found the time that works for your group in {m.city}, and planned ideas that fit everyone.
        </p>
        <p className={styles.locked}>
          <Icon name="lock" size={16} />
          Unlock to see the ideas
        </p>
      </section>

      <fieldset className={styles.choices}>
        <legend className={s.label}>Choose how to unlock</legend>
        <label className={styles.choice}>
          <input type="radio" name="unlock" checked={choice === "once"} onChange={() => setChoice("once")} />
          <span>
            <span className={styles.choiceHead}>
              <strong>Just this plan</strong>
              <strong className={s.money}>{formatPrice(PRICES.unlockCents)}</strong>
            </span>
            <span className={s.sub}>One time. Unlocks this big plan only; your next big plan asks again.</span>
          </span>
        </label>
        <label className={styles.choice}>
          <input type="radio" name="unlock" checked={choice === "pass"} onChange={() => setChoice("pass")} />
          <span>
            <span className={styles.choiceHead}>
              <strong>Crew Pass</strong>
              <strong className={s.money}>{formatPrice(PRICES.passYearlyCents)}/yr</strong>
            </span>
            <span className={s.sub}>
              Every big plan unlocked, no {formatPrice(PRICES.unlockCents)} ever. Plus 5 vote options, cost split and
              your spending.
            </span>
          </span>
        </label>
      </fieldset>

      <section aria-labelledby="inc">
        <h2 id="inc" className={s.label}>
          Both include
        </h2>
        <ul className={styles.features}>
          {PLAN_FEATURES.unlock.map((f) => (
            <li key={f}>
              <Icon name="check" size={18} className={s.ok} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className={s.actions}>
        {choice === "once" ? (
          <Link href="/room/unlock/pay" className={s.primary}>
            Unlock this plan – {formatPrice(PRICES.unlockCents)}
          </Link>
        ) : (
          <Link
            href={currentAccount(state) ? "/pass" : "/signup"}
            className={s.primary}
            onClick={() => update({ returnTo: "/room/unlock" })}
          >
            Get Crew Pass – {formatPrice(PRICES.passYearlyCents)}/year
          </Link>
        )}
        <p className={s.small}>Paid by the organizer. Stripe test mode, no real charge.</p>
      </div>
    </div>
  );
}
