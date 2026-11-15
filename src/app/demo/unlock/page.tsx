"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { OPTIONS, PLAN_FEATURES, PRICES } from "@/lib/config";
import { formatCents, formatPrice, splitCost } from "@/lib/money";
import { GROUP_SIZE, bestWeekend, bigPlanReasons, workableRange } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./unlock.module.css";

export default function Unlock() {
  const [state] = useDemo();
  const best = bestWeekend(state.availability);
  const { high } = workableRange(state.budgetCents ?? 20000);
  const inRange = OPTIONS.filter((o) => Math.round(o.totalCents / GROUP_SIZE) <= high).length;
  const reasons = bigPlanReasons(3, GROUP_SIZE, 0);
  const unlockEach = splitCost(0, PRICES.unlockCents, GROUP_SIZE).unlockEachCents;

  if (state.pass || state.unlocked) {
    return (
      <div className={s.screen}>
        <h1 className={s.bigTitle}>Big plan unlocked.</h1>
        <section className={s.cardPurple}>
          <p className={styles.found}>
            {state.pass ? "Included in your Crew Pass." : `Unlocked for ${formatPrice(PRICES.unlockCents)}.`}
          </p>
          <p>Private budget match, who&rsquo;s in, cost split and reminders are on for this plan.</p>
        </section>
        <div className={s.actions}>
          <Link href="/demo/options" className={s.primary}>
            See your options
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>This is a big plan.</h1>
        <ul className={`${s.chips} ${styles.reasons}`} aria-label="Why">
          {reasons.map((r) => (
            <li key={r} className={s.badgeSoft}>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <section className={s.cardPurple} aria-labelledby="found-title">
        <p id="found-title" className={styles.found}>
          Hangout found {best.count === GROUP_SIZE ? "a weekend all" : `a weekend ${best.count} of`}{" "}
          {GROUP_SIZE} of you can make, and {inRange} stay{inRange === 1 ? "" : "s"} inside a budget
          that works for everyone.
        </p>
        <p className={styles.lockedNote}>
          <Icon name="lock" size={16} />
          Unlock to see them
        </p>
      </section>

      <section aria-labelledby="inc-title">
        <h2 id="inc-title" className={s.sectionLabel}>
          What the unlock adds to this plan
        </h2>
        <ul className={styles.features}>
          {PLAN_FEATURES.unlock.map((f) => (
            <li key={f}>
              <Icon name="check" size={18} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.terms}>
        {formatPrice(PRICES.unlockCents)} once. It goes into the cost split, so it&rsquo;s about{" "}
        {formatCents(unlockEach)} each. If the plan doesn&rsquo;t happen, it carries over to your next
        one.
      </p>

      <div className={s.actions}>
        <Link href="/demo/unlock/pay" className={s.primary}>
          Unlock this plan – {formatPrice(PRICES.unlockCents)}
        </Link>
        <Link
          href="/demo/plans"
          className={s.textLink}
          onClick={() => update({ returnTo: "/demo/unlock" })}
        >
          Plan big often? See Crew Pass
        </Link>
      </div>
    </div>
  );
}
