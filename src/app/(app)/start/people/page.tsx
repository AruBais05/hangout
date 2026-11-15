"use client";

import Link from "next/link";
import s from "@/components/demo/screen.module.css";
import { meetingOf, purposeOf, rangeLabel } from "@/lib/plan";
import { useDemo } from "@/lib/store";
import styles from "./people.module.css";

export default function People() {
  const [state] = useDemo();
  const m = meetingOf(state);
  const others = m.people - 1;

  return (
    <div className={s.screen}>
      <div className={styles.hero}>
        <p className={styles.number}>{m.people}</p>
        <p className={styles.unit}>people</p>
      </div>
      <p className={s.lede}>
        You and {others} friend{others === 1 ? "" : "s"}. {purposeOf(m).label},{" "}
        {rangeLabel(m.from, m.to)}
        {m.name ? `, “${m.name}”` : ""}.
      </p>

      <ul className={styles.seats} aria-label="Seats">
        <li>
          <span className={s.avatarYou} aria-hidden="true">
            Y
          </span>
          <span>You</span>
        </li>
        {Array.from({ length: others }, (_, i) => (
          <li key={i}>
            <span className={s.avatarEmpty} aria-hidden="true" />
            <span className={s.small}>Open</span>
          </li>
        ))}
      </ul>

      <p className={s.small}>
        Next you&rsquo;ll get an invite link. Each friend adds their free times and takes a short quiz
        when they join.
      </p>

      <div className={s.actions}>
        <Link href="/room" className={s.primary}>
          Open the waiting room
        </Link>
        <Link href="/start" className={s.textLink}>
          Change settings
        </Link>
      </div>
    </div>
  );
}
