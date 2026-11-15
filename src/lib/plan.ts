import {
  BIG_PLAN,
  CREW_POOL,
  DEFAULT_MEETING,
  MOCK_SCHEDULE,
  PERSONALITIES,
  PURPOSES,
  QUIZ,
  SLOTS,
  SLOT_HOURS,
  type Idea,
  type Member,
  type Personality,
  type Slot,
} from "./config";
import { formatPrice } from "./money";
import type { DemoState, Meeting } from "./store";

/* ---------- dates ---------- */

export function days(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (d <= end && out.length < 31) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const dow = (iso: string) => new Date(`${iso}T12:00:00`).getDay();

export function dayLabel(iso: string, style: "short" | "long" = "short"): string {
  const d = new Date(`${iso}T12:00:00`);
  const wd = d.toLocaleDateString("en-US", { weekday: "short" });
  const mo = d.toLocaleDateString("en-US", { month: "short" });
  return style === "long" ? `${wd}, ${mo} ${d.getDate()}` : `${wd} ${d.getDate()}`;
}

export function rangeLabel(from: string, to: string): string {
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  const md = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${md(a)} – ${md(b)}`;
}

export const cellKey = (day: string, slot: Slot) => `${day}|${slot}`;

/* ---------- the meeting ---------- */

export function meetingOf(s: DemoState): Meeting {
  return s.meeting ?? { ...DEFAULT_MEETING, name: "" };
}

export function purposeOf(m: Meeting) {
  return PURPOSES.find((p) => p.id === m.purpose)!;
}

export function crewOf(m: Meeting): Member[] {
  return CREW_POOL.slice(0, Math.max(0, m.people - 1));
}

export function isBig(m: Meeting): boolean {
  return purposeOf(m).days >= BIG_PLAN.minDays || m.people >= BIG_PLAN.minPeople;
}

export function bigReasons(m: Meeting): string[] {
  const r: string[] = [];
  const d = purposeOf(m).days;
  if (d >= BIG_PLAN.minDays) r.push(`${d} nights away`);
  if (m.people >= BIG_PLAN.minPeople) r.push(`${m.people} people`);
  return r;
}

/* ---------- demo calendar ---------- */

/** Busy cells (with labels) from the mock schedule for these days. */
export function calendarBusy(dayList: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of dayList) {
    for (const slot of SLOTS) {
      const h = SLOT_HOURS[slot];
      const hit = MOCK_SCHEDULE.find((e) => e.days.includes(dow(d)) && e.from < h.to && e.to > h.from);
      if (hit) out[cellKey(d, slot)] = hit.label;
    }
  }
  return out;
}

/* ---------- crew availability (deterministic) ---------- */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

/** The slot every friend keeps free: the first Saturday evening (or the last evening). */
export function targetCells(m: Meeting): string[] {
  const list = days(m.from, m.to);
  const sat = list.find((d) => dow(d) === 6);
  if (purposeOf(m).days > 1) {
    const sun = sat ? list[list.indexOf(sat) + 1] : undefined;
    if (sat && sun) return [cellKey(sat, "Afternoon"), cellKey(sat, "Evening"), cellKey(sun, "Afternoon")];
  }
  return [cellKey(sat ?? list[list.length - 1], "Evening")];
}

export function memberFree(member: Member, m: Meeting): Set<string> {
  const free = new Set<string>(targetCells(m));
  for (const d of days(m.from, m.to)) {
    const weekend = dow(d) === 0 || dow(d) === 6;
    for (const slot of SLOTS) {
      const p = weekend ? 0.55 : slot === "Evening" ? 0.4 : 0.12;
      if (hash(`${member.id}${d}${slot}`) < p) free.add(cellKey(d, slot));
    }
  }
  return free;
}

/** How many people (crew who joined + you) are free in each cell. */
export function freeCounts(s: DemoState): Record<string, number> {
  const m = meetingOf(s);
  const counts: Record<string, number> = {};
  for (const member of crewOf(m)) for (const k of memberFree(member, m)) counts[k] = (counts[k] ?? 0) + 1;
  for (const [k, v] of Object.entries(s.cells)) if (v === "free") counts[k] = (counts[k] ?? 0) + 1;
  return counts;
}

/* ---------- quiz ---------- */

export function personalityOf(quiz: Record<string, string[]>): Personality {
  const score: Record<Personality, number> = { adventurer: 0, host: 0, explorer: 0, chill: 0 };
  for (const q of QUIZ) {
    for (const label of quiz[q.id] ?? []) {
      const t = q.options.find((o) => o.label === label)?.type;
      if (t) score[t]++;
    }
  }
  const order: Personality[] = ["adventurer", "explorer", "host", "chill"];
  return order.reduce((a, b) => (score[b] > score[a] ? b : a), order[0]);
}

export function groupMix(s: DemoState): { type: Personality; count: number }[] {
  const m = meetingOf(s);
  const types = crewOf(m).map((c) => c.type);
  if (s.joined) types.push(personalityOf(s.quiz));
  const counts = new Map<Personality, number>();
  for (const t of types) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}

export function mixLabel(type: Personality, count: number): string {
  const name = PERSONALITIES[type].name.replace("The ", "");
  return `${count} ${name}${count > 1 ? "s" : ""}`;
}

/* ---------- budget ---------- */

export function budgetKind(m: Meeting): "day" | "trip" {
  return purposeOf(m).days > 1 ? "trip" : "day";
}

/** Private budget match: only the range that works for everyone is shown. */
export function workableRange(s: DemoState): { low: number; high: number } {
  const m = meetingOf(s);
  const kind = budgetKind(m);
  const all = crewOf(m).map((c) => c.budget[kind]);
  if (s.budgetCents) all.push(s.budgetCents);
  const high = Math.min(...all);
  const low = Math.floor((high * 0.75) / 500) * 500;
  return { low, high };
}

/* ---------- ideas ---------- */

export type RankedIdea = Idea & { when: string; whenLabel: string; free: number; reasons: string[] };

export function rankIdeas(s: DemoState): RankedIdea[] {
  const m = meetingOf(s);
  const purpose = purposeOf(m);
  const size = m.people;
  const counts = freeCounts(s);
  const { high } = workableRange(s);
  const mix = groupMix(s);
  const top = mix[0]?.type;
  const trip = purpose.days > 1;
  const list = days(m.from, m.to);

  const ranked = purpose.ideas.map((idea) => {
    let when = "";
    let free = -1;
    if (trip) {
      // A weekend works when people are free on Saturday and Sunday.
      for (const d of list.filter((x) => dow(x) === 6)) {
        const sun = list[list.indexOf(d) + 1];
        if (!sun) continue;
        const n = Math.min(counts[cellKey(d, "Afternoon")] ?? 0, counts[cellKey(sun, "Afternoon")] ?? 0);
        if (n > free) {
          free = n;
          when = d;
        }
      }
      if (!when) {
        when = list[0];
        free = 0;
      }
    } else {
      for (const d of list) {
        for (const slot of idea.slots) {
          const k = cellKey(d, slot);
          const n = counts[k] ?? 0;
          const weekendBonus = dow(d) === 0 || dow(d) === 6 ? 0.1 : 0;
          if (n + weekendBonus > free) {
            free = n + weekendBonus;
            when = k;
          }
        }
      }
      free = Math.floor(free);
    }

    const [day, slot] = when.split("|") as [string, Slot | undefined];
    const whenLabel = trip
      ? `${dayLabel(day, "long")} – ${dayLabel(list[list.indexOf(day) + 1] ?? day)}`
      : `${dayLabel(day, "long")}, ${SLOT_HOURS[slot ?? "Evening"].time}`;

    const weekday = new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" });
    const reasons: string[] = [];
    reasons.push(free >= size ? `Everyone's free ${weekday}` : `${free} of ${size} free ${weekday}`);
    if (idea.eachCents === 0) reasons.push("Free");
    else if (idea.eachCents <= high) reasons.push(isBig(m) ? "Inside the group's range" : "Under everyone's budget");
    else reasons.push(`${formatPrice(idea.eachCents - high)} over someone's budget`);
    if (top && idea.fits.includes(top)) reasons.push(`Fits the ${PERSONALITIES[top].name.replace("The ", "")}s`);
    if (idea.partner) reasons.push("Partner venue");

    const score =
      free * 100 + (idea.eachCents <= high ? 30 : 0) + (top && idea.fits.includes(top) ? 10 : 0) + (idea.partner ? 5 : 0);
    return { ...idea, when, whenLabel, free, reasons, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, 3).map((r) => {
    const { score, ...rest } = r;
    void score;
    return rest;
  });
}

/** Demo friends' votes: most pick the top idea, a couple spread out. */
export function crewVotes(s: DemoState, ideas: RankedIdea[]): Record<string, string> {
  const out: Record<string, string> = {};
  crewOf(meetingOf(s)).forEach((c, i) => {
    out[c.id] = ideas[i % 4 === 3 ? 1 : i % 5 === 4 ? 2 : 0]?.id ?? ideas[0].id;
  });
  return out;
}

export function tally(s: DemoState, ideas: RankedIdea[]): Record<string, number> {
  const t: Record<string, number> = Object.fromEntries(ideas.map((i) => [i.id, 0]));
  for (const id of Object.values(crewVotes(s, ideas))) t[id]++;
  if (s.myVote && s.myVote in t) t[s.myVote]++;
  return t;
}

export function winnerOf(s: DemoState, ideas: RankedIdea[]): RankedIdea {
  const t = tally(s, ideas);
  return ideas.reduce((a, b) => (t[b.id] > t[a.id] ? b : a), ideas[0]);
}

/* ---------- calendar export ---------- */

function stamps(m: Meeting, idea: RankedIdea): [string, string] {
  const [day, slot] = idea.when.split("|") as [string, Slot | undefined];
  const compact = (d: string) => d.replaceAll("-", "");
  if (purposeOf(m).days > 1) {
    const end = new Date(`${day}T12:00:00`);
    end.setDate(end.getDate() + 1);
    return [`${compact(day)}T100000`, `${compact(end.toISOString().slice(0, 10))}T170000`];
  }
  const h = SLOT_HOURS[slot ?? "Evening"];
  const [hh, mm] = h.start.split(":").map(Number);
  const endH = String(Math.min(23, hh + 3)).padStart(2, "0");
  return [`${compact(day)}T${String(hh).padStart(2, "0")}${String(mm).padStart(2, "0")}00`, `${compact(day)}T${endH}${String(mm).padStart(2, "0")}00`];
}

export function googleCalendarUrl(m: Meeting, idea: RankedIdea): string {
  const [a, b] = stamps(m, idea);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${idea.title} with the crew`,
    dates: `${a}/${b}`,
    details: `Planned with Hangout. ${idea.place}.`,
    location: `${idea.place}, ${idea.area}`,
    ctz: "America/New_York",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function icsFile(m: Meeting, idea: RankedIdea): string {
  const [a, b] = stamps(m, idea);
  const esc = (x: string) => x.replace(/([,;\\])/g, "\\$1");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hangout//Demo//EN",
    "BEGIN:VEVENT",
    `UID:${idea.id}-${a}@hangout.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART;TZID=America/New_York:${a}`,
    `DTEND;TZID=America/New_York:${b}`,
    `SUMMARY:${esc(`${idea.title} with the crew`)}`,
    `LOCATION:${esc(`${idea.place}, ${idea.area}`)}`,
    "DESCRIPTION:Planned with Hangout.",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadIcs(m: Meeting, idea: RankedIdea) {
  const blob = new Blob([icsFile(m, idea)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hangout-${idea.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
