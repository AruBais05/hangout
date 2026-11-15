import "server-only";
import { formatClock, type EventItem, type SuggestInput } from "./suggest";

// Ticketmaster Discovery API v2. Only runs when TICKETMASTER_API_KEY is set; any failure gives [].

const cache = new Map<string, { at: number; events: EventItem[] }>();
const HOUR = 60 * 60 * 1000;

type TmEvent = {
  name?: string;
  dates?: { start?: { localDate?: string; localTime?: string } };
  priceRanges?: { min?: number }[];
  _embedded?: { venues?: { name?: string }[] };
};

function shiftDay(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function eventsFor(input: SuggestInput): Promise<EventItem[]> {
  const key = process.env.TICKETMASTER_API_KEY?.trim();
  if (!key) return [];

  const [cityName, state] = input.city.split(",").map((x) => x.trim());
  const cacheKey = `${input.city.toLowerCase()}|${input.date}|${input.window.from}-${input.window.to}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < HOUR) return hit.events;

  // A wide UTC range around the date covers every US time zone; we then filter on local date and time.
  const params = new URLSearchParams({
    apikey: key,
    city: cityName,
    countryCode: "US",
    classificationName: "music,sports,arts",
    startDateTime: `${shiftDay(input.date, -1)}T12:00:00Z`,
    endDateTime: `${shiftDay(input.date, 1)}T12:00:00Z`,
    sort: "date,asc",
    size: "50",
  });
  if (state && /^[A-Z]{2}$/.test(state)) params.set("stateCode", state);

  try {
    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`ticketmaster ${res.status}`);
    const data = (await res.json()) as { _embedded?: { events?: TmEvent[] } };
    const events: EventItem[] = [];
    for (const e of data._embedded?.events ?? []) {
      const start = e.dates?.start;
      if (!e.name || start?.localDate !== input.date || !start.localTime) continue;
      const [h, m] = start.localTime.split(":").map(Number);
      const minutes = h * 60 + (m || 0);
      if (minutes < input.window.from * 60 || minutes >= input.window.to * 60) continue;
      const mins = (e.priceRanges ?? []).map((p) => p.min).filter((x): x is number => typeof x === "number");
      events.push({
        name: e.name.slice(0, 80),
        venue: e._embedded?.venues?.[0]?.name?.slice(0, 80) ?? "",
        startTime: formatClock(minutes),
        minPriceUsd: mins.length ? Math.min(...mins) : null,
      });
      if (events.length >= 10) break;
    }
    cache.set(cacheKey, { at: Date.now(), events });
    return events;
  } catch {
    console.info("[events] source=none");
    return [];
  }
}
