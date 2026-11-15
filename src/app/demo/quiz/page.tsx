"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { formatPrice } from "@/lib/money";
import { update, useDemo } from "@/lib/store";
import styles from "./quiz.module.css";

const BUDGETS = [10000, 20000, 30000, 40000];

export default function Quiz() {
  const router = useRouter();
  const [state] = useDemo();
  const { budgetCents, vibe } = state;

  return (
    <div className={s.screen}>
      <h1 className={s.title}>What are you up for?</h1>

      <fieldset className={styles.group}>
        <legend className={s.sectionLabel}>What you can spend on the weekend</legend>
        <p className={`${s.small} ${styles.private}`}>
          <Icon name="lock" size={16} />
          Only you see this. The group only sees a range that works for everyone.
        </p>
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
              <span className={styles.vibeHint}>Hikes, a lake, early starts</span>
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
              <span className={styles.vibeHint}>Long dinners, a fire, sleeping in</span>
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
