import type { NextRequest } from "next/server";

// Place search and reverse lookup through OpenStreetMap Nominatim.
// Their policy: identify the app, cache results, at most 1 request per second.

const UA = "HangoutDemo/0.1 (student hackathon prototype)";
const cache = new Map<string, unknown>();
let last = 0;
let queue: Promise<unknown> = Promise.resolve();

/** Serializes Nominatim calls so we never send more than one a second. */
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = last + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    return fn();
  });
  queue = run.catch(() => undefined);
  return run;
}

type Address = Record<string, string | undefined>;
export type Place = { label: string; city: string; area: string; lat: number; lng: number };

const round = (n: number) => Math.round(n * 100) / 100; // about 1 km

function cityOf(a: Address): string {
  const name = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? "";
  const state = a["ISO3166-2-lvl4"]?.split("-")[1];
  if (!name) return "";
  return a.country_code === "us" && state ? `${name}, ${state}` : a.country ? `${name}, ${a.country}` : name;
}

function areaOf(a: Address): string {
  return a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district ?? a.borough ?? a.city ?? a.town ?? "";
}

async function nominatim(url: string): Promise<unknown> {
  if (cache.has(url)) return cache.get(url);
  const data = await throttled(async () => {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    return res.json();
  });
  if (cache.size > 1000) cache.delete(cache.keys().next().value!);
  cache.set(url, data);
  return data;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));

  try {
    if (q) {
      // Optional "City, ST" bias, only when the query doesn't name a place itself ("Wicker Park, Chicago").
      const near = sp.get("near");
      const biased = near && !q.includes(",") && !q.toLowerCase().includes(near.split(",")[0].toLowerCase());
      const search = (text: string) =>
        nominatim(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(text)}`) as Promise<
          { lat: string; lon: string; display_name: string; address?: Address }[]
        >;
      let list = await search(biased ? `${q}, ${near}` : q);
      if (biased && list.length === 0) list = await search(q);
      const results: Place[] = list.map((r) => ({
        label: r.display_name.split(",").slice(0, 3).join(","),
        city: cityOf(r.address ?? {}),
        area: areaOf(r.address ?? {}),
        lat: round(Number(r.lat)),
        lng: round(Number(r.lon)),
      }));
      return Response.json({ results });
    }
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      // Reverse lookups use the rounded point, so we never send or keep an exact address.
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${round(lat)}&lon=${round(lng)}`;
      const r = (await nominatim(url)) as { address?: Address };
      return Response.json({ city: cityOf(r.address ?? {}), area: areaOf(r.address ?? {}) });
    }
    return Response.json({ error: "Give q, or lat and lng." }, { status: 400 });
  } catch {
    return Response.json(q ? { results: [] } : { city: "", area: "" });
  }
}
