"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import s from "./demo/screen.module.css";
import styles from "./LocationPicker.module.css";

type Result = { label: string; city: string; area: string; lat: number; lng: number };
export type CityPick = { name: string; center: [number, number] };

/** Pick the group's city by search. The demo crew, the quiz and the AI plans all follow it. */
export default function CityField({ value, onChange }: { value: string; onChange: (c: CityPick) => void }) {
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/geo?q=${encodeURIComponent(q.trim())}`).then((x) => x.json());
      // One row per city: a search can return several spots in the same place.
      const seen = new Set<string>();
      const list: Result[] = (r.results ?? []).filter((x: Result) => x.city && !seen.has(x.city) && seen.add(x.city));
      setResults(list);
      if (!list.length) setMsg("No city found. Try a city name, like Denver or Seattle.");
    } catch {
      setMsg("Search isn't working right now. Try again in a moment.");
    }
    setBusy(false);
  }

  function choose(r: Result) {
    onChange({ name: r.city, center: [r.lat, r.lng] });
    setEditing(false);
    setResults([]);
    setQ("");
  }

  if (!editing) {
    return (
      <div className={styles.cityRow}>
        <span className={styles.cityName}>
          <Icon name="pin" size={18} />
          {value}
        </span>
        <button type="button" className={s.textLink} onClick={() => setEditing(true)}>
          Change city
        </button>
      </div>
    );
  }

  return (
    <div className={styles.picker}>
      <form className={styles.search} onSubmit={search} role="search">
        <label htmlFor="city-search" className="visually-hidden">
          Search a city
        </label>
        <input
          id="city-search"
          type="search"
          value={q}
          autoFocus
          placeholder="Search a city, e.g. Denver"
          autoComplete="off"
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className={styles.searchBtn} disabled={busy} aria-label="Search">
          <Icon name="search" size={18} />
        </button>
      </form>
      {results.length > 0 && (
        <ul className={styles.results} aria-label="Cities">
          {results.map((r) => (
            <li key={r.city}>
              <button type="button" onClick={() => choose(r)}>
                {r.city}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className={s.small} aria-live="polite">
        {msg || "Your friends, the quiz and the AI plans all move to this city."}
      </p>
      <button type="button" className={s.textLink} onClick={() => setEditing(false)}>
        Keep {value}
      </button>
    </div>
  );
}
