"use client";

import { useRouter } from "next/navigation";
import s from "@/components/demo/screen.module.css";
import { CREW, CREW_AVAILABILITY, DAY_DATES, DAYS, SLOTS, SLOT_TIMES, type SlotKey } from "@/lib/config";
import { update, useDemo } from "@/lib/store";
import styles from "./dates.module.css";

function crewFree(key: SlotKey) {
  return CREW.filter((m) => CREW_AVAILABILITY[m.id].includes(key)).length;
}

export default function Dates() {
  const router = useRouter();
  const [state] = useDemo();
  const mine = state.availability;

  function toggle(key: SlotKey) {
    update((st) => ({
      availability: st.availability.includes(key)
        ? st.availability.filter((k) => k !== key)
        : [...st.availability, key],
    }));
  }

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>When are you free?</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          Tap every time that works. The dots show how many friends are free then.
        </p>
      </div>

      <div className={styles.grid} role="group" aria-label="Your free times">
        <span aria-hidden="true" />
        {SLOTS.map((slot) => (
          <span key={slot} className={styles.head} aria-hidden="true">
            {slot}
            <span className={styles.time}>{SLOT_TIMES[slot].label}</span>
          </span>
        ))}
        {DAYS.map((day) => {
          const date = new Date(`${DAY_DATES[day]}T12:00:00`).getDate();
          return (
            <div key={day} className={styles.row} role="presentation">
              <span className={styles.day} aria-hidden="true">
                {day}
                <span className={styles.date}>Nov {date}</span>
              </span>
              {SLOTS.map((slot) => {
                const key = `${day}-${slot}` as SlotKey;
                const on = mine.includes(key);
                const n = crewFree(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.cell} ${on ? styles.on : ""}`}
                    aria-pressed={on}
                    aria-label={`${day} ${slot}, ${n} of ${CREW.length} friends free`}
                    onClick={() => toggle(key)}
                  >
                    <span className={styles.dots} aria-hidden="true">
                      {CREW.map((m, i) => (
                        <span key={m.id} className={i < n ? styles.dotOn : styles.dot} />
                      ))}
                    </span>
                    <span className={styles.mark} aria-hidden="true">
                      {on ? "Free" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className={s.actions}>
        <button
          type="button"
          className={s.primary}
          disabled={mine.length === 0}
          onClick={() => router.push("/demo/group")}
        >
          Save my times
        </button>
        <p className={s.small} aria-live="polite">
          {mine.length === 0
            ? "Tap at least one time."
            : `${mine.length} time${mine.length > 1 ? "s" : ""} picked`}
        </p>
      </div>
    </div>
  );
}
