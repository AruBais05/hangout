import {
  BIG_PLAN,
  CREW_POOL,
  DEFAULT_CITY,
  EXTRA_NAMES,
  DEFAULT_MEETING,
  DEMO_QUIZ,
  MOCK_SCHEDULE,
  PARTNERS,
  PERSONALITIES,
  PRICES,
  PURPOSES,
  SLOTS,
  SLOT_HOURS,
  TYPE_ORDER,
  partnersFor,
  type Member,
  type Personality,
  type QuizQuestion,
  type Slot,
} from "./config";
import {
  groupBudgetCents,
  inputKey,
  parseClock,
  planCount,
  samplePlans,
  type PlanCard,
  type SuggestInput,
  type SuggestMember,
} from "./suggest";
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
  return s.meeting ?? { ...DEFAULT_MEETING, name: "", city: DEFAULT_CITY.name, center: DEFAULT_CITY.center };
}

export function purposeOf(m: Meeting) {
  return PURPOSES.find((p) => p.id === m.purpose)!;
}

const TYPES = ["explorer", "nightowl", "planner", "homebody"] as const;
const BUDGETS = ["25to50", "50to100", "flex", "25to50"] as const;

/** Demo friends: the 11 named ones, then generated ones for big groups (up to 49 friends + you). */
export function crewOf(m: Meeting): Member[] {
  const n = Math.max(0, m.people - 1);
  const extra: Member[] = [];
  for (let i = CREW_POOL.length; i < n; i++) {
    const k = i - CREW_POOL.length;
    const angle = (k * 137.5 * Math.PI) / 180; // spread around the center
    const r = 0.02 + (k % 7) * 0.012;
    extra.push({
      id: `extra-${k}`,
      name: EXTRA_NAMES[k % EXTRA_NAMES.length],
      type: TYPES[k % 4],
      budget: BUDGETS[k % 4],
      offset: [Number((Math.sin(angle) * r).toFixed(3)), Number((Math.cos(angle) * r).toFixed(3))],
      travel: 30,
    });
  }
  return [...CREW_POOL, ...extra].slice(0, n);
}

export function isBig(m: Meeting): boolean {
  return purposeOf(m).days >= BIG_PLAN.minDays || m.people >= BIG_PLAN.minPeople;
}

/** A big plan must be paid for (unlock or Crew Pass) before any planning happens. */
export function needsUnlock(s: DemoState): boolean {
  return !!s.meeting && isBig(s.meeting) && !s.unlocked && !s.pass;
}

/** Where a big plan continues once it's unlocked. */
export const AFTER_UNLOCK = "/start/people";

export function bigReasons(m: Meeting): string[] {
  const r: string[] = [];
  const d = purposeOf(m).days;
  if (d >= BIG_PLAN.minDays) r.push(`${d} nights away`);
  if (m.people >= BIG_PLAN.minPeople) r.push(`${m.people} people`);
  return r;
}

/** The questions everyone in this group answers. */
export function quizOf(s: DemoState): QuizQuestion[] {
  return s.groupQuiz?.questions ?? DEMO_QUIZ;
}

/* ---------- places ---------- */

export const roundPoint = (p: [number, number]): [number, number] => [
  Math.round(p[0] * 100) / 100,
  Math.round(p[1] * 100) / 100,
];

/** A demo friend's rough home: the city center plus their offset, rounded to about 1 km. */
export function crewPoint(m: Meeting, member: Member): [number, number] {
  return roundPoint([m.center[0] + member.offset[0], m.center[1] + member.offset[1]]);
}

export function myPoint(s: DemoState): [number, number] {
  return s.me.point ?? roundPoint(meetingOf(s).center);
}

export function groupMidpoint(s: DemoState): [number, number] {
  const m = meetingOf(s);
  const pts = [myPoint(s), ...crewOf(m).map((c) => crewPoint(m, c))];
  return [
    Number((pts.reduce((a, p) => a + p[0], 0) / pts.length).toFixed(4)),
    Number((pts.reduce((a, p) => a + p[1], 0) / pts.length).toFixed(4)),
  ];
}

/** Coordinates for a plan, when we know them (partner venues). */
export function placePoint(m: Meeting, plan: Pick<PlanCard, "partnerName">): [number, number] | null {
  const p = partnersFor(m.city).find((x) => x.name === plan.partnerName);
  return p ? [p.lat, p.lng] : null;
}

export const hasPartners = (city: string) => !!PARTNERS[city.trim().toLowerCase()];

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

/** How many people (crew + you) are free in each cell. */
export function freeCounts(s: DemoState): Record<string, number> {
  const m = meetingOf(s);
  const counts: Record<string, number> = {};
  for (const member of crewOf(m)) for (const k of memberFree(member, m)) counts[k] = (counts[k] ?? 0) + 1;
  for (const [k, v] of Object.entries(s.cells)) if (v === "free") counts[k] = (counts[k] ?? 0) + 1;
  return counts;
}

/** Our own code picks the shared day and time window; the AI only writes the plans. */
export function bestCell(s: DemoState): { day: string; slot: Slot; free: number } {
  const m = meetingOf(s);
  const counts = freeCounts(s);
  const list = days(m.from, m.to);
  if (purposeOf(m).days > 1) {
    let best = { day: list[0], slot: "Afternoon" as Slot, free: -1 };
    for (const d of list.filter((x) => dow(x) === 6)) {
      const sun = list[list.indexOf(d) + 1];
      if (!sun) continue;
      const n = Math.min(counts[cellKey(d, "Afternoon")] ?? 0, counts[cellKey(sun, "Afternoon")] ?? 0);
      if (n > best.free) best = { day: d, slot: "Afternoon", free: n };
    }
    return { ...best, free: Math.max(0, best.free) };
  }
  let best = { day: list[list.length - 1], slot: "Evening" as Slot, free: -1, score: -1 };
  for (const d of list) {
    for (const slot of SLOTS) {
      const n = counts[cellKey(d, slot)] ?? 0;
      const score = n + (dow(d) === 0 || dow(d) === 6 ? 0.1 : 0) + (slot === "Evening" ? 0.05 : 0);
      if (score > best.score) best = { day: d, slot, free: n, score };
    }
  }
  return { day: best.day, slot: best.slot, free: Math.max(0, best.free) };
}

/* ---------- quiz ---------- */

export function personalityOf(answers: Record<number, number>, questions: QuizQuestion[]): Personality {
  const score: Record<Personality, number> = { explorer: 0, homebody: 0, nightowl: 0, planner: 0 };
  questions.forEach((q, qi) => {
    const a = q.answers[answers[qi]];
    if (!a) return;
    for (const [t, p] of Object.entries(a.points)) score[t as Personality] += p ?? 0;
  });
  return TYPE_ORDER.reduce((a, b) => (score[b] > score[a] ? b : a), TYPE_ORDER[0]);
}

export const myType = (s: DemoState) =>
  Object.keys(s.answers).length === 0 && s.me.type ? s.me.type : personalityOf(s.answers, quizOf(s));

export function groupMix(s: DemoState): { type: Personality; count: number }[] {
  const m = meetingOf(s);
  const types = crewOf(m).map((c) => c.type);
  if (s.joined) types.push(myType(s));
  const counts = new Map<Personality, number>();
  for (const t of types) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}

export function mixLabel(type: Personality, count: number): string {
  const p = PERSONALITIES[type];
  return `${count} ${count > 1 ? p.plural : p.name}`;
}

/* ---------- AI plans ---------- */

/** What we send to /api/suggest. Names are made unique so each person gets their own line. */
export function suggestInput(s: DemoState): SuggestInput {
  const m = meetingOf(s);
  const { day, slot } = bestCell(s);
  const crew: SuggestMember[] = crewOf(m).map((c) => ({
    name: c.name,
    type: c.type,
    budget: c.budget,
    point: crewPoint(m, c),
    travel: c.travel,
  }));
  let name = s.me.name.trim().slice(0, 20) || "You";
  if (crew.some((c) => c.name.toLowerCase() === name.toLowerCase())) name = `${name.slice(0, 18)} 2`;
  const me: SuggestMember = {
    name,
    type: myType(s),
    budget: s.me.budget ?? "50to100",
    point: myPoint(s),
    travel: s.me.travel,
  };
  return {
    city: m.city,
    date: day,
    window: { from: SLOT_HOURS[slot].from, to: SLOT_HOURS[slot].to },
    vibe: m.vibe,
    groupSize: m.people,
    hasPass: !!s.pass,
    members: [me, ...crew],
  };
}

export const myName = (s: DemoState) => suggestInput(s).members[0].name;

export type RankedIdea = PlanCard & {
  place: string; // partner venue, or the neighborhood
  area: string; // the city
  partner: boolean;
  when: string; // "YYYY-MM-DD|Slot"
  whenLabel: string;
  reasons: string[];
};

/** The plans on the voting screen: the AI's if loaded for these inputs, otherwise samples. */
export function rankIdeas(s: DemoState): RankedIdea[] {
  const m = meetingOf(s);
  const input = suggestInput(s);
  const key = inputKey(input);
  const plans = s.suggest?.key === key ? s.suggest.result.plans : samplePlans(input, planCount(input.hasPass));
  const { day, slot } = bestCell(s);
  const trip = purposeOf(m).days > 1;
  const list = days(m.from, m.to);
  return plans.map((p) => ({
    ...p,
    place: p.partnerName ?? p.neighborhood,
    area: m.city,
    partner: !!p.partnerName,
    when: cellKey(day, slot),
    whenLabel: trip
      ? `${dayLabel(day, "long")} – ${dayLabel(list[list.indexOf(day) + 1] ?? day)}`
      : `${dayLabel(day, "long")}, ${p.startTime}`,
    reasons: [
      ...(p.partnerName ? [`Partner: ${PRICES.partnerDiscountPct}% off`] : []),
      ...(p.eventName ? [`Event: ${p.eventName}`] : []),
    ],
  }));
}

/* ---------- budget ---------- */

/** Private budget match: only the range that works for everyone is shown. */
export function workableRange(s: DemoState): { low: number; high: number } {
  const high = groupBudgetCents(suggestInput(s).members);
  return { low: Math.floor((high * 0.6) / 500) * 500, high };
}

/* ---------- votes ---------- */

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

/* ---------- settle up ---------- */

export const thisMonth = () => new Date().toISOString().slice(0, 7);

export type ShareBreakdown = { shareCents: number; discountCents: number; totalCents: number };

/** Your share of the chosen plan, in cents. Partner venues take 10% off. No fees. */
export function shareBreakdown(idea: Pick<PlanCard, "eachCents" | "partnerName">): ShareBreakdown {
  const shareCents = idea.eachCents;
  const discountCents = idea.partnerName ? Math.round((shareCents * PRICES.partnerDiscountPct) / 100) : 0;
  return { shareCents, discountCents, totalCents: shareCents - discountCents };
}

/* ---------- calendar export ---------- */

function stamps(m: Meeting, idea: RankedIdea): [string, string] {
  const [day] = idea.when.split("|");
  const compact = (d: string) => d.replaceAll("-", "");
  if (purposeOf(m).days > 1) {
    const end = new Date(`${day}T12:00:00`);
    end.setDate(end.getDate() + 1);
    return [`${compact(day)}T100000`, `${compact(end.toISOString().slice(0, 10))}T170000`];
  }
  const start = parseClock(idea.startTime) ?? 19 * 60 + 30;
  const end = Math.min(23 * 60 + 59, start + 180);
  const hhmm = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}${String(t % 60).padStart(2, "0")}00`;
  return [`${compact(day)}T${hhmm(start)}`, `${compact(day)}T${hhmm(end)}`];
}

const where = (idea: RankedIdea) => `${idea.place}, ${idea.area}`;

export function googleCalendarUrl(m: Meeting, idea: RankedIdea): string {
  const [a, b] = stamps(m, idea);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${idea.title} with the crew`,
    dates: `${a}/${b}`,
    details: `Planned with Hangout. ${idea.summary}`,
    location: where(idea),
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
    `DTSTART:${a}`,
    `DTEND:${b}`,
    `SUMMARY:${esc(`${idea.title} with the crew`)}`,
    `LOCATION:${esc(where(idea))}`,
    `DESCRIPTION:${esc(`Planned with Hangout. ${idea.summary}`)}`,
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
