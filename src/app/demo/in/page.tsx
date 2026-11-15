"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { ANSWER_BY, CREW } from "@/lib/config";
import { GROUP_SIZE } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./in.module.css";

// Sam hasn't answered; Hangout chases Sam so the organizer doesn't have to.
const LATE = "sam";

export default function WhoIsIn() {
  const [state] = useDemo();
  const [lateIn, setLateIn] = useState(false);

  useEffect(() => {
    if (!state.imIn) return;
    const t = setTimeout(() => setLateIn(true), 1500);
    return () => clearTimeout(t);
  }, [state.imIn]);

  const inCount = CREW.filter((m) => m.id !== LATE || lateIn).length + (state.imIn ? 1 : 0);
  const allIn = inCount === GROUP_SIZE;

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>Who&rsquo;s really in?</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          Everyone says yes or no by {ANSWER_BY}. Nobody books for six until then.
        </p>
      </div>

      <p className={styles.count} aria-live="polite">
        <span className={s.money}>{inCount}</span> of {GROUP_SIZE} in
      </p>

      <ul className={s.list} aria-label="Answers">
        {CREW.map((m) => {
          const waiting = m.id === LATE && !lateIn;
          return (
            <li key={m.id} className={s.row}>
              <span className={s.avatar} aria-hidden="true">
                {m.initial}
              </span>
              <span className={s.grow}>
                {m.name}
                <span className={`${s.small} ${styles.status}`}>
                  {waiting ? "No answer yet. Hangout sent a reminder." : "In"}
                </span>
              </span>
              {waiting ? (
                <Icon name="clock" size={20} label="Waiting" className={styles.wait} />
              ) : (
                <Icon name="check" size={20} label="In" className={styles.ok} />
              )}
            </li>
          );
        })}
        <li className={s.row}>
          <span className={s.avatarYou} aria-hidden="true">
            Y
          </span>
          <span className={s.grow}>
            You
            <span className={`${s.small} ${styles.status}`}>{state.imIn ? "In" : "Your turn"}</span>
          </span>
          {state.imIn && <Icon name="check" size={20} label="In" className={styles.ok} />}
        </li>
      </ul>

      <div className={s.actions}>
        {!state.imIn ? (
          <button type="button" className={s.primary} onClick={() => update({ imIn: true })}>
            I&rsquo;m in
          </button>
        ) : (
          <Link
            href="/demo/booked"
            className={s.primary}
            aria-disabled={!allIn}
            onClick={(e) => !allIn && e.preventDefault()}
            style={allIn ? undefined : { opacity: 0.45, cursor: "not-allowed" }}
          >
            Lock the plan
          </Link>
        )}
        <p className={s.small} aria-live="polite">
          {!state.imIn ? "Tap to say yes." : allIn ? "Everyone's in." : "Waiting on Sam…"}
        </p>
      </div>
    </div>
  );
}
