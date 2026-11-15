"use client";

import { useSyncExternalStore } from "react";
import type { BudgetRangeId, GroupQuiz, PurposeId, TravelMinutes, Vibe } from "./config";
import type { SuggestResult } from "./suggest";

// Guest-only demo state, kept in localStorage. No accounts, no money held.

export type PassPlan = "monthly" | "yearly";
export type CellState = "free" | "busy";

export type Meeting = {
  purpose: PurposeId;
  from: string; // YYYY-MM-DD
  to: string;
  people: number;
  name: string;
  vibe: Vibe;
  city: string; // "Austin, TX"
  center: [number, number]; // map center for the city; the demo crew sits around it
};

/** Your fixed answers. The point is rounded to about 1 km; others only see `area`. */
export type Me = {
  name: string;
  point: [number, number] | null;
  area: string;
  travel: TravelMinutes;
  budget: BudgetRangeId | null; // private
  dealBreakers: string[];
};

export type DemoState = {
  meeting: Meeting | null;
  crewJoined: number; // demo friends who joined the waiting room
  cells: Record<string, CellState>; // "YYYY-MM-DD|Slot" → state
  calCells: string[]; // cells filled by the demo calendar (cleared on disconnect)
  calConnected: boolean;
  groupQuiz: GroupQuiz | null; // the same questions for everyone in the group
  answers: Record<number, number>; // question index → answer index
  me: Me;
  joined: boolean; // you finished times + quiz
  pass: { plan: PassPlan; startedAt: string } | null;
  unlocked: boolean;
  myVote: string | null;
  votingEnded: boolean;
  voteEndsAt: number | null;
  imIn: boolean;
  checkedIn: boolean;
  returnTo: string | null;
  suggest: { key: string; result: SuggestResult } | null; // the plans on the voting screen
  paid: { feeCents: number; totalCents: number } | null; // what you paid for your share
  passBookings: { month: string; used: number }; // fee-free bookings used this month
  crewAreas: Record<string, string>; // "city|memberId" → neighborhood name
};

export const EMPTY_ME: Me = { name: "", point: null, area: "", travel: 30, budget: null, dealBreakers: [] };

const KEY = "hangout-demo-v4";

export const INITIAL: DemoState = {
  meeting: null,
  crewJoined: 0,
  cells: {},
  calCells: [],
  calConnected: false,
  groupQuiz: null,
  answers: {},
  me: EMPTY_ME,
  joined: false,
  pass: null,
  unlocked: false,
  myVote: null,
  votingEnded: false,
  voteEndsAt: null,
  imIn: false,
  checkedIn: false,
  returnTo: null,
  suggest: null,
  paid: null,
  passBookings: { month: "", used: 0 },
  crewAreas: {},
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

/** Starts a new meeting but keeps the Crew Pass, its monthly count and known neighborhoods. */
export function newMeeting(meeting: Meeting, groupQuiz: GroupQuiz) {
  const { pass, passBookings, crewAreas } = load();
  update({ ...INITIAL, pass, passBookings, crewAreas, meeting, groupQuiz });
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
