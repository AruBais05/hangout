"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { embedUrl, type MapTarget } from "@/lib/maps";
import styles from "./PlaceMap.module.css";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  kind: "idea" | "chosen" | "person" | "me";
  label: string; // tooltip
  text?: string; // what's printed in the pin (a number or an initial)
};

type Props = {
  pins: MapPin[];
  midpoint: [number, number];
  label: string;
  /** With a Google key, the embed shows this place; without one, it shows the midpoint area. */
  embedTarget?: MapTarget;
};

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

const PIN_CLASS: Record<MapPin["kind"], string> = {
  idea: styles.pin,
  chosen: styles.pinChosen,
  person: styles.pinPerson,
  me: styles.pinMe,
};

/**
 * OpenStreetMap via Leaflet by default (no key). If NEXT_PUBLIC_GOOGLE_MAPS_KEY is set,
 * shows the Google Maps Embed API instead.
 */
export default function PlaceMap(props: Props) {
  if (GOOGLE_KEY) {
    const src = props.embedTarget
      ? embedUrl(GOOGLE_KEY, props.embedTarget)
      : `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(GOOGLE_KEY)}&center=${props.midpoint.join(",")}&zoom=12`;
    return (
      <figure className={styles.wrap}>
        <iframe className={styles.map} title={props.label} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </figure>
    );
  }
  return <LeafletMap {...props} />;
}

function LeafletMap({ pins, midpoint, label }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const key = JSON.stringify([pins, midpoint]);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    import("leaflet").then(({ default: L }) => {
      if (cancelled || !box.current) return;
      map = L.map(box.current, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const icon = (cls: string, text: string, size: number) =>
        L.divIcon({ className: "", html: `<span class="${cls}">${text}</span>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      const esc = (t: string) => t.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

      const bounds = L.latLngBounds([midpoint]);
      for (const p of pins) {
        const size = p.kind === "chosen" ? 40 : p.kind === "idea" ? 30 : 28;
        L.marker([p.lat, p.lng], { icon: icon(PIN_CLASS[p.kind], esc(p.text ?? ""), size), title: p.label, zIndexOffset: p.kind === "chosen" ? 1000 : 0 })
          .bindTooltip(esc(p.label))
          .addTo(map);
        bounds.extend([p.lat, p.lng]);
      }
      L.marker(midpoint, { icon: icon(styles.pinMid, "", 18), title: "Middle of the group" }).bindTooltip("Middle of the group").addTo(map);
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const kinds = new Set(pins.map((p) => p.kind));
  return (
    <figure className={styles.wrap}>
      <div ref={box} className={styles.map} role="img" aria-label={label} />
      <figcaption className={styles.legend}>
        {kinds.has("idea") && (
          <span>
            <span className={styles.dotPlace} aria-hidden="true" /> Ideas
          </span>
        )}
        {kinds.has("chosen") && (
          <span>
            <span className={styles.dotChosen} aria-hidden="true" /> Your plan
          </span>
        )}
        {(kinds.has("person") || kinds.has("me")) && (
          <span>
            <span className={styles.dotPerson} aria-hidden="true" /> Rough areas, about 1 km
          </span>
        )}
        <span>
          <span className={styles.dotMid} aria-hidden="true" /> Middle of the group
        </span>
      </figcaption>
    </figure>
  );
}
