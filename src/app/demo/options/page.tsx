"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { LIMITS } from "@/lib/config";
import { formatCents } from "@/lib/money";
import { longDate, rankOptions } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./options.module.css";

export default function Options() {
  const router = useRouter();
  const [state] = useDemo();
  const options = rankOptions(
    state.availability,
    state.budgetCents ?? 4000,
    state.vibe ?? "active",
    !!state.pass,
  );
  const [pick, setPick] = useState<string | null>(state.myVote ?? null);

  function vote() {
    update({ myVote: pick, votingEnded: false, voteEndsAt: Date.now() + LIMITS.voteSeconds * 1000 });
    router.push("/demo/vote");
  }

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>{options.length} ideas for your crew</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          Ranked by who can make it, then budget and vibe. Pick your favorite.
        </p>
      </div>

      <fieldset className={styles.options}>
        <legend className="visually-hidden">Your vote</legend>
        {options.map((o, i) => (
          <label key={o.id} className={styles.option}>
            <input
              type="radio"
              name="vote"
              value={o.id}
              checked={pick === o.id}
              onChange={() => setPick(o.id)}
            />
            <span className={styles.box}>
              <span className={styles.top}>
                <span className={styles.rank} aria-label={`Rank ${i + 1}`}>
                  {i + 1}
                </span>
                <span className={s.grow}>
                  <span className={styles.name}>{o.title}</span>
                  <span className={styles.meta}>{o.venue}</span>
                  <span className={styles.meta}>{longDate(o.slot)}</span>
                </span>
                <span className={`${styles.price} ${s.money}`}>
                  {formatCents(o.shareCents)}
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

      {!state.pass && (
        <p className={s.small}>
          Groups with a Hangout Pass get {LIMITS.voteOptionsPass} ideas.{" "}
          <Link href="/demo/plans" className={styles.inline}>
            See plans
          </Link>
        </p>
      )}

      <div className={s.actions}>
        <button type="button" className={s.primary} disabled={!pick} onClick={vote}>
          Vote for this
        </button>
        <p className={s.small} aria-live="polite">
          {pick ? " " : "Pick one to vote."}
        </p>
      </div>
    </div>
  );
}
