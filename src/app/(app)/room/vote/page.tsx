"use client";

import Link from "next/link";
import s from "@/components/demo/screen.module.css";
import { crewOf, crewVotes, isBig, meetingOf, rankIdeas, tally, winnerOf } from "@/lib/plan";
import { updateRoom } from "@/lib/cloud";
import { update, useDemo } from "@/lib/store";
import styles from "./vote.module.css";

export default function Vote() {
  const [state] = useDemo();
  const m = meetingOf(state);
  const ideas = rankIdeas(state);
  const votes = tally(state, ideas);
  const byMember = crewVotes(state, ideas);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  const win = winnerOf(state, ideas);

  // No timer: friends can open the room and vote any time. The host ends voting.
  const ended = state.votingEnded;
  const waiting = Math.max(0, m.people - total);

  const next = isBig(m) ? "/room/in" : "/room/pay";

  return (
    <div className={s.screen}>
      <div className={styles.head}>
        <h1 className={s.title}>{ended ? "The crew picked" : "Votes are in"}</h1>
        {!ended && (
          <span className={styles.timer}>
            {total} voted
          </span>
        )}
      </div>

      {ended && (
        <section className={s.cardYellow} aria-live="polite">
          <p className={styles.winLabel}>
            Winner, {votes[win.id]} of {Object.values(votes).reduce((a, b) => a + b, 0)} votes
          </p>
          <p className={styles.winTitle}>{win.title}</p>
          <p>{win.whenLabel}</p>
        </section>
      )}

      <ul className={styles.results} aria-label="Vote count">
        {ideas.map((idea) => {
          const n = votes[idea.id];
          const names = [
            ...state.cloudMembers.filter((x) => x.vote === idea.id).map((x) => x.name),
            ...(state.crewJoined > 0 || !state.cloudMembers.length ? crewOf(m) : [])
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
            {isBig(m) ? "Ask who's really in" : "Lock the plan"}
          </Link>
        ) : (
          <button
            type="button"
            className={s.primary}
            onClick={() => {
              update({ votingEnded: true });
              if (state.room?.host) void updateRoom({ voting_ended: true });
            }}
          >
            End voting
          </button>
        )}
        <p className={s.small}>
          {ended
            ? " "
            : `Friends can vote any time from the invite link${waiting ? `; ${waiting} more expected` : ""}. End voting when you're ready.`}
        </p>
      </div>
    </div>
  );
}
