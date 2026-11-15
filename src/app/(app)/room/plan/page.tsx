"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import BookLinks from "@/components/BookLinks";
import MapLinks from "@/components/MapLinks";
import PlaceMap, { type MapPin } from "@/components/PlaceMap";
import s from "@/components/demo/screen.module.css";
import { formatCents } from "@/lib/money";
import {
  crewOf,
  downloadIcs,
  googleCalendarUrl,
  groupMidpoint,
  meetingOf,
  placePoint,
  rankIdeas,
  shareBreakdown,
  winnerOf,
} from "@/lib/plan";
import { useDemo } from "@/lib/store";
import styles from "./plan.module.css";

export default function Plan() {
  const [state] = useDemo();
  const m = meetingOf(state);
  const crew = crewOf(m);
  const idea = winnerOf(state, rankIdeas(state));
  const b = shareBreakdown(idea);
  const known = placePoint(m, idea);
  const [found, setFound] = useState<{ q: string; point: [number, number] | null } | null>(null);
  const q = `${idea.neighborhood}`;

  // Partner venues have coordinates. Other plans: look up the neighborhood once (server-cached).
  useEffect(() => {
    if (known) return;
    let alive = true;
    fetch(`/api/geo?q=${encodeURIComponent(q)}&near=${encodeURIComponent(m.city)}`)
      .then((r) => r.json())
      .then((r) => {
        const hit = r.results?.[0];
        if (alive) setFound({ q, point: hit ? [hit.lat, hit.lng] : null });
      })
      .catch(() => alive && setFound({ q, point: null }));
    return () => {
      alive = false;
    };
  }, [known, q, m.city]);

  const point = known ?? (found?.q === q ? found.point : null);
  const pins: MapPin[] = point ? [{ id: idea.id, kind: "chosen", lat: point[0], lng: point[1], label: `${idea.title} · ${idea.place}`, text: "★" }] : [];
  const paidCount = 2; // demo: two friends have paid so far

  return (
    <div className={s.screen}>
      <h1 className={s.title}>It&rsquo;s locked.</h1>

      <section className={styles.ticket} aria-labelledby="plan-title">
        <p className={styles.when}>{idea.whenLabel}</p>
        <h2 id="plan-title" className={styles.planTitle}>
          {idea.title}
        </h2>
        <p className={styles.where}>
          <Icon name="pin" size={18} />
          {idea.place}, {m.city}
        </p>
        <ol className={styles.steps}>
          {idea.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className={styles.going}>{m.people} going</p>
      </section>

      <section aria-labelledby="map-title" className={styles.mapSection}>
        <h2 id="map-title" className={s.label}>
          Where it is
        </h2>
        <PlaceMap
          pins={pins}
          midpoint={groupMidpoint(state)}
          label={`Map: ${idea.place} in ${m.city}, and the middle of the group`}
          embedTarget={{ searchHint: idea.searchHint, city: m.city }}
        />
        <BookLinks idea={idea} city={m.city} />
        <MapLinks target={{ searchHint: idea.searchHint, city: m.city }} open={false} />
      </section>

      {b.totalCents > 0 ? (
        <section aria-labelledby="settle-title">
          <h2 id="settle-title" className={styles.settleTitle}>
            Each share is {formatCents(b.totalCents)}. Everyone pays the host back.
          </h2>
          <ul className={styles.people}>
            <li>
              <span className={state.paid ? styles.you : styles.waiting} aria-hidden="true">
                {(state.me.name || "Y")[0]}
              </span>
              <span className={state.paid ? styles.paidLabel : s.small}>{state.paid ? "Paid" : "Waiting"}</span>
              <span className="visually-hidden">You: {state.paid ? "paid" : "not paid yet"}</span>
            </li>
            {crew.map((c, i) => {
              const paid = i < paidCount;
              return (
                <li key={c.id}>
                  <span className={paid ? styles.paid : styles.waiting} aria-hidden="true">
                    {c.name[0]}
                  </span>
                  <span className={paid ? styles.paidLabel : s.small}>{paid ? "Paid" : "Waiting"}</span>
                  <span className="visually-hidden">
                    {c.name}: {paid ? "paid" : "hasn't paid yet"}
                  </span>
                </li>
              );
            })}
          </ul>
          {!state.paid && (
            <Link href="/room/pay" className={s.textLink}>
              Settle up
            </Link>
          )}
        </section>
      ) : (
        <section aria-labelledby="book-title" className={styles.mapSection}>
          <h2 id="book-title" className={styles.settleTitle}>
            Free plan. Nothing to pay.
          </h2>
        </section>
      )}

      {idea.partner && (
        <p className={s.small}>
          {idea.place} is a Hangout partner (demo data). Partner plans are 10% off for everyone.
        </p>
      )}

      <section aria-labelledby="cal-title">
        <h2 id="cal-title" className={s.label}>
          Add to calendar
        </h2>
        <div className={styles.calButtons}>
          <a className={s.secondary} href={googleCalendarUrl(m, idea)} target="_blank" rel="noopener noreferrer">
            <Icon name="calendar" size={18} />
            Google Calendar
            <span className="visually-hidden">(opens in a new tab)</span>
          </a>
          <button type="button" className={s.secondary} onClick={() => downloadIcs(m, idea)}>
            <Icon name="download" size={18} />
            Download .ics
          </button>
        </div>
      </section>

      <div className={s.actions}>
        <Link href="/room/night" className={s.primary}>
          Skip to the day
        </Link>
      </div>
    </div>
  );
}
