import {
  CREW,
  CREW_AVAILABILITY,
  CREW_VOTES,
  DAY_DATES,
  LIMITS,
  OPTIONS,
  PRICES,
  SLOT_TIMES,
  type Day,
  type Option,
  type Slot,
  type SlotKey,
} from "./config";

const DAY_NAMES: Record<Day, string> = {
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export function splitSlot(key: SlotKey): { day: Day; slot: Slot } {
  const [day, slot] = key.split("-") as [Day, Slot];
  return { day, slot };
}

export function slotLabel(key: SlotKey): string {
  const { day, slot } = splitSlot(key);
  return `${day} ${SLOT_TIMES[slot].label}`;
}

export function longDate(key: SlotKey): string {
  const { day, slot } = splitSlot(key);
  const d = new Date(`${DAY_DATES[day]}T12:00:00`);
  const md = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${day} ${md}, ${SLOT_TIMES[slot].label}`;
}

/** How many of the five people (crew + you) are free in a slot. */
export function freeCount(key: SlotKey, mine: SlotKey[]): number {
  const crew = CREW.filter((m) => CREW_AVAILABILITY[m.id].includes(key)).length;
  return crew + (mine.includes(key) ? 1 : 0);
}

export type RankedOption = Option & { reasons: string[]; free: number; netShareCents: number };

export function netShare(o: Option): number {
  return o.partner ? o.shareCents - Math.round((o.shareCents * PRICES.partnerDiscountPct) / 100) : o.shareCents;
}

/**
 * Rank options by how many people can make it, then budget fit, then vibe.
 * The partner venue wins ties, so the demo's winning option is the partner one.
 */
export function rankOptions(
  mine: SlotKey[],
  budgetCents: number,
  vibe: "active" | "chill",
  hasPass: boolean,
): RankedOption[] {
  const groupSize = CREW.length + 1;
  const activeVotes = CREW.filter((m) => m.vibe === "active").length + (vibe === "active" ? 1 : 0);
  const groupVibe = activeVotes * 2 >= groupSize ? "active" : "chill";
  const pool = OPTIONS.filter((o) => hasPass || !o.passOnly);

  const ranked = pool.map((o) => {
    const free = freeCount(o.slot, mine);
    const net = netShare(o);
    const reasons: string[] = [];
    const { day } = splitSlot(o.slot);
    if (free === groupSize) reasons.push(`Fits everyone's ${DAY_NAMES[day]}`);
    else reasons.push(`${free} of ${groupSize} free ${DAY_NAMES[day]}`);
    if (net <= budgetCents) reasons.push("Under your budget");
    if (o.partner) reasons.push(`Partner venue: ${PRICES.partnerDiscountPct}% off`);
    if (o.vibe === groupVibe && reasons.length < 3) reasons.push(`Matches the ${groupVibe} vibe`);
    const score =
      free * 100 + (net <= budgetCents ? 30 : 0) + (o.vibe === groupVibe ? 10 : 0) + (o.partner ? 5 : 0);
    return { ...o, reasons, free, netShareCents: net, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  // Keep the partner venue first so the demo always books the partner option.
  const pIdx = ranked.findIndex((o) => o.partner);
  if (pIdx > 0) ranked.unshift(ranked.splice(pIdx, 1)[0]);
  const count = hasPass ? LIMITS.voteOptionsPass : LIMITS.voteOptionsFree;
  return ranked.slice(0, count).map((o) => {
    const { score, ...rest } = o;
    void score;
    return rest;
  });
}

export function tally(optionIds: string[], myVote: string | null): Record<string, number> {
  const t: Record<string, number> = Object.fromEntries(optionIds.map((id) => [id, 0]));
  for (const id of Object.values(CREW_VOTES)) if (id in t) t[id]++;
  if (myVote && myVote in t) t[myVote]++;
  return t;
}

export function winner(optionIds: string[], myVote: string | null): Option {
  const t = tally(optionIds, myVote);
  const best = optionIds.reduce((a, b) => (t[b] > t[a] ? b : a), optionIds[0]);
  return OPTIONS.find((o) => o.id === best)!;
}

/** The demo always books the partner venue (it wins the crew vote). */
export const BOOKED = OPTIONS.find((o) => o.partner)!;

function stamp(key: SlotKey, addMinutes = 0): string {
  const { day, slot } = splitSlot(key);
  const [h, m] = SLOT_TIMES[slot].start.split(":").map(Number);
  const total = h * 60 + m + addMinutes;
  const date = DAY_DATES[day].replaceAll("-", "");
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${date}T${hh}${mm}00`;
}

export function googleCalendarUrl(o: Option): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${o.title} with the crew`,
    dates: `${stamp(o.slot)}/${stamp(o.slot, o.minutes)}`,
    details: `Booked with Hangout. ${o.venue}.`,
    location: `${o.venue}, ${o.address}`,
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
    `UID:${o.id}-${stamp(o.slot)}@hangout.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART;TZID=America/New_York:${stamp(o.slot)}`,
    `DTEND;TZID=America/New_York:${stamp(o.slot, o.minutes)}`,
    `SUMMARY:${esc(`${o.title} with the crew`)}`,
    `LOCATION:${esc(`${o.venue}, ${o.address}`)}`,
    "DESCRIPTION:Booked with Hangout.",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
