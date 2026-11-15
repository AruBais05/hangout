"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { PERSONALITIES, ROOM_CODE } from "@/lib/config";
import { crewOf, groupMix, isBig, meetingOf, mixLabel, personalityOf, purposeOf, rangeLabel } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./room.module.css";

export default function Room() {
  const [state] = useDemo();
  const m = meetingOf(state);
  const crew = crewOf(m);
  const joined = Math.min(state.crewJoined, crew.length);
  const [filling, setFilling] = useState(false);
  const [msg, setMsg] = useState("");
  const inCount = joined + (state.joined ? 1 : 0);
  const allIn = inCount === m.people;
  const big = isBig(m);

  // Demo crew: friends join one at a time.
  const active = filling && joined < crew.length;
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      update((st) => ({ crewJoined: Math.min(st.crewJoined + 1, crew.length) }));
    }, 650);
    return () => clearInterval(t);
  }, [active, crew.length]);

  async function copyInvite() {
    const link = `${window.location.origin}/join`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join my hangout", url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setMsg("Invite link copied.");
    } catch {
      setMsg(`Invite link: ${link}`);
    }
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
          <li className={big ? s.chipYellow : s.chip}>{big ? "Big plan" : "Free"}</li>
        </ul>
      </div>

      <section className={styles.invite} aria-labelledby="invite-title">
        <h2 id="invite-title" className={styles.inviteLabel}>
          Invite link
        </h2>
        <p className={styles.link}>hangout.app/join/{ROOM_CODE}</p>
        <button type="button" className={s.secondary} onClick={copyInvite}>
          <Icon name="share" size={18} />
          Share invite
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
              Y
            </span>
            <span className={s.grow}>
              You, host
              <span className={s.sub}>
                {state.joined ? "Times and quiz done" : "Add your times and take the quiz"}
              </span>
            </span>
            {state.joined && <span className={s.chipYellow}>{PERSONALITIES[personalityOf(state.quiz)].name}</span>}
          </li>
          {crew.map((c, i) => {
            const here = i < joined;
            return (
              <li key={c.id} className={`${s.row} ${here ? styles.arrived : ""}`}>
                <span className={here ? s.avatarJoined : s.avatarEmpty} aria-hidden="true">
                  {here ? c.name[0] : ""}
                </span>
                <span className={s.grow}>
                  {here ? c.name : "Open seat"}
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
