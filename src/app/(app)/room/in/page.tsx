"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { crewOf, meetingOf } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";

export default function WhoIsIn() {
  const [state] = useDemo();
  const m = meetingOf(state);
  const crew = crewOf(m);
  const late = crew[crew.length - 1]?.id; // Hangout chases this friend for you
  const [lateIn, setLateIn] = useState(false);

  useEffect(() => {
    if (!state.imIn) return;
    const t = setTimeout(() => setLateIn(true), 1500);
    return () => clearTimeout(t);
  }, [state.imIn]);

  const inCount = crew.filter((c) => c.id !== late || lateIn).length + (state.imIn ? 1 : 0);
  const allIn = inCount === m.people;

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>Who&rsquo;s really in?</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          Everyone says yes or no by Wednesday, 6 PM. Nobody books for {m.people} until then.
        </p>
      </div>

      <p className={s.title} aria-live="polite" style={{ fontSize: "1.6rem" }}>
        <span className={s.money}>{inCount}</span> of {m.people} in
      </p>

      <ul className={s.list} aria-label="Answers">
        {crew.map((c) => {
          const waiting = c.id === late && !lateIn;
          return (
            <li key={c.id} className={s.row}>
              <span className={waiting ? s.avatarEmpty : s.avatarJoined} aria-hidden="true">
                {c.name[0]}
              </span>
              <span className={s.grow}>
                {c.name}
                <span className={s.sub}>{waiting ? "No answer yet. Hangout sent a reminder." : "In"}</span>
              </span>
              {waiting ? (
                <Icon name="clock" size={20} label="Waiting" />
              ) : (
                <Icon name="check" size={20} label="In" className={s.ok} />
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
            <span className={s.sub}>{state.imIn ? "In" : "Your turn"}</span>
          </span>
          {state.imIn && <Icon name="check" size={20} label="In" className={s.ok} />}
        </li>
      </ul>

      <div className={s.actions}>
        {!state.imIn ? (
          <button type="button" className={s.primary} onClick={() => update({ imIn: true })}>
            I&rsquo;m in
          </button>
        ) : (
          <Link
            href="/room/pay"
            className={s.primary}
            aria-disabled={!allIn}
            onClick={(e) => !allIn && e.preventDefault()}
          >
            Lock the plan
          </Link>
        )}
        <p className={s.small} aria-live="polite">
          {!state.imIn ? "Tap to say yes." : allIn ? "Everyone's in." : `Waiting on ${crew.find((c) => c.id === late)?.name}…`}
        </p>
      </div>
    </div>
  );
}
