// Official Google Maps URLs (no API key needed):
// https://developers.google.com/maps/documentation/urls/get-started

export type MapTarget = { searchHint: string; city: string };

const query = (t: MapTarget) => `${t.searchHint} ${t.city}`.trim();

export function mapsSearchUrl(t: MapTarget): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query(t))}`;
}

export function directionsUrl(t: MapTarget): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query(t))}`;
}

/** "See what's on that night": a Google search, opened in a new tab. */
export function eventsSearchUrl(city: string, date: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`events in ${city} ${date}`)}`;
}

/** Google Maps Embed API URL, only used when NEXT_PUBLIC_GOOGLE_MAPS_KEY is set. */
export function embedUrl(key: string, t: MapTarget): string {
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query(t))}`;
}

