"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { PLAN_FEATURES, PRICES } from "@/lib/config";
import { formatCents, formatPrice, splitCost } from "@/lib/money";
import { bestCell, bigReasons, meetingOf } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./unlock.module.css";

export default function Unlock() {
  const [state] = useDemo();
  const m = meetingOf(state);
  const allFree = bestCell(state).free >= m.people;
  const unlockEach = splitCost(0, PRICES.unlockCents, m.people).unlockEachCents;

  if (state.pass || state.unlocked) {
    return (
      <div className={s.screen}>
        <h1 className={s.title}>Big plan unlocked</h1>
        <p className={s.lede}>
          {state.pass ? "Included in your Crew Pass." : `Unlocked for ${formatPrice(PRICES.unlockCents)}.`} Budget
          match, who&rsquo;s in, the cost split and reminders are on.
        </p>
        <div className={s.actions}>
          <Link href="/room/ideas" className={s.primary}>
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
          {bigReasons(m).map((r) => (
            <li key={r} className={s.chipYellow}>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <section className={s.cardInk} aria-labelledby="found">
        <p id="found" className={styles.found}>
          Hangout found {allFree ? "a time all" : "the best time for"} {m.people} of you
          {allFree ? " can make" : ""}, and AI-planned ideas that fit the group.
        </p>
        <p className={styles.locked}>
          <Icon name="lock" size={16} />
          Unlock to see them
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
        {formatPrice(PRICES.unlockCents)} once. It goes into the cost split, so about {formatCents(unlockEach)} each.
        If the plan doesn&rsquo;t happen, it carries over to your next one.
      </p>

      <div className={s.actions}>
        <Link href="/room/unlock/pay" className={s.primary}>
          Unlock this plan – {formatPrice(PRICES.unlockCents)}
        </Link>
        <Link href="/plans" className={s.textLink} onClick={() => update({ returnTo: "/room/unlock" })}>
          Plan big often? See Crew Pass
        </Link>
      </div>
    </div>
  );
}
