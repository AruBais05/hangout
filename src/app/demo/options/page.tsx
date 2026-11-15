"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { CREW } from "@/lib/config";
import { formatCents, formatPrice } from "@/lib/money";
import { bestWeekend, rankOptions, weekendLabel, workableRange } from "@/lib/plan";
import { isOpen, update, useDemo } from "@/lib/store";
import styles from "./options.module.css";

const VOTE_SECONDS = 90;

export default function Options() {
  const router = useRouter();
  const [state] = useDemo();
  const budget = state.budgetCents ?? 20000;
  const options = rankOptions(state.availability, budget, state.vibe ?? "active");
  const range = workableRange(budget);
  const best = bestWeekend(state.availability);
  const [pick, setPick] = useState<string | null>(null);
  const chosen = pick ?? state.myVote;

  if (!isOpen(state)) {
    return (
      <div className={s.screen}>
        <h1 className={s.title}>Unlock this plan first</h1>
        <p className={s.lede}>Big plans need the one-time unlock or a Crew Pass.</p>
        <div className={s.actions}>
          <Link href="/demo/unlock" className={s.primary}>
            Go to unlock
          </Link>
        </div>
      </div>
    );
  }

  function vote() {
    update({ myVote: chosen, votingEnded: false, voteEndsAt: Date.now() + VOTE_SECONDS * 1000 });
    router.push("/demo/vote");
  }

  return (
    <div className={s.screen}>
      <h1 className={s.title}>3 stays for {weekendLabel(best.id)}</h1>

      <section className={styles.range} aria-labelledby="range-title">
        <p id="range-title" className={styles.rangeLabel}>
          <Icon name="lock" size={16} />
          Private budget match
        </p>
        <p className={styles.rangeValue}>
          {formatPrice(range.low)}–{formatPrice(range.high)} a person
        </p>
        <p className={styles.rangeNote}>
          Works for all {CREW.length + 1} of you. Nobody&rsquo;s number is shown.
        </p>
      </section>

      <fieldset className={styles.options}>
        <legend className="visually-hidden">Your vote</legend>
        {options.map((o, i) => (
          <label key={o.id} className={styles.option}>
            <input
              type="radio"
              name="vote"
              value={o.id}
              checked={chosen === o.id}
              onChange={() => setPick(o.id)}
            />
            <span className={styles.box}>
              <span className={styles.top}>
                <span className={styles.rank} aria-label={`Rank ${i + 1}`}>
                  {i + 1}
                </span>
                <span className={s.grow}>
                  <span className={styles.name}>{o.title}</span>
                  <span className={styles.meta}>
                    {o.place}, {o.address}
                  </span>
                </span>
                <span className={`${styles.price} ${s.money}`}>
                  {formatCents(o.eachCents)}
                  <span className={styles.each}>each</span>
                </span>
              </span>
              <span className={styles.reasons}>
                {o.reasons.map((r) => (
                  <span key={r} className={styles.reason}>
                    <Icon name="check" size={14} />
                    {r}
                  </span>
                ))}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className={s.actions}>
        <button type="button" className={s.primary} disabled={!chosen} onClick={vote}>
          Vote for this
        </button>
        <p className={s.small} aria-live="polite">
          {chosen ? "Prices are for 2 nights, split 6 ways." : "Pick one to vote."}
        </p>
      </div>
    </div>
  );
}
