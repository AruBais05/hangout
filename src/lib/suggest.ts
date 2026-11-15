// Shared by the server route and the browser: plan shape, budget rule, sample fallback.
import {
  BUDGET_RANGES,
  GENERIC_SAMPLES,
  PERSONALITIES,
  SAMPLE_PLANS,
  type BudgetRangeId,
  type Personality,
  type SamplePlan,
  type Vibe,
} from "./config";

export type PlanCard = {
  id: string;
  title: string;
  summary: string;
  neighborhood: string;
  startTime: string; // e.g. "7:30 PM"
  eachCents: number;
  steps: string[];
  whyGroup: string;
  whyFits: Record<string, string>; // member first name → their line
  searchHint: string;
  partnerName: string | null;
  eventName: string | null;
};

export type SuggestMember = {
  name: string;
  type: Personality;
  budget: BudgetRangeId;
  point: [number, number] | null; // rounded to about 1 km
  travel: number; // minutes
};

export type SuggestInput = {
  city: string;
  date: string; // YYYY-MM-DD, already chosen by our own code
  window: { from: number; to: number }; // hours, 24h clock
  vibe: Vibe;
  groupSize: number;
  hasPass: boolean;
  members: SuggestMember[];
};

export type EventItem = { name: string; venue: string; startTime: string; minPriceUsd: number | null };

export type SuggestResult = {
  source: "ai" | "sample" | "cache";
  plans: PlanCard[];
  budgetCents: number;
  count: number;
  events: EventItem[];
};

/* ---------- rules computed in our own code ---------- */

export function budgetCap(id: BudgetRangeId): number {
  return BUDGET_RANGES.find((b) => b.id === id)?.capCents ?? 15000;
}

/** Lowest upper bound in the group. */
export function groupBudgetCents(members: Pick<SuggestMember, "budget">[]): number {
  return members.length ? Math.min(...members.map((m) => budgetCap(m.budget))) : 15000;
}

export function planCount(hasPass: boolean): number {
  return hasPass ? 5 : 3;
}

export function clean(text: string, max: number): string {
  return text.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function formatClock(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

/** "7:30 PM" → minutes after midnight, or null. */
export function parseClock(text: string): number | null {
  const m = text.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]\.?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h < 1 || h > 12 || min > 59) return null;
  if (m[3].toLowerCase() === "p" && h !== 12) h += 12;
  if (m[3].toLowerCase() === "a" && h === 12) h = 0;
  return h * 60 + min;
}

export function inWindow(startTime: string, window: SuggestInput["window"]): boolean {
  const t = parseClock(startTime);
  return t !== null && t >= window.from * 60 && t < window.to * 60;
}

/** Stable key for caching: same inputs, same key. */
export function inputKey(input: SuggestInput): string {
  const members = [...input.members]
    .map((m) => [m.name, m.type, m.budget, m.point?.join(",") ?? "", m.travel].join("|"))
    .sort();
  return JSON.stringify([input.city.toLowerCase(), input.date, input.window.from, input.window.to, input.vibe, input.groupSize, input.hasPass, members]);
}

/* ---------- sample plans ---------- */

function fitLine(type: Personality, fits: Personality[]): string {
  if (fits.includes(type)) return `Made for your ${PERSONALITIES[type].name.toLowerCase()} side`;
  const other: Record<Personality, string> = {
    explorer: "A fresh twist on a classic",
    homebody: "Easy pace, easy to leave early",
    nightowl: "Ends early enough to go out after",
    planner: "Fixed start time, easy to plan",
  };
  return other[type];
}

function toCard(p: SamplePlan, input: SuggestInput, i: number): PlanCard {
  const latest = input.window.to * 60 - 30;
  const start = Math.min(input.window.from * 60 + p.offsetMinutes, latest);
  const types = [...new Set(input.members.map((m) => m.type))].filter((t) => p.fits.includes(t));
  const names = types.length ? types : p.fits;
  return {
    id: `sample-${i}-${p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: p.title,
    summary: p.summary,
    neighborhood: p.neighborhood,
    startTime: formatClock(Math.max(start, input.window.from * 60)),
    eachCents: p.eachCents,
    steps: p.steps,
    whyGroup: `Good for the ${names.map((t) => PERSONALITIES[t].plural.toLowerCase()).join(" and ")} in the group.`,
    whyFits: Object.fromEntries(input.members.map((m) => [m.name, fitLine(m.type, p.fits)])),
    searchHint: p.searchHint,
    partnerName: p.partnerName,
    eventName: null,
  };
}

/** Sample plans for this city: in budget and matching the vibe first. */
export function samplePlans(input: SuggestInput, count: number, skipTitles: string[] = []): PlanCard[] {
  const list = SAMPLE_PLANS[input.city.trim().toLowerCase()] ?? GENERIC_SAMPLES;
  const budget = groupBudgetCents(input.members);
  const scored = list
    .map((p, i) => ({ p, i, score: (p.eachCents <= budget ? 10 : 0) + (p.vibe === input.vibe || p.vibe === "any" ? 5 : 0) - i * 0.01 }))
    .filter(({ p }) => !skipTitles.includes(p.title))
    .sort((a, b) => b.score - a.score);
  // Keep the first sample on top when it fits: it's the demo's $38 partner plan.
  return scored.slice(0, count).map(({ p, i }) => toCard(p, input, i));
}
