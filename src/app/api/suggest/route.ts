import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  allowCall,
  aiKey,
  cacheGet,
  cacheSet,
  clientIp,
  complete,
  hashKey,
  loadPrompt,
  logSource,
  parseJson,
  RateLimited,
  withTimeout,
} from "@/lib/ai";
import { PERSONALITIES, TYPE_ORDER, partnersFor, type Personality } from "@/lib/config";
import { eventsFor } from "@/lib/events";
import {
  clean,
  groupBudgetCents,
  inWindow,
  inputKey,
  planCount,
  samplePlans,
  type PlanCard,
  type SuggestInput,
  type SuggestResult,
} from "@/lib/suggest";

// Room for the events call plus the 8-second AI timeout, so the platform doesn't cut us off first.
export const maxDuration = 20;

const Body = z.object({
  city: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  window: z.object({ from: z.number().int().min(0).max(23), to: z.number().int().min(1).max(24) }),
  vibe: z.enum(["active", "chill"]),
  groupSize: z.number().int().min(1).max(20),
  hasPass: z.boolean(),
  members: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        type: z.enum(TYPE_ORDER as [Personality, ...Personality[]]),
        budget: z.enum(["u25", "25to50", "50to100", "flex"]),
        point: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]).nullable(),
        travel: z.number().int().min(5).max(120),
      }),
    )
    .min(1)
    .max(20),
  fresh: z.boolean().optional(),
});

const AiPlan = z.object({
  title: z.string().min(1).max(60),
  summary: z.string().min(1).max(240),
  neighborhood: z.string().min(1).max(80),
  start_time: z.string().min(1).max(20),
  cost_per_person_usd: z.number().nonnegative(),
  steps: z.array(z.string().min(1).max(160)).min(2).max(3),
  why_it_fits_group: z.string().min(1).max(240),
  why_it_fits: z.record(z.string(), z.string().min(1).max(100)),
  search_hint: z.string().min(1).max(120),
  partner_name: z.string().nullable(),
  event_name: z.string().nullable(),
});

const AiReply = z.object({ plans: z.array(z.unknown()) });

export async function POST(request: NextRequest) {
  const started = Date.now();
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  // Trim what users typed: names to 20, city to 40, no line breaks.
  const input: SuggestInput = {
    city: clean(parsed.city, 40),
    date: parsed.date,
    window: parsed.window.to > parsed.window.from ? parsed.window : { from: 18, to: 22 },
    vibe: parsed.vibe,
    groupSize: parsed.groupSize,
    hasPass: parsed.hasPass,
    members: parsed.members.map((m) => ({ ...m, name: clean(m.name, 20) || "Friend" })),
  };
  const count = planCount(input.hasPass);
  const budgetCents = groupBudgetCents(input.members);
  const key = hashKey(inputKey(input));

  const samples = (source: SuggestResult["source"] = "sample"): SuggestResult => ({
    source,
    plans: samplePlans(input, count),
    budgetCents,
    count,
    events: [],
  });

  if (!parsed.fresh) {
    const hit = cacheGet<SuggestResult>(key);
    if (hit) {
      logSource("suggest", "cache", started);
      return Response.json({ ...hit, source: "cache" });
    }
  }

  if (!aiKey()) {
    logSource("suggest", "sample", started);
    return Response.json(samples());
  }
  if (!allowCall(clientIp(request.headers))) {
    const hit = cacheGet<SuggestResult>(key);
    logSource("suggest", hit ? "cache" : "sample", started);
    return Response.json(hit ? { ...hit, source: "cache" } : samples());
  }

  const partners = partnersFor(input.city);
  const events = await eventsFor(input);

  try {
    const system = (await loadPrompt("suggest")).replaceAll("{count}", String(count));
    // All user input goes here, as data. Never into the system prompt.
    const data = {
      city: input.city,
      date: input.date,
      time_window: { start: `${input.window.from}:00`, end: `${input.window.to}:00` },
      budget_per_person_usd: budgetCents / 100,
      vibe: input.vibe,
      group_size: input.groupSize,
      members: input.members.map((m) => ({
        name: m.name,
        hangout_type: PERSONALITIES[m.type].name,
        rough_location: m.point ? { lat: m.point[0], lng: m.point[1] } : null,
        travel_limit_minutes: m.travel,
      })),
      partners: partners.map((p) => ({
        name: p.name,
        neighborhood: p.neighborhood,
        category: p.category,
        price_per_person_usd: p.eachCents / 100,
      })),
      events: events.map((e) => ({ name: e.name, place: e.venue, time: e.startTime, price_from_usd: e.minPriceUsd })),
    };
    const user = `Plan for this group. JSON input:\n${JSON.stringify(data)}`;

    const text = await withTimeout((signal) => complete(system, user, signal));
    const reply = AiReply.parse(parseJson(text));

    const names = input.members.map((m) => m.name).sort();
    const valid: PlanCard[] = [];
    const dropped: string[] = []; // which rule failed (no user content), for dev logs only
    for (const raw of reply.plans) {
      const r = AiPlan.safeParse(raw);
      if (!r.success) {
        dropped.push(`shape:${r.error.issues.map((i) => i.path.join(".")).join("+")}`);
        continue;
      }
      const p = r.data;
      const eachCents = Math.round(p.cost_per_person_usd * 100);
      const partner = p.partner_name === null ? null : partners.find((x) => x.name === p.partner_name);
      const event = p.event_name === null ? null : events.find((x) => x.name === p.event_name);
      const fitNames = Object.keys(p.why_it_fits).sort();
      const ok =
        eachCents <= budgetCents &&
        inWindow(p.start_time, input.window) &&
        fitNames.length === names.length &&
        fitNames.every((n, i) => n === names[i]) &&
        partner !== undefined &&
        event !== undefined &&
        (!partner || eachCents === partner.eachCents);
      if (!ok) {
        dropped.push(
          [
            eachCents > budgetCents && "budget",
            !inWindow(p.start_time, input.window) && `window(${p.start_time})`,
            !(fitNames.length === names.length && fitNames.every((n, i) => n === names[i])) && "names",
            partner === undefined && "partner",
            event === undefined && "event",
            partner && eachCents !== partner.eachCents && "partner-price",
          ]
            .filter(Boolean)
            .join("+"),
        );
        continue;
      }
      valid.push({
        id: `ai-${valid.length}-${hashKey(p.title).slice(0, 6)}`,
        title: p.title,
        summary: p.summary,
        neighborhood: p.neighborhood,
        startTime: p.start_time.trim(),
        eachCents,
        steps: p.steps,
        whyGroup: p.why_it_fits_group,
        whyFits: p.why_it_fits,
        searchHint: p.search_hint,
        partnerName: partner?.name ?? null,
        eventName: event?.name ?? null,
      });
      if (valid.length === count) break;
    }

    if (process.env.NODE_ENV !== "production" && dropped.length) console.info(`[suggest] dropped ${dropped.join(", ")}`);
    if (valid.length === 0) throw new Error("no valid plans");
    const fill = samplePlans(input, count - valid.length, valid.map((v) => v.title));
    const result: SuggestResult = { source: "ai", plans: [...valid, ...fill], budgetCents, count, events };
    cacheSet(key, result);
    logSource("suggest", "ai", started);
    return Response.json(result);
  } catch (err) {
    logSource("suggest", err instanceof RateLimited ? "sample(429)" : "sample", started);
    const hit = cacheGet<SuggestResult>(key);
    return Response.json(hit ? { ...hit, source: "cache" } : { ...samples(), events });
  }
}
