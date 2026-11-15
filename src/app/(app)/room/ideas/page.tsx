"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { formatCents, formatPrice } from "@/lib/money";
import { isBig, meetingOf, rankIdeas, workableRange } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./ideas.module.css";

const VOTE_SECONDS = 90;

export default function Ideas() {
  const router = useRouter();
  const [state] = useDemo();
  const m = meetingOf(state);
  const big = isBig(m);
  const ideas = rankIdeas(state);
  const range = workableRange(state);
  const [pick, setPick] = useState<string | null>(null);
  const chosen = pick ?? state.myVote;

  if (big && !state.unlocked && !state.pass) {
    return (
      <div className={s.screen}>
        <h1 className={s.title}>Unlock this plan first</h1>
        <p className={s.lede}>Big plans need the one-time unlock or a Crew Pass.</p>
        <div className={s.actions}>
          <Link href="/room/unlock" className={s.primary}>
            Go to unlock
          </Link>
        </div>
      </div>
    );
  }

  function vote() {
    update({ myVote: chosen, votingEnded: false, voteEndsAt: Date.now() + VOTE_SECONDS * 1000 });
    router.push("/room/vote");
  }

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>3 ideas for your crew</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          Ranked by who can make it, then budget and personality. Pick your favorite.
        </p>
      </div>

      {big && (
        <section className={s.cardInk} aria-labelledby="range-title">
          <p id="range-title" className={styles.rangeLabel}>
            <Icon name="lock" size={16} />
            Private budget match
          </p>
          <p className={styles.rangeValue}>
            {formatPrice(range.low)}–{formatPrice(range.high)} a person
          </p>
          <p className={styles.rangeNote}>Works for all {m.people} of you. Nobody&rsquo;s number is shown.</p>
        </section>
      )}

      <fieldset className={styles.ideas}>
        <legend className="visually-hidden">Your vote</legend>
        {ideas.map((idea, i) => (
          <label key={idea.id} className={styles.idea}>
            <input type="radio" name="vote" checked={chosen === idea.id} onChange={() => setPick(idea.id)} />
            <span className={styles.box}>
              <span className={styles.top}>
                <span className={styles.rank} aria-label={`Rank ${i + 1}`}>
                  {i + 1}
                </span>
                <span className={s.grow}>
                  <span className={styles.name}>{idea.title}</span>
                  <span className={s.sub}>
                    {idea.place}, {idea.area}
                  </span>
                  <span className={s.sub}>{idea.whenLabel}</span>
                </span>
                <span className={`${styles.price} ${s.money}`}>
                  {idea.eachCents === 0 ? "Free" : formatCents(idea.eachCents)}
                  {idea.eachCents > 0 && <span className={s.small}>each</span>}
                </span>
              </span>
              <span className={s.chips}>
                {idea.reasons.map((r) => (
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
          {chosen ? (big ? "You book the venue later. Hangout splits the cost." : "Everyone pays at the venue. Hangout is free.") : "Pick one to vote."}
        </p>
      </div>
    </div>
  );
}
