"use client";

import { sha256Hex } from "./sha256";
import { load, update, type Account, type DemoState, type Profile } from "./store";

// Demo accounts, saved in this browser only. No backend.
// Passwords are never stored: only a salted SHA-256 hash (crypto.subtle). A real app would use a
// slow password hash (bcrypt/argon2) on a server; this is a browser-only demo.

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Salted SHA-256. Uses crypto.subtle where the browser offers it (https, localhost) and the
 *  built-in fallback elsewhere (e.g. http://<wifi-ip> on a phone). Both give the same hash. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const bytes = enc.encode(`${salt}:${password}`);
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return hex(await crypto.subtle.digest("SHA-256", bytes));
  }
  return sha256Hex(bytes);
}

function newSalt(): string {
  return hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

export const normEmail = (e: string) => e.trim().toLowerCase();
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normEmail(e));

export function currentAccount(s: DemoState): Account | null {
  return s.accounts.find((a) => a.id === s.session) ?? null;
}

/** Logs in: Crew Pass accounts get Pass features; others are free. */
function startSession(a: Account) {
  update({ session: a.id, pass: a.crewPass ? { plan: "yearly", startedAt: a.createdAt } : null });
}

export async function signUp(name: string, email: string, password: string): Promise<string | null> {
  const e = normEmail(email);
  if (!name.trim()) return "Add your first name.";
  if (!validEmail(e)) return "Enter a valid email.";
  if (password.length < 8) return "Use at least 8 characters for the password.";
  if (load().accounts.some((a) => a.email === e)) return "That email already has an account. Log in instead.";
  const salt = newSalt();
  const account: Account = {
    id: `acc-${Date.now().toString(36)}`,
    name: name.trim().slice(0, 20),
    email: e,
    salt,
    hash: await hashPassword(password, salt),
    google: false,
    crewPass: false,
    profile: load().profile,
    createdAt: new Date().toISOString(),
  };
  update((st) => ({ accounts: [...st.accounts, account] }));
  startSession(account);
  return null;
}

/** "Continue with Google": demo only, no Google sign-in happens. */
export function googleDemo(name: string): void {
  const st = load();
  const existing = st.accounts.find((a) => a.google);
  if (existing) return startSession(existing);
  const account: Account = {
    id: `acc-${Date.now().toString(36)}`,
    name: (name.trim() || st.profile?.name || "Friend").slice(0, 20),
    email: "google-demo@example.com",
    salt: "",
    hash: "",
    google: true,
    crewPass: false,
    profile: st.profile,
    createdAt: new Date().toISOString(),
  };
  update((s) => ({ accounts: [...s.accounts, account] }));
  startSession(account);
}

export async function logIn(email: string, password: string): Promise<string | null> {
  const a = load().accounts.find((x) => x.email === normEmail(email) && !x.google);
  // Same message either way, so the form doesn't reveal which emails exist.
  if (!a || (await hashPassword(password, a.salt)) !== a.hash) return "Email or password is wrong.";
  startSession(a);
  return null;
}

export function logOut() {
  update({ session: null, pass: null });
}

/** After paying for Crew Pass: mark the account and copy the local profile into it. */
export function activatePass() {
  update((st) => {
    const startedAt = new Date().toISOString();
    if (!st.session) return { pass: { plan: "yearly", startedAt } };
    return {
      pass: { plan: "yearly", startedAt },
      accounts: st.accounts.map((a) =>
        a.id === st.session ? { ...a, crewPass: true, profile: st.profile ?? a.profile } : a,
      ),
    };
  });
}

/** Saves what a friend typed in a join flow, so next time they can join in one tap. */
export function saveProfile(p: Profile) {
  update((st) => ({
    profile: p,
    venmoHandle: p.venmo || st.venmoHandle,
    accounts: st.accounts.map((a) => (a.id === st.session ? { ...a, profile: p } : a)),
  }));
}

export function forgetProfile() {
  update({ profile: null });
}

/** Cancel Crew Pass: the account goes back to free features. */
export function cancelPass() {
  update((st) => ({
    pass: null,
    accounts: st.accounts.map((a) => (a.id === st.session ? { ...a, crewPass: false } : a)),
  }));
}
