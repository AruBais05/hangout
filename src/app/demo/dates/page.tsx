"use client";

import { useRouter } from "next/navigation";
import s from "@/components/demo/screen.module.css";
import { CREW, PARTS, WEEKENDS, type SlotKey } from "@/lib/config";
import { crewFreeCount } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./dates.module.css";

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

  function toggleWeekend(id: string) {
    const keys = PARTS.map((p) => `${id}|${p}` as SlotKey);
    update((st) => {
      const all = keys.every((k) => st.availability.includes(k));
      const rest = st.availability.filter((k) => !keys.includes(k));
      return { availability: all ? rest : [...rest, ...keys] };
    });
  }

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>Which weekends work?</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          Tap the parts you&rsquo;re free, or a date to pick the whole weekend. Dots show how many
          friends are free.
        </p>
      </div>

      <div className={styles.grid} role="group" aria-label="Your free weekends">
        <span aria-hidden="true" />
        {PARTS.map((p) => (
          <span key={p} className={styles.head} aria-hidden="true">
            {p}
          </span>
        ))}
        {WEEKENDS.map((w) => (
          <div key={w.id} className={styles.row} role="presentation">
            <button
              type="button"
              className={styles.day}
              onClick={() => toggleWeekend(w.id)}
              aria-label={`Whole weekend ${w.label}`}
            >
              {w.label}
            </button>
            {PARTS.map((p) => {
              const key = `${w.id}|${p}` as SlotKey;
              const on = mine.includes(key);
              const n = crewFreeCount(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`${styles.cell} ${on ? styles.on : ""}`}
                  aria-pressed={on}
                  aria-label={`${w.label}, ${p}, ${n} of ${CREW.length} friends free`}
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
        ))}
      </div>

      <div className={s.actions}>
        <button
          type="button"
          className={s.primary}
          disabled={mine.length === 0}
          onClick={() => router.push("/demo/unlock")}
        >
          Save my weekends
        </button>
        <p className={s.small} aria-live="polite">
          {mine.length === 0 ? "Tap at least one time." : `${mine.length} picked`}
        </p>
      </div>
    </div>
  );
}
