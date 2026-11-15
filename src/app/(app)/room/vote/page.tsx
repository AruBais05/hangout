"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { crewOf, crewVotes, isBig, meetingOf, rankIdeas, tally, winnerOf } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./vote.module.css";

const VOTE_SECONDS = 90;

export default function Vote() {
  const [state] = useDemo();
  const m = meetingOf(state);
  const ideas = rankIdeas(state);
  const votes = tally(state, ideas);
  const byMember = crewVotes(state, ideas);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  const win = winnerOf(state, ideas);

  // The clock is read only in the browser, after mount.
  const [now, setNow] = useState<number | null>(null);
  const left =
    now === null || state.voteEndsAt === null ? VOTE_SECONDS : Math.max(0, Math.ceil((state.voteEndsAt - now) / 1000));
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

  const next = isBig(m) ? "/room/in" : "/room/pay";

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
        <section className={s.cardYellow} aria-live="polite">
          <p className={styles.winLabel}>
            Winner, {votes[win.id]} of {m.people} votes
          </p>
          <p className={styles.winTitle}>{win.title}</p>
          <p>{win.whenLabel}</p>
        </section>
      )}

      <ul className={styles.results} aria-label="Vote count">
        {ideas.map((idea) => {
          const n = votes[idea.id];
          const names = [
            ...crewOf(m)
              .filter((c) => byMember[c.id] === idea.id)
              .map((c) => c.name),
            ...(state.myVote === idea.id ? ["You"] : []),
          ];
          return (
            <li key={idea.id} className={`${styles.result} ${ended && idea.id === win.id ? styles.won : ""}`}>
              <div className={styles.resultTop}>
                <span className={styles.resultName}>{idea.title}</span>
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
          <Link href={next} className={s.primary}>
            {isBig(m) ? "Ask who's really in" : "Lock it and pay my share"}
          </Link>
        ) : (
          <button type="button" className={s.primary} onClick={() => update({ votingEnded: true })}>
            End voting
          </button>
        )}
        <p className={s.small}>{ended ? " " : "Voting also ends when the timer runs out."}</p>
      </div>
    </div>
  );
}
