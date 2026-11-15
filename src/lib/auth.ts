"use client";

import { sha256Hex } from "./sha256";
import { load, update, type Account, type DemoState, type Profile } from "./store";
import { accessToken, cloudOn, googleOn, sb } from "./supabase";

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
  if (s.cloudUser) {
    const u = s.cloudUser;
    return { id: u.id, name: u.name || "You", email: u.email, salt: "", hash: "", google: false, crewPass: u.crewPass, profile: s.profile, createdAt: "" };
  }
  return s.accounts.find((a) => a.id === s.session) ?? null;
}

/* ---------- Supabase mode ---------- */

type ProfileRow = { id: string; name: string; venmo: string; saved: Profile | null; crew_pass: boolean };

/** Loads your account's profile into the app (Crew Pass, saved answers, Venmo). */
export async function loadCloudProfile(): Promise<void> {
  const c = sb();
  if (!c) return;
  const { data: sess } = await c.auth.getSession();
  const user = sess.session?.user;
  if (!user || user.is_anonymous) {
    update({ cloudUser: null });
    return;
  }
  let { data } = await c.from("profiles").select("id, name, venmo, saved, crew_pass").eq("id", user.id).maybeSingle();
  if (!data) {
    const st = load();
    const name = String(user.user_metadata?.name ?? user.user_metadata?.full_name ?? st.profile?.name ?? "").slice(0, 20);
    await c.from("profiles").insert({ id: user.id, name, venmo: st.profile?.venmo ?? "", saved: st.profile });
    data = { id: user.id, name, venmo: st.profile?.venmo ?? "", saved: st.profile, crew_pass: false };
  }
  const row = data as ProfileRow;
  update((st) => ({
    cloudUser: { id: user.id, email: user.email ?? "", name: row.name, crewPass: row.crew_pass },
    pass: row.crew_pass ? (st.pass ?? { plan: "yearly", startedAt: new Date().toISOString() }) : st.pass,
    profile: row.saved ?? st.profile,
    venmoHandle: row.venmo || st.venmoHandle,
  }));
}

/** Rooms you hosted as a guest move to your new account (server checks both sessions). */
async function moveGuestRooms(oldToken: string | null) {
  const now = await accessToken();
  if (!oldToken || !now || oldToken === now) return;
  await fetch("/api/account/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${now}` },
    body: JSON.stringify({ oldToken }),
  }).catch(() => {});
}

async function guestToken(): Promise<string | null> {
  const c = sb();
  const s = c ? (await c.auth.getSession()).data.session : null;
  return s?.user.is_anonymous ? s.access_token : null;
}

/** Supabase errors in plain words. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("registered") || m.includes("already")) return "That email already has an account. Log in instead.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many sign-ups in a short time. Try again in a few minutes.";
  if (m.includes("invalid") && m.includes("email")) return "Use a real email address you can open.";
  if (m.includes("password")) return "Use a stronger password: at least 8 characters.";
  return "Couldn't create the account right now. Try again in a moment.";
}

async function cloudSignUp(name: string, email: string, password: string): Promise<string | null> {
  const c = sb()!;
  const old = await guestToken();
  const { data, error } = await c.auth.signUp({ email: normEmail(email), password, options: { data: { name: name.trim().slice(0, 20) } } });
  if (error) return friendlyAuthError(error.message);
  if (!data.session) return "Check your email to confirm your account, then log in.";
  await moveGuestRooms(old);
  await loadCloudProfile();
  return null;
}

async function cloudLogIn(email: string, password: string): Promise<string | null> {
  const c = sb()!;
  const old = await guestToken();
  const { error } = await c.auth.signInWithPassword({ email: normEmail(email), password });
  if (error) return "Email or password is wrong.";
  await moveGuestRooms(old);
  await loadCloudProfile();
  return null;
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
  if (cloudOn) return cloudSignUp(name, email, password);
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

/** True when "Continue with Google" is real (Supabase + Google provider configured). */
export const realGoogle = cloudOn && googleOn;

/** "Continue with Google": real Google sign-in when configured, otherwise demo only. */
export async function googleSignIn(name: string, next: string): Promise<void> {
  if (realGoogle) {
    await sb()!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}${next}` } });
    return;
  }
  googleDemo(name);
}

/** Browser-only demo: no Google sign-in happens. */
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
  if (cloudOn) return cloudLogIn(email, password);
  const a = load().accounts.find((x) => x.email === normEmail(email) && !x.google);
  // Same message either way, so the form doesn't reveal which emails exist.
  if (!a || (await hashPassword(password, a.salt)) !== a.hash) return "Email or password is wrong.";
  startSession(a);
  return null;
}

export function logOut() {
  if (cloudOn) void sb()?.auth.signOut();
  update({ session: null, pass: null, cloudUser: null });
}

/** After paying for Crew Pass: mark the account and copy the local profile into it.
 *  In Supabase mode the server already saved Crew Pass (after Stripe confirmed); we reload it. */
export function activatePass() {
  if (cloudOn) void loadCloudProfile();
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
  const st0 = load();
  if (st0.cloudUser) void sb()?.from("profiles").update({ saved: p, venmo: p.venmo, name: p.name || st0.cloudUser.name }).eq("id", st0.cloudUser.id);
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
  if (cloudOn && load().cloudUser) {
    void accessToken().then((tok) =>
      fetch("/api/account/pass", { method: "POST", headers: { Authorization: `Bearer ${tok}` }, body: "{}" }).then(() => loadCloudProfile()),
    );
  }
  update((st) => ({
    pass: null,
    accounts: st.accounts.map((a) => (a.id === st.session ? { ...a, crewPass: false } : a)),
  }));
}
