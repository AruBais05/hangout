"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { googleSignIn, logIn, realGoogle, signUp } from "@/lib/auth";
import { cloudOn } from "@/lib/supabase";
import { useDemo } from "@/lib/store";
import s from "./demo/screen.module.css";
import styles from "./AuthForm.module.css";

/** Sign-up (before Crew Pass checkout) and log-in. Demo accounts live in this browser only. */
export default function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const [state] = useDemo();
  const [name, setName] = useState(state.profile?.name ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";
  const after = signup ? "/pass" : state.meeting ? "/room" : "/start";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = signup ? await signUp(name, email, password) : await logIn(email, password);
    setBusy(false);
    if (err) return setError(err);
    router.push(after);
  }

  async function google() {
    await googleSignIn(name, after);
    if (!realGoogle) router.push(after);
  }

  return (
    <form className={s.screen} onSubmit={submit} noValidate>
      <div>
        <h1 className={s.title}>{signup ? "Create your account" : "Log in"}</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          {signup
            ? "Crew Pass lives in your account, so your groups, history and spending stay with you."
            : "Log in to get your Crew Pass features back."}
        </p>
      </div>

      {(!cloudOn || realGoogle) && (
        <>
          <button type="button" className={s.secondary} onClick={google}>
            <span className={styles.g} aria-hidden="true">
              G
            </span>
            {realGoogle ? "Continue with Google" : "Continue with Google (demo)"}
          </button>
          <p className={styles.or}>or</p>
        </>
      )}

      <div className={styles.fields}>
        {signup && (
          <label className={styles.field}>
            <span>First name</span>
            <input value={name} maxLength={20} autoComplete="given-name" onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className={styles.field}>
          <span>Email</span>
          <input type="email" value={email} autoComplete="email" inputMode="email" onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            autoComplete={signup ? "new-password" : "current-password"}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={s.actions}>
        <button type="submit" className={s.primary} disabled={busy}>
          {signup ? "Create account and continue" : "Log in"}
        </button>
        <p className={s.small}>
          {signup ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className={s.textLink}>
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href="/signup" className={s.textLink}>
                Create an account
              </Link>
            </>
          )}
        </p>
        <p className={s.small}>
          {cloudOn
            ? "Your account works on any device. Passwords are handled by Supabase and never stored by Hangout."
            : "Demo account, saved in this browser. Your password is stored only as a hash."}
        </p>
      </div>
    </form>
  );
}
