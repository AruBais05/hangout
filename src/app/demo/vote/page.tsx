"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { CREW, CREW_VOTES, LIMITS } from "@/lib/config";
import { longDate, rankOptions, tally, winner } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./vote.module.css";

export default function Vote() {
  const [state] = useDemo();
  const options = rankOptions(
    state.availability,
    state.budgetCents ?? 4000,
    state.vibe ?? "active",
    !!state.pass,
  );
  const ids = options.map((o) => o.id);
  const votes = tally(ids, state.myVote);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  // The clock is read only in the browser, after mount.
  const [now, setNow] = useState<number | null>(null);
  const left =
    now === null || state.voteEndsAt === null
      ? LIMITS.voteSeconds
      : Math.max(0, Math.ceil((state.voteEndsAt - now) / 1000));
  const ended = state.votingEnded || left === 0;

  useEffect(() => {
    if (ended) return;
    if (state.voteEndsAt === null) update({ voteEndsAt: Date.now() + LIMITS.voteSeconds * 1000 });
    const tick = () => setNow(Date.now());
    const first = requestAnimationFrame(tick);
    const t = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(t);
    };
  }, [ended, state.voteEndsAt]);

  const win = winner(ids, state.myVote);
  const votersFor = (id: string) => CREW.filter((m) => CREW_VOTES[m.id] === id).map((m) => m.name);

  return (
    <div className={s.screen}>
      <div className={styles.head}>
        <h1 className={s.title}>{ended ? "The crew picked" : "Votes are in"}</h1>
        {!ended && (
          <span className={styles.timer} aria-live="off">
            <Icon name="clock" size={16} />
            <span className={s.money}>
              {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
            </span>
            <span className="visually-hidden">left to vote</span>
          </span>
        )}
      </div>

      {ended && (
        <section className={s.cardPurple} aria-live="polite">
          <p className={styles.winLabel}>Winner</p>
          <p className={styles.winTitle}>{win.title}</p>
          <p>
            {win.venue}, {longDate(win.slot)}
          </p>
        </section>
      )}

      <ul className={s.list} aria-label="Vote count">
        {options.map((o) => {
          const n = votes[o.id];
          const names = [...votersFor(o.id), ...(state.myVote === o.id ? ["You"] : [])];
          return (
            <li key={o.id} className={`${styles.option} ${ended && o.id === win.id ? styles.won : ""}`}>
              <div className={styles.optionTop}>
                <span className={styles.optionName}>{o.title}</span>
                <span className={s.money}>
                  {n} vote{n === 1 ? "" : "s"}
                </span>
              </div>
              <div className={styles.bar} aria-hidden="true">
                <span style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
              </div>
              <p className={s.small}>{names.length ? names.join(", ") : "No votes yet"}</p>
            </li>
          );
        })}
      </ul>

      <div className={s.actions}>
        {ended ? (
          <Link href="/demo/pay" className={s.primary}>
            Pay my share
          </Link>
        ) : (
          <button type="button" className={s.primary} onClick={() => update({ votingEnded: true })}>
            End voting
          </button>
        )}
        <p className={s.small}>
          {ended ? "Everyone pays their own share." : "Voting also ends when the timer runs out."}
        </p>
      </div>
    </div>
  );
}
