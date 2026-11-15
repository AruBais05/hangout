"use client";

import Link from "next/link";
import s from "@/components/demo/screen.module.css";
import { sizeOption } from "@/lib/config";
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
        <p className={styles.number}>{sizeOption(m.expectedSize)?.range ?? m.people}</p>
        <p className={styles.unit}>people, roughly</p>
      </div>
      <p className={s.lede}>
        {sizeOption(m.expectedSize)?.name ?? `You and ${others} friends`}. Anyone with the link can join, up to 50.{" "}
        {purposeOf(m).label},{" "}
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
