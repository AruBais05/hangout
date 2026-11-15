"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { PRICES } from "@/lib/config";
import { formatCents, splitCost } from "@/lib/money";
import { crewOf, downloadIcs, googleCalendarUrl, isBig, meetingOf, rankIdeas, winnerOf } from "@/lib/plan";
import { useDemo } from "@/lib/store";
import styles from "./plan.module.css";

export default function Plan() {
  const [state] = useDemo();
  const m = meetingOf(state);
  const crew = crewOf(m);
  const big = isBig(m);
  const idea = winnerOf(state, rankIdeas(state));
  const venueCents = idea.eachCents * m.people;
  const unlockCents = big && !state.pass ? PRICES.unlockCents : 0;
  const split = splitCost(venueCents, unlockCents, m.people);
  const [msg, setMsg] = useState("");

  async function copyLinks() {
    const lines = crew.map((c) => `${c.name}: https://hangout.app/settle/${c.id}-${split.eachCents}`).join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      setMsg(`${crew.length} settle-up links copied.`);
    } catch {
      setMsg("Copy didn't work here. Links are sent in the group chat.");
    }
  }

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
          {idea.place}, {idea.area}
        </p>
        <p className={styles.going}>{m.people} going</p>
      </section>

      {big ? (
        <div className={s.split}>
          <section className={styles.bill} aria-labelledby="split-title">
            <h2 id="split-title" className="visually-hidden">
              Cost split
            </h2>
            <dl>
              <div>
                <dt>
                  {idea.title}, {m.people} people
                </dt>
                <dd className={s.money}>{formatCents(venueCents)}</dd>
              </div>
              <div>
                <dt>Big Plan unlock</dt>
                <dd className={s.money}>{state.pass ? "$0.00 with Crew Pass" : formatCents(unlockCents)}</dd>
              </div>
              <div className={styles.total}>
                <dt>Each friend pays you</dt>
                <dd className={s.money}>{formatCents(split.eachCents)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="settle-title">
            <h2 id="settle-title" className={styles.settleTitle}>
              You booked {idea.place} directly. Everyone pays you back. Hangout never holds the money.
            </h2>
            <ul className={styles.people}>
              {crew.map((c, i) => {
                const paid = i < 2;
                return (
                  <li key={c.id}>
                    <span className={paid ? styles.paid : styles.waiting} aria-hidden="true">
                      {c.name[0]}
                    </span>
                    <span className={paid ? styles.paidLabel : s.small}>{paid ? "Paid" : "Waiting"}</span>
                    <span className="visually-hidden">
                      {c.name}: {paid ? "paid you back" : "hasn't paid yet"}
                    </span>
                  </li>
                );
              })}
              <li>
                <span className={styles.you} aria-hidden="true">
                  Y
                </span>
                <span className={styles.paidLabel}>Booked</span>
                <span className="visually-hidden">You booked and paid the venue</span>
              </li>
            </ul>
            <button type="button" className={s.secondary} onClick={copyLinks}>
              <Icon name="share" size={18} />
              Copy settle-up links
            </button>
            <p className={s.status} aria-live="polite">
              {msg}
            </p>
          </section>
        </div>
      ) : (
        <p className={styles.freeNote}>
          <Icon name="check" size={18} />
          <span>
            <strong>Free plan.</strong>{" "}
            {idea.eachCents === 0
              ? "This one costs nothing."
              : `Everyone pays the venue on the day, about ${formatCents(idea.eachCents)} each.`}{" "}
            Hangout never charges for everyday hangouts.
          </span>
        </p>
      )}

      {idea.partner && (
        <p className={s.small}>
          {idea.place} is a Hangout partner. They pay us a small commission. Your price is the same.
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
