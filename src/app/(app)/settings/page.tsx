"use client";

import Link from "next/link";
import { useState } from "react";
import MySpending from "@/components/MySpending";
import s from "@/components/demo/screen.module.css";
import { PRICES } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { cleanHandle } from "@/lib/split";
import { BUDGET_RANGES, TRAVEL_MINUTES, type BudgetRangeId, type TravelMinutes } from "@/lib/config";
import { cancelPass, currentAccount, forgetProfile, logOut, saveProfile } from "@/lib/auth";
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
  const account = currentAccount(state);
  const profile = state.profile;

  return (
    <div className={s.screen}>
      <h1 className={s.title}>Settings</h1>

      <section className={s.cardLine} aria-labelledby="account-title">
        <h2 id="account-title" className={s.label}>
          Account
        </h2>
        {account ? (
          <>
            <dl className={styles.rows}>
              <div>
                <dt>Name</dt>
                <dd>{account.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{account.google ? "Google (demo)" : account.email}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{account.crewPass ? "Crew Pass" : "Free"}</dd>
              </div>
            </dl>
            <button
              type="button"
              className={s.secondary}
              onClick={() => {
                logOut();
                setMsg("Logged out. Crew Pass features are off until you log in again.");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <p className={s.small}>
            <Link href="/login" className={s.textLink}>
              Log in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className={s.textLink}>
              create an account
            </Link>{" "}
            to keep Crew Pass and your info everywhere.
          </p>
        )}
        <p className={s.small}>Demo account, saved in this browser. Passwords are stored only as a hash.</p>
      </section>

      <section className={s.cardLine} aria-labelledby="saved-title">
        <h2 id="saved-title" className={s.label}>
          Your saved info
        </h2>
        {profile ? (
          <>
            <div className={styles.savedGrid}>
              <label>
                <span>First name</span>
                <input value={profile.name} maxLength={20} onChange={(e) => saveProfile({ ...profile, name: e.target.value })} />
              </label>
              <label>
                <span>Travel</span>
                <select value={profile.travel} onChange={(e) => saveProfile({ ...profile, travel: Number(e.target.value) as TravelMinutes })}>
                  {TRAVEL_MINUTES.map((m) => (
                    <option key={m} value={m}>
                      Up to {m} min
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Budget (private)</span>
                <select value={profile.budget ?? ""} onChange={(e) => saveProfile({ ...profile, budget: (e.target.value || null) as BudgetRangeId | null })}>
                  {BUDGET_RANGES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Venmo</span>
                <input value={profile.venmo} maxLength={30} placeholder="username" onChange={(e) => saveProfile({ ...profile, venmo: cleanHandle(e.target.value) })} />
              </label>
            </div>
            <p className={s.small}>
              {profile.area ? `Area: ${profile.area}. ` : ""}Used to join hangouts in one tap. Saved on this device only.
            </p>
            <button
              type="button"
              className={s.secondary}
              onClick={() => {
                forgetProfile();
                setMsg("Forgotten. Your info is no longer saved on this device.");
              }}
            >
              Forget me
            </button>
          </>
        ) : (
          <p className={s.small}>Nothing saved yet. Your answers are saved here after you join a hangout.</p>
        )}
      </section>

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
                      cancelPass();
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

      <details className={s.card}>
        <summary className={s.label}>For judges: demo switches</summary>
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
      </details>

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
