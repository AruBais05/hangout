"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { crewOf, meetingOf, rankIdeas, winnerOf } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";

export default function Night() {
  const [state] = useDemo();
  const m = meetingOf(state);
  const crew = crewOf(m);
  const idea = winnerOf(state, rankIdeas(state));
  const here = state.checkedIn;
  // Positive rankings only: we celebrate who arrived first, never who was late.
  const status = (i: number) =>
    i === 0 ? "First through the door" : i === crew.length - 1 ? "On the way, 5 min" : "Here";
  const count = crew.filter((_, i) => i !== crew.length - 1).length + (here ? 1 : 0);

  return (
    <div className={s.screen}>
      <section className={s.cardInk} aria-labelledby="day-title">
        <p style={{ color: "var(--yellow)", fontWeight: 800 }}>{idea.whenLabel}</p>
        <h1 id="day-title" className={s.title} style={{ margin: "6px 0" }}>
          It&rsquo;s today
        </h1>
        <p>
          {idea.title} at {idea.place}
        </p>
        <p aria-live="polite" style={{ marginTop: 10, fontWeight: 800, fontSize: "1.2rem" }}>
          <span className={s.money}>{count}</span> of {m.people} here
        </p>
      </section>

      <ul className={s.list} aria-label="Who's here">
        {crew.map((c, i) => (
          <li key={c.id} className={s.row}>
            <span className={i === crew.length - 1 ? s.avatarEmpty : s.avatarJoined} aria-hidden="true">
              {c.name[0]}
            </span>
            <span className={s.grow}>
              {c.name}
              <span className={s.sub}>{status(i)}</span>
            </span>
            {i === 0 && <span className={s.chipYellow}>First in</span>}
            {i !== 0 && i !== crew.length - 1 && <Icon name="check" size={20} label="Here" className={s.ok} />}
          </li>
        ))}
        <li className={s.row}>
          <span className={here ? s.avatarYou : s.avatarEmpty} aria-hidden="true">
            Y
          </span>
          <span className={s.grow}>
            You
            <span className={s.sub}>{here ? "Here" : "Not checked in"}</span>
          </span>
          {here && <Icon name="check" size={20} label="Here" className={s.ok} />}
        </li>
      </ul>

      <div className={s.actions}>
        {here ? (
          <Link href="/room/recap" className={s.primary}>
            See the recap
          </Link>
        ) : (
          <button type="button" className={s.primary} onClick={() => update({ checkedIn: true })}>
            I&rsquo;m here
          </button>
        )}
        <p className={s.small} aria-live="polite">
          {here ? "You're checked in. Have fun." : "Let the crew know you made it."}
        </p>
      </div>
    </div>
  );
}
