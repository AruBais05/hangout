"use client";

import type { BudgetRangeId, GroupQuiz, Personality } from "./config";
import type { SuggestResult } from "./suggest";
import { load, update, type CellState, type CloudMember, type Expense, type Meeting } from "./store";
import { ensureSession, sb } from "./supabase";

// Shared rooms in Supabase. Every function is a no-op (returns null/false) in browser-only mode.

export type CloudRoom = {
  id: string;
  code: string;
  host_id: string;
  meeting: Meeting;
  host_name: string;
  host_venmo: string;
  group_quiz: GroupQuiz | null;
  plans: { key: string; result: SuggestResult } | null;
  voting_ended: boolean;
  unlocked: boolean;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I
export function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Host: saves the new hangout as a shared room. Falls back to browser-only on any error. */
export async function createRoom(meeting: Meeting, quiz: GroupQuiz | null, hostName: string, venmo: string) {
  const c = sb();
  const uid = await ensureSession();
  if (!c || !uid) return null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newCode();
    const { data, error } = await c
      .from("rooms")
      .insert({ code, host_id: uid, meeting, group_quiz: quiz, host_name: hostName.slice(0, 20), host_venmo: venmo })
      .select("id, code")
      .single();
    if (!error && data) {
      update({ room: { id: data.id, code: data.code, host: true }, cloudMembers: [], roomBudget: null });
      return data as { id: string; code: string };
    }
    if (error && !error.message.includes("duplicate")) {
      console.warn("[cloud] couldn't create the room:", error.message);
      return null;
    }
  }
  return null;
}

/** Host: keeps the shared room in step with what the host does. */
export async function updateRoom(patch: Partial<Omit<CloudRoom, "id" | "code" | "host_id" | "unlocked">>) {
  const c = sb();
  const room = load().room;
  if (!c || !room?.host) return;
  const { error } = await c.from("rooms").update(patch).eq("id", room.id);
  if (error) console.warn("[cloud] room update failed:", error.message);
}

export async function roomByCode(code: string): Promise<CloudRoom | null> {
  const c = sb();
  if (!c || !/^[A-Z0-9]{6}$/i.test(code)) return null;
  if (!(await ensureSession())) return null;
  const { data, error } = await c.rpc("room_by_code", { p_code: code.toUpperCase() });
  if (error) return null;
  return ((data as CloudRoom[]) ?? [])[0] ?? null;
}

export type JoinData = {
  name: string;
  type: Personality;
  area: string;
  point: [number, number] | null;
  travel: number;
  venmo: string;
  cells: Record<string, CellState>;
  budget: BudgetRangeId | null;
};

/** Adds (or updates) you in a room. Your budget goes to a table only you can read. */
export async function joinRoom(roomId: string, d: JoinData, isHost = false): Promise<string | null> {
  const c = sb();
  const uid = await ensureSession();
  if (!c || !uid) return null;
  // Insert first, then read your row back: returning it in the same statement is blocked by the
  // "only people in the room can see members" rule (it checks membership as of the statement start).
  const { error } = await c.from("members").upsert(
    {
      room_id: roomId,
      user_id: uid,
      name: d.name.slice(0, 20) || "Friend",
      type: d.type,
      area: d.area.slice(0, 60),
      point: d.point,
      travel: [15, 30, 45].includes(d.travel) ? d.travel : 30,
      venmo: d.venmo,
      cells: d.cells,
      is_host: isHost,
    },
    { onConflict: "room_id,user_id" },
  );
  if (error) {
    console.warn("[cloud] join failed:", error.message);
    return null;
  }
  const { data } = await c.from("members").select("id").eq("room_id", roomId).eq("user_id", uid).maybeSingle();
  if (!data) return null;
  if (d.budget) {
    await c.from("member_budgets").upsert({ member_id: data.id, user_id: uid, room_id: roomId, budget: d.budget });
  }
  return data.id as string;
}

/** Your own row in a room, if you've joined it. */
export async function myMember(roomId: string): Promise<CloudMember | null> {
  const c = sb();
  const uid = await ensureSession();
  if (!c || !uid) return null;
  const { data } = await c.from("members").select("*").eq("room_id", roomId).eq("user_id", uid).maybeSingle();
  return (data as CloudMember) ?? null;
}

export async function setMine(roomId: string, patch: { vote?: string | null; paid?: boolean }) {
  const c = sb();
  const uid = await ensureSession();
  if (!c || !uid) return;
  await c.from("members").update(patch).eq("room_id", roomId).eq("user_id", uid);
}

/** Reads the room's people, expenses and group budget into the local store. */
export async function refreshRoom(roomId: string): Promise<CloudRoom | null> {
  const c = sb();
  if (!c) return null;
  const uid = (await c.auth.getSession()).data.session?.user.id;
  const [room, members, expenses, settled, budget] = await Promise.all([
    c.from("rooms").select("*").eq("id", roomId).maybeSingle(),
    c.from("members").select("*").eq("room_id", roomId).order("joined_at"),
    c.from("expenses").select("*").eq("room_id", roomId).order("created_at"),
    c.from("settled").select("key").eq("room_id", roomId),
    c.rpc("room_budget", { p_room: roomId }),
  ]);
  const others = ((members.data as CloudMember[]) ?? []).filter((m) => m.user_id !== uid);
  update({
    cloudMembers: others,
    roomBudget: (budget.data as BudgetRangeId | null) ?? null,
    ...(expenses.data
      ? {
          expenses: (expenses.data as { id: string; payer: string; what: string; amount_cents: number; handle: string }[]).map(
            (e): Expense => ({ id: e.id, payer: e.payer, what: e.what, amountCents: e.amount_cents, handle: e.handle }),
          ),
        }
      : {}),
    ...(settled.data ? { settled: (settled.data as { key: string }[]).map((x) => x.key) } : {}),
  });
  return (room.data as CloudRoom) ?? null;
}

/** Live updates: calls `onChange` (debounced) whenever the room, its people or expenses change.
 *  Also refreshes every 15 seconds as a backup, in case the live connection drops (phones). */
export function watchRoom(roomId: string, onChange: () => void): () => void {
  const c = sb();
  if (!c) return () => {};
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let ch: ReturnType<typeof c.channel> | null = null;
  const poke = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onChange, 250);
  };
  void (async () => {
    // The live connection must carry your session, or Row Level Security sends you nothing.
    const token = (await c.auth.getSession()).data.session?.access_token;
    if (token) await c.realtime.setAuth(token);
    if (stopped) return;
    ch = c.channel(`room-${roomId}`);
    for (const table of ["members", "expenses", "settled"]) {
      ch.on("postgres_changes", { event: "*", schema: "public", table, filter: `room_id=eq.${roomId}` }, poke);
    }
    ch.on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, poke);
    ch.subscribe();
  })();
  const backup = setInterval(onChange, 15000);
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    clearInterval(backup);
    if (ch) c.removeChannel(ch);
  };
}

export async function addExpense(roomId: string, e: Omit<Expense, "id">) {
  const c = sb();
  if (!c) return false;
  const { error } = await c
    .from("expenses")
    .insert({ room_id: roomId, payer: e.payer, what: e.what, amount_cents: e.amountCents, handle: e.handle });
  return !error;
}

export async function removeExpense(id: string) {
  const c = sb();
  if (!c) return;
  await c.from("expenses").delete().eq("id", id);
}

export async function setSettled(roomId: string, key: string, on: boolean) {
  const c = sb();
  if (!c) return;
  if (on) await c.from("settled").upsert({ room_id: roomId, key });
  else await c.from("settled").delete().eq("room_id", roomId).eq("key", key);
}
