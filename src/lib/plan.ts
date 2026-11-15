import {
  BIG_PLAN,
  CREW,
  CREW_AVAILABILITY,
  CREW_VOTES,
  OPTIONS,
  PARTS,
  TRIP,
  WEEKENDS,
  type Option,
  type SlotKey,
  type WeekendId,
} from "./config";
import { formatPrice } from "./money";

export const GROUP_SIZE = CREW.length + 1;

export function weekendLabel(id: WeekendId): string {
  return WEEKENDS.find((w) => w.id === id)!.label;
}

/** People free for every part of a weekend (crew + you). */
export function fullWeekendCount(id: WeekendId, mine: SlotKey[]): number {
  const keys = PARTS.map((p) => `${id}|${p}` as SlotKey);
  const crew = CREW.filter((m) => keys.every((k) => CREW_AVAILABILITY[m.id].includes(k))).length;
  return crew + (keys.every((k) => mine.includes(k)) ? 1 : 0);
}

export function crewFreeCount(key: SlotKey): number {
  return CREW.filter((m) => CREW_AVAILABILITY[m.id].includes(key)).length;
}

export function bestWeekend(mine: SlotKey[]): { id: WeekendId; count: number } {
  return WEEKENDS.map((w) => ({ id: w.id as WeekendId, count: fullWeekendCount(w.id, mine) })).reduce(
    (a, b) => (b.count > a.count ? b : a),
  );
}

/** Why this plan counts as big (any rule is enough). */
export function bigPlanReasons(days: number, people: number, budgetCents: number): string[] {
  const r: string[] = [];
  if (days >= BIG_PLAN.minDays) r.push(`${days} days`);
  if (people >= BIG_PLAN.minPeople) r.push(`${people} people`);
  if (budgetCents > BIG_PLAN.budgetOverCents) r.push(`over ${formatPrice(BIG_PLAN.budgetOverCents)} a person`);
  return r;
}

/**
 * Private budget match: everyone's number stays hidden; only the range that
 * works for the whole group is shown. Top = the lowest budget, bottom = 75% of it.
 */
export function workableRange(myBudgetCents: number): { low: number; high: number } {
  const high = Math.min(myBudgetCents, ...CREW.map((m) => m.budgetCents));
  const low = Math.floor((high * 0.75) / 1000) * 1000;
  return { low, high };
}

export function perPerson(o: Option): number {
  return Math.round(o.totalCents / GROUP_SIZE);
}

export type RankedOption = Option & { reasons: string[]; eachCents: number };

export function rankOptions(mine: SlotKey[], myBudgetCents: number, vibe: "active" | "chill"): RankedOption[] {
  const { high } = workableRange(myBudgetCents);
  const best = bestWeekend(mine);
  const actives = CREW.filter((m) => m.vibe === "active").length + (vibe === "active" ? 1 : 0);
  const groupVibe = actives * 2 >= GROUP_SIZE ? "active" : "chill";

  const ranked = OPTIONS.map((o) => {
    const each = perPerson(o);
    const reasons: string[] = [];
    reasons.push(
      best.count === GROUP_SIZE
        ? `Everyone's free ${weekendLabel(best.id)}`
        : `${best.count} of ${GROUP_SIZE} free ${weekendLabel(best.id)}`,
    );
    if (each <= high) reasons.push("Inside the group's range");
    else reasons.push(`${formatPrice(each - high)} over the range`);
    if (o.partner) reasons.push("Partner stay");
    else if (o.vibe === groupVibe) reasons.push(`Matches the ${groupVibe} vibe`);
    const score = (each <= high ? 100 : 0) + (o.vibe === groupVibe ? 10 : 0) + (o.partner ? 5 : 0);
    return { ...o, reasons, eachCents: each, score };
  });
  ranked.sort((a, b) => b.score - a.score);
  // The demo's winner is the partner stay; keep it first.
  const p = ranked.findIndex((o) => o.partner);
  if (p > 0) ranked.unshift(ranked.splice(p, 1)[0]);
  return ranked.map((o) => {
    const { score, ...rest } = o;
    void score;
    return rest;
  });
}

export function tally(myVote: string | null): Record<string, number> {
  const t: Record<string, number> = Object.fromEntries(OPTIONS.map((o) => [o.id, 0]));
  for (const id of Object.values(CREW_VOTES)) t[id]++;
  if (myVote) t[myVote]++;
  return t;
}

/** The partner stay always wins the crew vote in the demo. */
export const BOOKED = OPTIONS.find((o) => o.partner)!;

const stamp = (local: string) => local.replace(/[-:]/g, "") + "00";

export function googleCalendarUrl(o: Option): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${o.title} with the crew`,
    dates: `${stamp(TRIP.start)}/${stamp(TRIP.end)}`,
    details: `Planned with Hangout. ${o.place}.`,
    location: `${o.place}, ${o.address}`,
    ctz: "America/New_York",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function icsFile(o: Option): string {
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hangout//Demo//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${o.id}-${stamp(TRIP.start)}@hangout.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART;TZID=America/New_York:${stamp(TRIP.start)}`,
    `DTEND;TZID=America/New_York:${stamp(TRIP.end)}`,
    `SUMMARY:${esc(`${o.title} with the crew`)}`,
    `LOCATION:${esc(`${o.place}, ${o.address}`)}`,
    "DESCRIPTION:Planned with Hangout.",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
