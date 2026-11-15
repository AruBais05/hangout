"use client";

import { useSyncExternalStore } from "react";
import type { SlotKey } from "./config";

// Guest-only demo state, kept in localStorage. No accounts.

export type PassPlan = "monthly" | "yearly";

export type DemoState = {
  pass: { plan: PassPlan; startedAt: string } | null;
  feeFreeUsed: number; // fee-free bookings used this month (Pass holders)
  budgetCents: number | null;
  vibe: "active" | "chill" | null;
  availability: SlotKey[];
  myVote: string | null;
  votingEnded: boolean;
  voteEndsAt: number | null; // epoch ms
  paid: { totalCents: number; feeCents: number; at: string } | null;
  checkedIn: boolean;
};

const KEY = "hangout-demo-v1";

export const INITIAL: DemoState = {
  pass: null,
  feeFreeUsed: 0,
  budgetCents: null,
  vibe: null,
  availability: [],
  myVote: null,
  votingEnded: false,
  voteEndsAt: null,
  paid: null,
  checkedIn: false,
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

/** Starts the hangout over but keeps the Pass (used by "Plan another"). */
export function restartHangout() {
  update({
    budgetCents: null,
    vibe: null,
    availability: [],
    myVote: null,
    votingEnded: false,
    voteEndsAt: null,
    paid: null,
    checkedIn: false,
  });
}

export function resetDemo() {
  update({ ...INITIAL });
}

export function setPass(on: boolean, plan: PassPlan = "monthly") {
  update(on ? { pass: { plan, startedAt: new Date().toISOString() }, feeFreeUsed: 0 } : { pass: null });
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
