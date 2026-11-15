"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { HISTORY } from "@/lib/config";
import { meetingOf, rankIdeas, winnerOf } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";

/** Crew Pass: your group's past hangouts. Free users see it locked. */
export default function History() {
  const [state] = useDemo();
  const current = state.meeting && state.votingEnded ? winnerOf(state, rankIdeas(state)) : null;
  const m = meetingOf(state);
  const rows = [
    ...(current ? [{ date: "This week", title: current.title, place: `${current.place}, ${m.city}`, went: m.people }] : []),
    ...HISTORY,
  ];

  return (
    <div className={s.screen}>
      <h1 className={s.title}>History</h1>
      {state.pass ? (
        <ul className={s.list}>
          {rows.map((h) => (
            <li key={`${h.date}-${h.title}`} className={s.row}>
              <span className={s.avatarJoined} aria-hidden="true">
                <Icon name="calendar" size={16} />
              </span>
              <span className={s.grow}>
                {h.title}
                <span className={s.sub}>
                  {h.date} · {h.place} · {h.went} went
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <section className={s.cardLine}>
          <p className={s.lede}>Every hangout your group has done, in one place.</p>
          <Link href="/plans" className={s.secondary} onClick={() => update({ returnTo: "/history" })}>
            <Icon name="lock" size={18} />
            See your history with Crew Pass
          </Link>
        </section>
      )}
    </div>
  );
}
