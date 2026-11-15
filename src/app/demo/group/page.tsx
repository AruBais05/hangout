"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { CREW, CREW_AVAILABILITY, DAYS, GROUP_NAME, SLOTS, type SlotKey } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { freeCount, longDate } from "@/lib/plan";
import { useDemo } from "@/lib/store";
import styles from "./group.module.css";

const EXTRAS = ["Auto-plan", "Trip mode", "Surprise mode", "5 vote options", "Full recaps"];

export default function Group() {
  const [state] = useDemo();
  const mine = state.availability;
  const all = DAYS.flatMap((d) => SLOTS.map((sl) => `${d}-${sl}` as SlotKey));
  const best = all.reduce((a, b) => (freeCount(b, mine) > freeCount(a, mine) ? b : a), all[0]);
  const bestCount = freeCount(best, mine);
  const size = CREW.length + 1;

  return (
    <div className={s.screen}>
      <div className={styles.head}>
        <h1 className={s.title}>{GROUP_NAME}</h1>
        {state.pass && (
          <span className={s.badge}>
            <Icon name="star" size={14} />
            Pass extras on
          </span>
        )}
      </div>

      <section className={s.cardPurple} aria-labelledby="best-title">
        <p id="best-title" className={styles.bestLabel}>
          Best time
        </p>
        <p className={styles.bestTime}>{longDate(best)}</p>
        <p>
          {bestCount === size ? `All ${size} of you are free.` : `${bestCount} of ${size} people are free.`}
        </p>
      </section>

      {state.pass && (
        <section aria-label="Pass extras for this group">
          <p className={s.small} style={{ marginBottom: 8 }}>
            Unlocked for everyone in the group:
          </p>
          <ul className={`${s.chips} ${styles.extras}`}>
            {EXTRAS.map((e) => (
              <li key={e} className={s.badgeSoft}>
                {e}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="who-title">
        <h2 id="who-title" className={s.sectionLabel}>
          Everyone&rsquo;s in
        </h2>
        <ul className={s.list}>
          {CREW.map((m) => (
            <li key={m.id} className={s.row}>
              <span className={s.avatar} aria-hidden="true">
                {m.initial}
              </span>
              <span className={s.grow}>
                {m.name}
                <span className={`${s.small} ${styles.meta}`}>
                  {m.vibe === "active" ? "Active" : "Chill"}, up to {formatPrice(m.budgetCents)},{" "}
                  {CREW_AVAILABILITY[m.id].length} times
                </span>
              </span>
              <Icon name="check" size={20} label="Answered" className={styles.ok} />
            </li>
          ))}
          <li className={s.row}>
            <span className={s.avatarYou} aria-hidden="true">
              Y
            </span>
            <span className={s.grow}>
              You
              <span className={`${s.small} ${styles.meta}`}>
                {state.vibe === "chill" ? "Chill" : "Active"}, up to{" "}
                {formatPrice(state.budgetCents ?? 4000)}, {mine.length} times
              </span>
            </span>
            <Icon name="check" size={20} label="Answered" className={styles.ok} />
          </li>
        </ul>
      </section>

      <div className={s.actions}>
        <Link href="/demo/options" className={s.primary}>
          See plan ideas
        </Link>
      </div>
    </div>
  );
}
