"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { PLAN_FEATURES, PRICES } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { AFTER_UNLOCK, bigReasons, joinedCount, meetingOf } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./unlock.module.css";

export default function Unlock() {
  const [state] = useDemo();
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

      <section aria-labelledby="inc">
        <h2 id="inc" className={s.label}>
          The unlock adds
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

      <p className={s.small}>
        {formatPrice(PRICES.unlockCents)} once, paid by the organizer.
        If the plan doesn&rsquo;t happen, it carries over to your next one.
      </p>

      <div className={s.actions}>
        <Link href="/room/unlock/pay" className={s.primary}>
          Unlock the ideas – {formatPrice(PRICES.unlockCents)}
        </Link>
        <Link href="/plans" className={s.textLink} onClick={() => update({ returnTo: "/room/unlock" })}>
          Plan big often? See Crew Pass
        </Link>
      </div>
    </div>
  );
}
