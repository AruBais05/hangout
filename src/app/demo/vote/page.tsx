"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { CREW, CREW_VOTES, OPTIONS } from "@/lib/config";
import { BOOKED, tally, weekendLabel } from "@/lib/plan";
import { PLAN_WEEKEND } from "@/lib/config";
import { update, useDemo } from "@/lib/store";
import styles from "./vote.module.css";

const VOTE_SECONDS = 90;

export default function Vote() {
  const [state] = useDemo();
  const votes = tally(state.myVote);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  // The clock is read only in the browser, after mount.
  const [now, setNow] = useState<number | null>(null);
  const left =
    now === null || state.voteEndsAt === null
      ? VOTE_SECONDS
      : Math.max(0, Math.ceil((state.voteEndsAt - now) / 1000));
  const ended = state.votingEnded || left === 0;

  useEffect(() => {
    if (ended) return;
    if (state.voteEndsAt === null) update({ voteEndsAt: Date.now() + VOTE_SECONDS * 1000 });
    const tick = () => setNow(Date.now());
    const first = requestAnimationFrame(tick);
    const t = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(t);
    };
  }, [ended, state.voteEndsAt]);

  const votersFor = (id: string) => CREW.filter((m) => CREW_VOTES[m.id] === id).map((m) => m.name);

  return (
    <div className={s.screen}>
      <div className={styles.head}>
        <h1 className={s.title}>{ended ? "The crew picked" : "Votes are in"}</h1>
        {!ended && (
          <span className={styles.timer}>
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
          <p className={styles.winTitle}>{BOOKED.title}</p>
          <p>
            {BOOKED.place}, {weekendLabel(PLAN_WEEKEND)}
          </p>
        </section>
      )}

      <ul className={s.list} aria-label="Vote count">
        {OPTIONS.map((o) => {
          const n = votes[o.id];
          const names = [...votersFor(o.id), ...(state.myVote === o.id ? ["You"] : [])];
          return (
            <li key={o.id} className={`${styles.option} ${ended && o.id === BOOKED.id ? styles.won : ""}`}>
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
          <Link href="/demo/in" className={s.primary}>
            Ask who&rsquo;s really in
          </Link>
        ) : (
          <button type="button" className={s.primary} onClick={() => update({ votingEnded: true })}>
            End voting
          </button>
        )}
        <p className={s.small}>
          {ended ? "Nobody books until everyone says yes or no." : "Voting also ends when the timer runs out."}
        </p>
      </div>
    </div>
  );
}
