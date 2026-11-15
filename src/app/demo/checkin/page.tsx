"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { CREW } from "@/lib/config";
import { BOOKED, GROUP_SIZE } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./checkin.module.css";

// Positive rankings only: we celebrate who arrived first, never who was late.
const STATUS: Record<string, { here: boolean; text: string }> = {
  maya: { here: true, text: "First through the door, 6:12 PM" },
  jordan: { here: true, text: "Here since 6:15 PM" },
  priya: { here: false, text: "On the way, 10 min" },
  leo: { here: true, text: "Here since 6:18 PM" },
  sam: { here: true, text: "Here since 6:20 PM" },
};

export default function CheckIn() {
  const [state] = useDemo();
  const here = state.checkedIn;
  const count = CREW.filter((m) => STATUS[m.id].here).length + (here ? 1 : 0);

  return (
    <div className={s.screen}>
      <section className={styles.night} aria-labelledby="night-title">
        <p className={styles.clock}>Friday, 6:24 PM</p>
        <h1 id="night-title" className={styles.title}>
          The weekend is here
        </h1>
        <p>{BOOKED.place}</p>
        <p className={styles.count} aria-live="polite">
          <span className={s.money}>{count}</span> of {GROUP_SIZE} here
        </p>
      </section>

      <ul className={s.list} aria-label="Who's here">
        {CREW.map((m) => {
          const st = STATUS[m.id];
          return (
            <li key={m.id} className={s.row}>
              <span className={s.avatar} aria-hidden="true">
                {m.initial}
              </span>
              <span className={s.grow}>
                {m.name}
                <span className={`${s.small} ${styles.status}`}>{st.text}</span>
              </span>
              {st.here && <Icon name="check" size={20} label="Here" className={styles.ok} />}
            </li>
          );
        })}
        <li className={s.row}>
          <span className={s.avatarYou} aria-hidden="true">
            Y
          </span>
          <span className={s.grow}>
            You
            <span className={`${s.small} ${styles.status}`}>
              {here ? "Here since 6:24 PM" : "Not checked in"}
            </span>
          </span>
          {here && <Icon name="check" size={20} label="Here" className={styles.ok} />}
        </li>
      </ul>

      <div className={s.actions}>
        {here ? (
          <Link href="/demo/recap" className={s.primary}>
            See the recap
          </Link>
        ) : (
          <button type="button" className={s.primary} onClick={() => update({ checkedIn: true })}>
            I&rsquo;m here
          </button>
        )}
        <p className={s.small} aria-live="polite">
          {here ? "You're checked in. Have a great weekend." : "Let the crew know you made it."}
        </p>
      </div>
    </div>
  );
}
