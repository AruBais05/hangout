"use client";

import { useSyncExternalStore } from "react";
import type { SlotKey } from "./config";

// Guest-only demo state, kept in localStorage. No accounts, no money held.

export type PassPlan = "monthly" | "yearly";

export type DemoState = {
  pass: { plan: PassPlan; startedAt: string } | null; // Crew Pass
  unlocked: boolean; // this big plan was unlocked with the one-time $4.99
  budgetCents: number | null; // private
  vibe: "active" | "chill" | null;
  availability: SlotKey[];
  myVote: string | null;
  votingEnded: boolean;
  voteEndsAt: number | null; // epoch ms
  imIn: boolean;
  checkedIn: boolean;
  returnTo: string | null; // where to go after buying the Crew Pass
};

const KEY = "hangout-demo-v2";

export const INITIAL: DemoState = {
  pass: null,
  unlocked: false,
  budgetCents: null,
  vibe: null,
  availability: [],
  myVote: null,
  votingEnded: false,
  voteEndsAt: null,
  imIn: false,
  checkedIn: false,
  returnTo: null,
};

let state: DemoState | null = null;
const listeners = new Set<() => void>();

function load(): DemoState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL;
  } catch {
    state = INITIAL;
  }
  return state!;
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or blocked storage: the demo still works for this visit.
  }
}

export function update(patch: Partial<DemoState> | ((s: DemoState) => Partial<DemoState>)) {
  const current = load();
  const next = typeof patch === "function" ? patch(current) : patch;
  state = { ...current, ...next };
  save();
  listeners.forEach((l) => l());
}

/** Starts a new plan but keeps the Crew Pass. */
export function restartPlan() {
  const { pass } = load();
  update({ ...INITIAL, pass });
}

export function resetDemo() {
  update({ ...INITIAL });
}

export function setPass(on: boolean, plan: PassPlan = "yearly") {
  update(on ? { pass: { plan, startedAt: new Date().toISOString() } } : { pass: null });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns [state, ready]. `ready` is false during server render and hydration. */
export function useDemo(): [DemoState, boolean] {
  const s = useSyncExternalStore(subscribe, load, () => null);
  return s ? [s, true] : [INITIAL, false];
}

/** True when this plan's big-plan features are open (unlocked once, or Crew Pass). */
export function isOpen(s: DemoState): boolean {
  return s.unlocked || !!s.pass;
}
