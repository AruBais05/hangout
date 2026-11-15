"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { formatCents } from "@/lib/money";
import { addExpense, removeExpense, setSettled } from "@/lib/cloud";
import { everyone, myName } from "@/lib/plan";
import { cleanHandle, settleUp, venmoUrl } from "@/lib/split";
import { update, useDemo } from "@/lib/store";
import s from "./demo/screen.module.css";
import styles from "./CostSplit.module.css";

/** Crew Pass: shared expenses split evenly, then the fewest payments to settle up. */
export default function CostSplit({ title }: { title: string }) {
  const [state] = useDemo();
  const me = myName(state);
  const members = [me, ...everyone(state).map((c) => c.name)];
  const room = state.room;
  const [payer, setPayer] = useState(me);
  const [what, setWhat] = useState("");
  const [amount, setAmount] = useState("");
  const [handle, setHandle] = useState(state.venmoHandle);
  const [error, setError] = useState("");

  if (!state.pass) {
    return (
      <section className={styles.locked} aria-labelledby="split-title">
        <h2 id="split-title" className={s.label}>
          Cost split
        </h2>
        <p className={s.small}>Add shared costs like pizza or a cab, and see who owes whom.</p>
        <Link href="/plans" className={s.secondary} onClick={() => update({ returnTo: "/room/pay" })}>
          <Icon name="lock" size={18} />
          Split costs with Crew Pass
        </Link>
      </section>
    );
  }

  const debts = settleUp(members, state.expenses);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(amount.replace(/[$,\s]/g, "")) * 100);
    if (!what.trim()) return setError("Say what it was for, like pizza.");
    if (!Number.isFinite(cents) || cents <= 0 || cents > 1000000) return setError("Enter an amount between $0.01 and $10,000.");
    setError("");
    const h = cleanHandle(handle);
    if (room) {
      // Shared room: saved for everyone; the live update brings it back into the list.
      void addExpense(room.id, { payer, what: what.trim().slice(0, 40), amountCents: cents, handle: h });
      if (payer === me) update((st) => ({ spentThisMonth: st.spentThisMonth + cents }));
      setWhat("");
      setAmount("");
      return;
    }
    update((st) => ({
      expenses: [...st.expenses, { id: `${Date.now()}`, payer, what: what.trim().slice(0, 40), amountCents: cents, handle: h }],
      // What you paid counts toward your private spending.
      spentThisMonth: st.spentThisMonth + (payer === me ? cents : 0),
      settled: [],
    }));
    setWhat("");
    setAmount("");
  }

  function remove(id: string) {
    if (room) {
      void removeExpense(id);
      return;
    }
    update((st) => {
      const gone = st.expenses.find((x) => x.id === id);
      return {
        expenses: st.expenses.filter((x) => x.id !== id),
        spentThisMonth: Math.max(0, st.spentThisMonth - (gone && gone.payer === me ? gone.amountCents : 0)),
        settled: [],
      };
    });
  }

  function toggle(key: string) {
    if (room) void setSettled(room.id, key, !state.settled.includes(key));
    update((st) => ({ settled: st.settled.includes(key) ? st.settled.filter((k) => k !== key) : [...st.settled, key] }));
  }

  return (
    <section className={styles.split} aria-labelledby="split-title">
      <h2 id="split-title" className={s.label}>
        Cost split <span className={s.chipYellow}>Crew Pass</span>
      </h2>

      <form className={styles.form} onSubmit={add}>
        <label className={styles.field}>
          <span>Who paid</span>
          <select value={payer} onChange={(e) => setPayer(e.target.value)}>
            {members.map((n) => (
              <option key={n} value={n}>
                {n === me ? `${n} (you)` : n}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>For what</span>
          <input value={what} maxLength={40} placeholder="Pizza" onChange={(e) => setWhat(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Amount</span>
          <input value={amount} inputMode="decimal" placeholder="48.00" onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Their Venmo (optional)</span>
          <input value={handle} maxLength={31} placeholder="@username" autoComplete="off" onChange={(e) => setHandle(e.target.value)} />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={s.secondary}>
          Add expense
        </button>
      </form>

      {state.expenses.length > 0 && (
        <ul className={styles.list} aria-label="Expenses">
          {state.expenses.map((x) => (
            <li key={x.id}>
              <span className={s.grow}>
                <strong>{x.payer}</strong> paid {formatCents(x.amountCents)} for {x.what}
              </span>
              <button type="button" className={s.textLink} onClick={() => remove(x.id)}>
                Remove<span className="visually-hidden"> {x.what}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {debts.length > 0 ? (
        <ul className={styles.debts} aria-label="Who owes whom">
          {debts.map((d) => {
            const done = state.settled.includes(d.key);
            return (
              <li key={d.key} className={done ? styles.done : ""}>
                <span className={s.grow}>
                  {d.from} owes {d.to} <strong className={s.money}>{formatCents(d.cents)}</strong>
                </span>
                <span className={styles.actions}>
                  {d.handle && !done && (
                    <a className={styles.small} href={venmoUrl(d.handle, d.cents, title)} target="_blank" rel="noopener noreferrer">
                      Pay on Venmo<span className="visually-hidden"> to {d.to} (opens in a new tab)</span>
                    </a>
                  )}
                  <button type="button" className={styles.small} onClick={() => toggle(d.key)} aria-pressed={done}>
                    {done ? "Paid" : "Mark as paid"}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={s.small}>
          {state.expenses.length ? "Everyone's even." : `Split evenly among all ${members.length} of you.`}
        </p>
      )}
    </section>
  );
}
