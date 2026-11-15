"use client";

import { useRouter } from "next/navigation";
import s from "@/components/demo/screen.module.css";
import { formatPrice } from "@/lib/money";
import { update, useDemo } from "@/lib/store";
import styles from "./quiz.module.css";

const BUDGETS = [2500, 4000, 6000, 8000];

export default function Quiz() {
  const router = useRouter();
  const [state] = useDemo();
  const { budgetCents, vibe } = state;

  return (
    <div className={s.screen}>
      <h1 className={s.title}>What are you up for?</h1>

      <fieldset className={styles.group}>
        <legend className={s.sectionLabel}>Your budget per person</legend>
        <div className={styles.budgets}>
          {BUDGETS.map((b, i) => (
            <label key={b} className={styles.pill}>
              <input
                type="radio"
                name="budget"
                checked={budgetCents === b}
                onChange={() => update({ budgetCents: b })}
              />
              <span>
                {i === BUDGETS.length - 1 ? `${formatPrice(b)}+` : `Up to ${formatPrice(b)}`}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={s.sectionLabel}>Your vibe</legend>
        <div className={styles.vibes}>
          <label className={styles.vibe}>
            <input
              type="radio"
              name="vibe"
              checked={vibe === "active"}
              onChange={() => update({ vibe: "active" })}
            />
            <span className={styles.vibeBox}>
              <span className={styles.vibeName}>Active</span>
              <span className={styles.vibeHint}>Climbing, bowling, a long walk</span>
            </span>
          </label>
          <label className={styles.vibe}>
            <input
              type="radio"
              name="vibe"
              checked={vibe === "chill"}
              onChange={() => update({ vibe: "chill" })}
            />
            <span className={styles.vibeBox}>
              <span className={styles.vibeName}>Chill</span>
              <span className={styles.vibeHint}>Dinner, pottery, karaoke</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className={s.actions}>
        <button
          type="button"
          className={s.primary}
          disabled={!budgetCents || !vibe}
          onClick={() => router.push("/demo/dates")}
        >
          Next: pick your times
        </button>
        <p className={s.small} aria-live="polite">
          {!budgetCents || !vibe ? "Pick a budget and a vibe to continue." : " "}
        </p>
      </div>
    </div>
  );
}
