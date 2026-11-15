"use client";

import Link from "next/link";
import { useState } from "react";
import MySpending from "@/components/MySpending";
import s from "@/components/demo/screen.module.css";
import { PRICES } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { cleanHandle } from "@/lib/split";
import { resetDemo, setPass, update, useDemo } from "@/lib/store";
import styles from "./settings.module.css";

function nextCharge(startedAt: string): string {
  const d = new Date(startedAt);
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function Settings() {
  const [state] = useDemo();
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState("");
  const pass = state.pass;

  return (
    <div className={s.screen}>
      <h1 className={s.title}>Settings</h1>

      <section className={s.cardLine} aria-labelledby="pass-title">
        <h2 id="pass-title" className={s.label}>
          Manage Crew Pass
        </h2>
        {pass ? (
          <>
            <dl className={styles.rows}>
              <div>
                <dt>Plan</dt>
                <dd>Yearly</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd className={s.money}>{formatPrice(PRICES.passYearlyCents)} a year</dd>
              </div>
              <div>
                <dt>Next charge</dt>
                <dd>{nextCharge(pass.startedAt)}</dd>
              </div>
            </dl>
            {confirming ? (
              <div className={styles.confirm} role="group" aria-label="Confirm cancel">
                <p>Cancel Crew Pass? Big plans will need the one-time unlock again.</p>
                <div className={styles.confirmButtons}>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => {
                      setPass(false);
                      setConfirming(false);
                      setMsg("Crew Pass cancelled.");
                    }}
                  >
                    Yes, cancel
                  </button>
                  <button type="button" className={s.textLink} onClick={() => setConfirming(false)}>
                    Keep Crew Pass
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className={s.secondary} onClick={() => setConfirming(true)}>
                Cancel Crew Pass
              </button>
            )}
          </>
        ) : (
          <>
            <p className={s.small}>You don&rsquo;t have Crew Pass. Everyday hangouts stay free.</p>
            <Link href="/plans" className={s.textLink}>
              See plans
            </Link>
          </>
        )}
      </section>

      <section className={s.cardLine} aria-labelledby="venmo-title">
        <h2 id="venmo-title" className={s.label}>
          Your Venmo
        </h2>
        <label className={styles.venmo}>
          <span className="visually-hidden">Venmo username</span>
          <span aria-hidden="true">@</span>
          <input
            value={state.venmoHandle}
            maxLength={30}
            placeholder="username"
            autoComplete="off"
            onChange={(e) => update({ venmoHandle: cleanHandle(e.target.value) })}
          />
        </label>
        <p className={s.small}>Friends get a button to pay you back on Venmo. Optional.</p>
      </section>

      <MySpending />

      <section className={s.card} aria-labelledby="demo-title">
        <h2 id="demo-title" className={s.label}>
          Demo controls
        </h2>
        <div className={styles.toggleRow}>
          <span id="pass-label">Crew Pass</span>
          <div className={styles.segment} role="radiogroup" aria-labelledby="pass-label">
            <button
              type="button"
              role="radio"
              aria-checked={!pass}
              onClick={() => {
                setPass(false);
                setMsg("Switched to no pass.");
              }}
            >
              No pass
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!!pass}
              onClick={() => {
                if (!pass) setPass(true);
                setMsg("Switched to has pass.");
              }}
            >
              Has pass
            </button>
          </div>
        </div>
        <button
          type="button"
          className={s.secondary}
          style={{ marginTop: 16 }}
          onClick={() => {
            resetDemo();
            setConfirming(false);
            setMsg("Demo reset. Everything is back to the start.");
          }}
        >
          Reset demo
        </button>
      </section>

      <p className={s.status} aria-live="polite">
        {msg}
      </p>

      <div className={s.actions}>
        <Link href={state.meeting ? "/room" : "/start"} className={s.primary}>
          {state.meeting ? "Back to the waiting room" : "Start a hangout"}
        </Link>
      </div>
    </div>
  );
}
