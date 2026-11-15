"use client";

import { useSyncExternalStore } from "react";
import type { BudgetRangeId, GroupQuiz, Personality, PurposeId, SizeId, TravelMinutes, Vibe } from "./config";
import type { SuggestResult } from "./suggest";

// Guest-only demo state, kept in localStorage. No accounts, no money held.

export type PassPlan = "yearly";
export type CellState = "free" | "busy";

export type Meeting = {
  purpose: PurposeId;
  from: string; // YYYY-MM-DD
  to: string;
  people: number; // demo seats (from the expected size)
  expectedSize?: SizeId; // "Roughly how many people?" hint
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
  type?: Personality; // from a saved profile, when the quiz was skipped ("Join as Dana")
};

/** What a returning friend doesn't have to type again. Saved on this device only. */
export type Profile = {
  name: string;
  point: [number, number] | null; // rounded to about 1 km
  area: string;
  travel: TravelMinutes;
  budget: BudgetRangeId | null;
  dealBreakers: string[];
  type: Personality;
  venmo: string;
};

/** Demo account, saved in this browser. The password is only ever stored as a salted SHA-256 hash. */
export type Account = {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string; // "" for "Continue with Google" (demo)
  google: boolean;
  crewPass: boolean;
  profile: Profile | null;
  createdAt: string;
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
  paid: boolean; // you tapped "I paid" for your share
  venmoHandle: string; // the host's Venmo username, for settle-up links
  expenses: Expense[]; // Crew Pass cost split
  settled: string[]; // "from>to" debts marked as paid
  spentThisMonth: number; // cents you paid this month (shares + expenses), for My spending
  profile: Profile | null; // remembered free-user profile, this device only
  accounts: Account[];
  session: string | null; // logged-in account id (browser-only mode)
  // Supabase mode (only when configured):
  cloudUser: CloudUser | null; // signed-in account; null for guests and in browser-only mode
  room: { id: string; code: string; host: boolean } | null; // the shared room in the database
  cloudMembers: CloudMember[]; // real people in the room (live)
  roomBudget: BudgetRangeId | null; // the group's lowest budget range, never who chose it
  crewAreas: Record<string, string>; // "city|memberId" → neighborhood name
};

export type CloudUser = { id: string; email: string; name: string; crewPass: boolean };

/** A real person in a shared room (from the database). Budgets are never included. */
export type CloudMember = {
  id: string;
  user_id: string;
  name: string;
  type: Personality;
  area: string;
  point: [number, number] | null;
  travel: number;
  venmo: string;
  cells: Record<string, CellState>;
  vote: string | null;
  paid: boolean;
  is_host: boolean;
};

export type Expense = { id: string; payer: string; what: string; amountCents: number; handle: string };

export const EMPTY_ME: Me = { name: "", point: null, area: "", travel: 30, budget: null, dealBreakers: [] };

const KEY = "hangout-demo-v5";

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
  paid: false,
  venmoHandle: "",
  expenses: [],
  settled: [],
  spentThisMonth: 0,
  profile: null,
  accounts: [],
  session: null,
  cloudUser: null,
  room: null,
  cloudMembers: [],
  roomBudget: null,
  crewAreas: {},
};

let state: DemoState | null = null;
const listeners = new Set<() => void>();

// Older saved demo data lives under these keys. We convert it instead of starting fresh.
const OLD_KEYS = ["hangout-demo-v4", "hangout-demo-v3"];

const sizeFor = (people: number) => (people <= 4 ? "2-4" : people <= 9 ? "5-9" : people <= 20 ? "10-20" : "20-50");

/** Brings saved data from any earlier version up to today's shape. New fields get defaults. */
function migrate(raw: Record<string, unknown>): DemoState {
  const s = { ...INITIAL, ...raw } as DemoState & Record<string, unknown>;
  // v4: "paid" was { feeCents, totalCents }; now "I paid" is true/false. Booking fees are gone.
  if (s.paid && typeof s.paid === "object") s.paid = true;
  delete s.passBookings;
  // v3: personality answers and budget lived elsewhere.
  delete s.quiz;
  delete s.budgetCents;
  // Crew Pass is yearly only now.
  if (s.pass) s.pass = { plan: "yearly", startedAt: s.pass.startedAt ?? new Date().toISOString() };
  s.me = { ...EMPTY_ME, ...(s.me ?? {}) };
  if (s.meeting) {
    const m = s.meeting as Partial<Meeting>;
    s.meeting = {
      ...m,
      vibe: m.vibe ?? "active",
      city: m.city ?? "Austin, TX",
      center: m.center ?? [30.2672, -97.7431],
      expectedSize: m.expectedSize ?? sizeFor(m.people ?? 5),
    } as Meeting;
  }
  for (const k of ["expenses", "settled", "accounts", "cloudMembers"] as const) if (!Array.isArray(s[k])) (s as Record<string, unknown>)[k] = [];
  return s;
}

export function load(): DemoState {
  if (state) return state;
  try {
    let raw = window.localStorage.getItem(KEY);
    let from: string | null = null;
    if (!raw) {
      from = OLD_KEYS.find((k) => window.localStorage.getItem(k)) ?? null;
      raw = from ? window.localStorage.getItem(from) : null;
    }
    state = raw ? migrate(JSON.parse(raw)) : INITIAL;
    if (from) {
      // Moved to the current key; the old copy is no longer needed.
      window.localStorage.setItem(KEY, JSON.stringify(state));
      window.localStorage.removeItem(from);
    }
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

/** Starts a new meeting but keeps the Crew Pass, your Venmo, your spending and known neighborhoods. */
export function newMeeting(meeting: Meeting, groupQuiz: GroupQuiz, venmoHandle?: string) {
  const { pass, crewAreas, spentThisMonth, venmoHandle: prev, profile, accounts, session, cloudUser } = load();
  update({
    ...INITIAL,
    cloudUser,
    pass,
    crewAreas,
    spentThisMonth,
    profile,
    accounts,
    session,
    venmoHandle: venmoHandle ?? prev,
    meeting,
    groupQuiz,
  });
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
