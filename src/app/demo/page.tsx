"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { CREW, GROUP_NAME } from "@/lib/config";
import { restartPlan } from "@/lib/store";
import styles from "./start.module.css";

export default function DemoStart() {
  const router = useRouter();

  function start() {
    restartPlan();
    router.push("/demo/quiz");
  }

  return (
    <div className={s.screen}>
      <h1 className={s.bigTitle}>Your crew is waiting on you.</h1>

      <div className={styles.chat} aria-label="Group chat">
        <p className={styles.them}>
          <span className={styles.who}>Maya</span>we should do a weekend away before the holidays
        </p>
        <p className={styles.them}>
          <span className={styles.who}>Jordan</span>yes!! when is everyone free
        </p>
        <p className={styles.bot}>
          <span className={styles.who}>Hangout</span>You started a plan: Weekend away. 5 of 6 have
          answered. Waiting on you.
        </p>
      </div>

      <section className={s.card} aria-labelledby="crew-title">
        <h2 id="crew-title" className={s.sectionLabel}>
          {GROUP_NAME}
        </h2>
        <ul className={s.list}>
          {CREW.map((m) => (
            <li key={m.id} className={s.row}>
              <span className={s.avatar} aria-hidden="true">
                {m.initial}
              </span>
              <span className={s.grow}>{m.name}</span>
              <span className={s.badgeSoft}>
                <Icon name="check" size={14} />
                Answered
              </span>
            </li>
          ))}
          <li className={s.row}>
            <span className={s.avatarYou} aria-hidden="true">
              Y
            </span>
            <span className={s.grow}>You, organizer</span>
            <span className={s.small}>Not yet</span>
          </li>
        </ul>
      </section>

      <div className={s.actions}>
        <button type="button" className={s.primary} onClick={start}>
          Add my answers
        </button>
        <p className={s.small}>Sample crew. Nothing is sent anywhere.</p>
      </div>
    </div>
  );
}
