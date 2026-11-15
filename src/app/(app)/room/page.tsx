"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { PERSONALITIES } from "@/lib/config";
import { inviteUrl } from "@/lib/invite";
import PlaceMap from "@/components/PlaceMap";
import {
  crewOf,
  groupMix,
  isBig,
  meetingOf,
  mixLabel,
  crewPoint,
  groupMidpoint,
  myPoint,
  myType,
  purposeOf,
  rangeLabel,
} from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./room.module.css";

export default function Room() {
  const [state, ready] = useDemo();
  const m = meetingOf(state);
  const crew = crewOf(m);
  const joined = Math.min(state.crewJoined, crew.length);
  const [filling, setFilling] = useState(false);
  const [msg, setMsg] = useState("");
  const inCount = joined + (state.joined ? 1 : 0);
  const allIn = inCount === m.people;
  const big = isBig(m);
  const areaKey = (id: string) => { const c = crew.find((x) => x.id === id); return c ? crewPoint(m, c).join(",") : id; };

  // Neighborhood names for the demo crew's rough areas (asked one at a time; the server caches them).
  const asking = useRef<string | null>(null);
  const missingIds = ready ? crew.filter((c) => !(areaKey(c.id) in state.crewAreas)).map((c) => c.id) : [];
  const missingKey = missingIds.length ? `${m.center.join(",")}|${missingIds.join(",")}` : "";
  useEffect(() => {
    if (!missingKey || asking.current === missingKey) return;
    asking.current = missingKey;
    (async () => {
      for (const c of crew.filter((x) => missingIds.includes(x.id))) {
        const [lat, lng] = crewPoint(m, c);
        let area = "";
        try {
          const r = await fetch(`/api/geo?lat=${lat}&lng=${lng}`).then((x) => x.json());
          area = r.area || "";
        } catch {}
        update((st) => ({ crewAreas: { ...st.crewAreas, [areaKey(c.id)]: area } }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey]);
  const areaOf = (id: string) => state.crewAreas[areaKey(id)] || "Nearby";

  // Demo crew: friends join one at a time.
  const active = filling && joined < crew.length;
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      const step = Math.max(1, Math.ceil(crew.length / 10)); // big groups join in batches
      update((st) => ({ crewJoined: Math.min(st.crewJoined + step, crew.length) }));
    }, 650);
    return () => clearInterval(t);
  }, [active, crew.length]);

  // The link carries the group's details, so it works on a friend's phone with no account.
  const host = state.me.name || state.profile?.name || "";
  async function shareInvite() {
    const link = inviteUrl(window.location.origin, m, host, state.groupQuiz);
    try {
      if (navigator.share) {
        await navigator.share({ title: `${host || "A friend"} invited you to hang out`, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setMsg("Invite link copied. Paste it in your group chat.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // closed the share sheet
      setMsg("Couldn't copy here. Use Open the invite and copy the address bar.");
    }
  }

  function openInvite() {
    window.open(inviteUrl(window.location.origin, m, host, state.groupQuiz), "_blank", "noopener");
  }

  const next = big && !state.unlocked && !state.pass ? "/room/unlock" : "/room/ideas";

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>{m.name || "Waiting room"}</h1>
        <ul className={`${s.chips} ${styles.meta}`}>
          <li className={s.chip}>{purposeOf(m).label}</li>
          <li className={s.chip}>{rangeLabel(m.from, m.to)}</li>
          <li className={s.chip}>{m.people} people</li>
          <li className={s.chip}>{m.city}</li>
          <li className={big ? s.chipYellow : s.chip}>{big ? "Big plan" : "Free"}</li>
          {state.pass && <li className={s.chipYellow}>Pass extras on</li>}
        </ul>
      </div>

      <section className={styles.invite} aria-labelledby="invite-title">
        <h2 id="invite-title" className={styles.inviteLabel}>
          Invite link
        </h2>
        <p className={styles.link}>
          {purposeOf(m).label} · {m.city}
        </p>
        <button type="button" className={s.secondary} onClick={shareInvite}>
          <Icon name="share" size={18} />
          Share invite
        </button>
        <button type="button" className={s.textLink} onClick={openInvite}>
          Open the invite
          <span className="visually-hidden">(opens in a new tab)</span>
        </button>
        <p className={s.status} aria-live="polite">
          {msg}
        </p>
      </section>

      <section aria-labelledby="seats-title">
        <div className={styles.seatsHead}>
          <h2 id="seats-title" className={s.label}>
            Who&rsquo;s here
          </h2>
          <span className={styles.count} aria-live="polite">
            {inCount} of {m.people} in
          </span>
        </div>

        <ul className={s.list}>
          <li className={s.row}>
            <span className={state.joined ? s.avatarYou : s.avatarEmpty} aria-hidden="true">
              {(state.me.name || "Y")[0]}
            </span>
            <span className={s.grow}>
              {state.joined ? `${state.me.name || "You"} · ${state.me.area || "Nearby"}` : "You, host"}
              <span className={s.sub}>
                {state.joined ? "Host. Times and quiz done" : "Add your times and take the quiz"}
              </span>
            </span>
            {state.joined && <span className={s.chipYellow}>{PERSONALITIES[myType(state)].name}</span>}
          </li>
          {crew.map((c, i) => {
            const here = i < joined;
            return (
              <li key={c.id} className={`${s.row} ${here ? styles.arrived : ""}`}>
                <span className={here ? s.avatarJoined : s.avatarEmpty} aria-hidden="true">
                  {here ? c.name[0] : ""}
                </span>
                <span className={s.grow}>
                  {here ? `${c.name} · ${areaOf(c.id)}` : "Open seat"}
                  <span className={s.sub}>{here ? "Joined, added times, took the quiz" : "Waiting for someone to join"}</span>
                </span>
                {here && <span className={s.chip}>{PERSONALITIES[c.type].name}</span>}
              </li>
            );
          })}
        </ul>
      </section>

      {joined < crew.length && (
        <button
          type="button"
          className={styles.demoButton}
          onClick={() => setFilling(true)}
          disabled={active}
        >
          {active ? "Your demo crew is joining…" : "Try with a demo crew"}
        </button>
      )}

      {allIn && (
        <section className={s.cardYellow} aria-label="Group mix">
          <p className={styles.mixTitle}>Everyone&rsquo;s in. Your crew is:</p>
          <ul className={s.chips}>
            {groupMix(state).map((g) => (
              <li key={g.type} className={styles.mixChip}>
                {mixLabel(g.type, g.count)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {allIn && (
        <section aria-labelledby="map-title" className={styles.mapSection}>
          <h2 id="map-title" className={s.label}>
            Where everyone is, roughly
          </h2>
          <PlaceMap
            pins={[
              { id: "me", kind: "me", lat: myPoint(state)[0], lng: myPoint(state)[1], label: `${state.me.name || "You"} · ${state.me.area || "Nearby"}`, text: (state.me.name || "Y")[0] },
              ...crew.map((c) => {
                const [lat, lng] = crewPoint(m, c);
                return { id: c.id, kind: "person" as const, lat, lng, label: `${c.name} · ${areaOf(c.id)}`, text: c.name[0] };
              }),
            ]}
            midpoint={groupMidpoint(state)}
            label={`Map of everyone's rough area in ${m.city}, and the middle of the group`}
          />
        </section>
      )}

      <div className={s.actions}>
        {!state.joined ? (
          <Link href="/room/join" className={s.primary}>
            Add my times
          </Link>
        ) : allIn ? (
          <Link href={next} className={s.primary}>
            Start ideating
          </Link>
        ) : (
          <button type="button" className={s.primary} disabled>
            Waiting for {m.people - inCount} more
          </button>
        )}
      </div>
    </div>
  );
}
