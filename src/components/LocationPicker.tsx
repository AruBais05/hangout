"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { roundPoint } from "@/lib/plan";
import s from "./demo/screen.module.css";
import styles from "./LocationPicker.module.css";

export type Picked = { point: [number, number]; city: string; area: string };
type Result = { label: string; city: string; area: string; lat: number; lng: number };

type Props = {
  center: [number, number]; // the group's city
  city: string; // biases search
  value: [number, number] | null;
  onPick: (p: Picked) => void;
};

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

/** Rounds the point (about 1 km) and asks our server which city and neighborhood it is in. */
async function describe(lat: number, lng: number): Promise<Picked> {
  const point = roundPoint([lat, lng]);
  try {
    const r = await fetch(`/api/geo?lat=${point[0]}&lng=${point[1]}`).then((x) => x.json());
    return { point, city: r.city ?? "", area: r.area ?? "" };
  } catch {
    return { point, city: "", area: "" };
  }
}

/* ---------- map engines: same UI, different tiles ---------- */

type Engine = { setPin: (p: [number, number]) => void; setView: (p: [number, number]) => void; destroy: () => void };

async function leafletEngine(el: HTMLElement, center: [number, number], start: [number, number] | null, onMove: (lat: number, lng: number) => void): Promise<Engine> {
  const { default: L } = await import("leaflet");
  const map = L.map(el, { scrollWheelZoom: false }).setView(start ?? center, 12);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  const icon = L.divIcon({ className: "", html: `<span class="${styles.pin}"></span>`, iconSize: [30, 30], iconAnchor: [15, 30] });
  let marker: import("leaflet").Marker | null = null;
  const setPin = (p: [number, number]) => {
    if (!marker) {
      marker = L.marker(p, { icon, draggable: true, keyboard: true, title: "Your rough area" }).addTo(map);
      marker.on("dragend", () => {
        const ll = marker!.getLatLng();
        onMove(ll.lat, ll.lng);
      });
    } else marker.setLatLng(p);
  };
  if (start) setPin(start);
  map.on("click", (e) => {
    setPin([e.latlng.lat, e.latlng.lng]);
    onMove(e.latlng.lat, e.latlng.lng);
  });
  return { setPin, setView: (p) => map.setView(p, 13), destroy: () => map.remove() };
}

let googleLoading: Promise<void> | null = null;
function loadGoogle(key: string): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  googleLoading ??= new Promise((resolve, reject) => {
    const cb = "__hangoutGoogleReady";
    (window as unknown as Record<string, () => void>)[cb] = () => resolve();
    const tag = document.createElement("script");
    tag.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async&callback=${cb}`;
    tag.async = true;
    tag.onerror = () => reject(new Error("google maps failed"));
    document.head.appendChild(tag);
  });
  return googleLoading;
}

async function googleEngine(el: HTMLElement, input: HTMLInputElement, key: string, center: [number, number], start: [number, number] | null, onMove: (lat: number, lng: number) => void): Promise<Engine> {
  await loadGoogle(key);
  const g = window.google.maps;
  const toLL = (p: [number, number]) => ({ lat: p[0], lng: p[1] });
  const map = new g.Map(el, { center: toLL(start ?? center), zoom: 12, disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative" });
  let marker: google.maps.Marker | null = null;
  const setPin = (p: [number, number]) => {
    if (!marker) {
      marker = new g.Marker({ map, position: toLL(p), draggable: true, title: "Your rough area" });
      marker.addListener("dragend", () => {
        const pos = marker!.getPosition();
        if (pos) onMove(pos.lat(), pos.lng());
      });
    } else marker.setPosition(toLL(p));
  };
  if (start) setPin(start);
  map.addListener("click", (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setPin([e.latLng.lat(), e.latLng.lng()]);
    onMove(e.latLng.lat(), e.latLng.lng());
  });
  const auto = new g.places.Autocomplete(input, { fields: ["geometry", "name"] });
  auto.addListener("place_changed", () => {
    const loc = auto.getPlace().geometry?.location;
    if (!loc) return;
    const p: [number, number] = [loc.lat(), loc.lng()];
    map.setCenter(toLL(p));
    map.setZoom(13);
    setPin(p);
    onMove(p[0], p[1]);
  });
  return { setPin, setView: (p) => map.setCenter(toLL(p)), destroy: () => g.event.clearInstanceListeners(map) };
}

/* ---------- the picker ---------- */

export default function LocationPicker({ center, city, value, onPick }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const engine = useRef<Engine | null>(null);
  const onPickRef = useRef(onPick);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // Build the map once per city center. Pin moves come back through onMove.
  const centerKey = center.join(",");
  useEffect(() => {
    let alive = true;
    const onMove = async (lat: number, lng: number) => {
      setMsg("Finding the neighborhood…");
      const picked = await describe(lat, lng);
      if (!alive) return;
      setMsg("");
      onPickRef.current(picked);
    };
    const el = box.current!;
    const start = value;
    (async () => {
      // Load the library first, then check we're still the current effect before touching the
      // container (a stale run would otherwise grab it and leave the map empty).
      const google = GOOGLE_KEY ? await loadGoogle(GOOGLE_KEY).then(() => true, () => false) : false;
      if (!google) await import("leaflet");
      if (!alive) return;
      const e = google
        ? await googleEngine(el, input.current!, GOOGLE_KEY!, center, start, onMove)
        : await leafletEngine(el, center, start, onMove);
      if (alive) engine.current = e;
      else e.destroy();
    })();
    return () => {
      alive = false;
      engine.current?.destroy();
      engine.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerKey]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (GOOGLE_KEY || !q.trim()) return; // Google mode: Places Autocomplete handles it
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/geo?q=${encodeURIComponent(q.trim())}&near=${encodeURIComponent(city)}`).then((x) => x.json());
      setResults(r.results ?? []);
      if (!r.results?.length) setMsg("No match. Try a neighborhood or a city name.");
    } catch {
      setMsg("Search isn't working right now. Tap the map instead.");
    }
    setBusy(false);
  }

  function choose(r: Result) {
    setResults([]);
    setQ(r.label);
    const point: [number, number] = [r.lat, r.lng];
    engine.current?.setView(point);
    engine.current?.setPin(point);
    onPick({ point, city: r.city, area: r.area });
  }

  function useMine() {
    if (!navigator.geolocation) {
      setMsg("Your browser can't share location. Tap the map instead.");
      return;
    }
    setMsg("Asking your browser…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const picked = await describe(pos.coords.latitude, pos.coords.longitude);
        engine.current?.setView(picked.point);
        engine.current?.setPin(picked.point);
        setMsg("");
        onPick(picked);
      },
      () => setMsg("Location is off. Tap the map or search instead."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }

  return (
    <div className={styles.picker}>
      <form className={styles.search} onSubmit={search} role="search">
        <label htmlFor="loc-search" className="visually-hidden">
          Search a neighborhood or place
        </label>
        <input
          id="loc-search"
          ref={input}
          type="search"
          value={q}
          placeholder="Search a neighborhood or city"
          autoComplete="off"
          onChange={(e) => setQ(e.target.value)}
        />
        {!GOOGLE_KEY && (
          <button type="submit" className={styles.searchBtn} disabled={busy} aria-label="Search">
            <Icon name="search" size={18} />
          </button>
        )}
      </form>
      {results.length > 0 && (
        <ul className={styles.results} aria-label="Search results">
          {results.map((r) => (
            <li key={`${r.lat},${r.lng},${r.label}`}>
              <button type="button" onClick={() => choose(r)}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div ref={box} className={styles.map} role="application" aria-label="Map. Tap to drop your pin, or drag it." />
      <button type="button" className={s.secondary} onClick={useMine}>
        <Icon name="pin" size={18} />
        Use my location
      </button>
      <p className={s.small} aria-live="polite">
        {msg || "Tap the map or drag the pin. We round it to about 1 km and only show your neighborhood."}
      </p>
    </div>
  );
}
