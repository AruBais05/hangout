"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { SPENDING_HISTORY } from "@/lib/config";
import { formatCents } from "@/lib/money";
import { thisMonth } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import s from "./demo/screen.module.css";
import styles from "./MySpending.module.css";

const monthName = (ym: string) =>
  new Date(`${ym}-15T12:00:00`).toLocaleDateString("en-US", { month: "short" });

/** Private to you: what you spent on hangouts per month. Past months are demo data. */
export default function MySpending() {
  const [state, ready] = useDemo();
  const [hover, setHover] = useState<number | null>(null);
  const month = ready ? thisMonth() : "";
  const rows = [
    ...SPENDING_HISTORY.filter((r) => r.month !== month),
    ...(month ? [{ month, cents: state.spentThisMonth, hangouts: state.spentThisMonth > 0 ? 1 : 0 }] : []),
  ];
  const year = month.slice(0, 4) || "2026";
  const yearRows = rows.filter((r) => r.month.startsWith(year));
  const total = yearRows.reduce((a, r) => a + r.cents, 0);
  const hangouts = yearRows.reduce((a, r) => a + r.hangouts, 0);
  const max = Math.max(...rows.map((r) => r.cents), 1);
  const locked = !state.pass;

  return (
    <section id="spending" className={s.cardLine} aria-labelledby="spend-title">
      <h2 id="spend-title" className={s.label}>
        My spending <span className={styles.private}>Only you see this</span>
      </h2>

      <div className={locked ? styles.blur : undefined} aria-hidden={locked}>
        <div className={styles.stats}>
          <div>
            <span className={styles.statLabel}>Total in {year}</span>
            <span className={`${styles.statValue} ${s.money}`}>{formatCents(total)}</span>
          </div>
          <div>
            <span className={styles.statLabel}>Average per hangout</span>
            <span className={`${styles.statValue} ${s.money}`}>{formatCents(hangouts ? Math.round(total / hangouts) : 0)}</span>
          </div>
        </div>

        <div className={styles.chart} role="img" aria-label={`Spending per month: ${rows.map((r) => `${monthName(r.month)} ${formatCents(r.cents)}`).join(", ")}`}>
          {rows.map((r, i) => (
            <div
              key={r.month}
              className={styles.col}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={locked ? -1 : 0}
            >
              {hover === i && (
                <span className={styles.tip} role="tooltip">
                  {monthName(r.month)}: {formatCents(r.cents)}
                  {r.hangouts ? `, ${r.hangouts} hangout${r.hangouts > 1 ? "s" : ""}` : ""}
                </span>
              )}
              <span className={styles.barWrap}>
                <span className={styles.bar} style={{ height: `${Math.max(2, (r.cents / max) * 100)}%` }} />
              </span>
              <span className={styles.month}>{monthName(r.month)}</span>
            </div>
          ))}
        </div>

        <table className="visually-hidden">
          <caption>My spending per month</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Spent</th>
              <th scope="col">Hangouts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month}>
                <td>{monthName(r.month)}</td>
                <td>{formatCents(r.cents)}</td>
                <td>{r.hangouts}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={s.small}>Your paid shares and expenses. Earlier months are demo data.</p>
      </div>

      {locked && (
        <Link href="/plans" className={s.secondary} onClick={() => update({ returnTo: "/settings" })}>
          <Icon name="lock" size={18} />
          See my spending with Crew Pass
        </Link>
      )}
    </section>
  );
}
