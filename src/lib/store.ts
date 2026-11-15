"use client";

import { useSyncExternalStore } from "react";
import type { PurposeId } from "./config";

// Guest-only demo state, kept in localStorage. No accounts, no money held.

export type PassPlan = "monthly" | "yearly";
export type CellState = "free" | "busy";

export type Meeting = {
  purpose: PurposeId;
  from: string; // YYYY-MM-DD
  to: string;
  people: number;
  name: string;
};

export type DemoState = {
  meeting: Meeting | null;
  crewJoined: number; // demo friends who joined the waiting room
  cells: Record<string, CellState>; // "YYYY-MM-DD|Slot" → state
  calCells: string[]; // cells filled by the demo calendar (cleared on disconnect)
  calConnected: boolean;
  quiz: Record<string, string[]>; // question id → chosen labels
  budgetCents: number | null; // private
  joined: boolean; // you finished times + quiz
  pass: { plan: PassPlan; startedAt: string } | null;
  unlocked: boolean;
  myVote: string | null;
  votingEnded: boolean;
  voteEndsAt: number | null;
  imIn: boolean;
  checkedIn: boolean;
  returnTo: string | null;
};

const KEY = "hangout-demo-v3";

export const INITIAL: DemoState = {
  meeting: null,
  crewJoined: 0,
  cells: {},
  calCells: [],
  calConnected: false,
  quiz: {},
  budgetCents: null,
  joined: false,
  pass: null,
  unlocked: false,
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

/** Starts a new meeting but keeps the Crew Pass. */
export function newMeeting(meeting: Meeting) {
  const { pass } = load();
  update({ ...INITIAL, pass, meeting });
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
