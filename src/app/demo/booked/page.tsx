"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { CREW, PLAN_WEEKEND, PRICES } from "@/lib/config";
import { formatCents, splitCost } from "@/lib/money";
import { BOOKED, GROUP_SIZE, googleCalendarUrl, icsFile, weekendLabel } from "@/lib/plan";
import { useDemo } from "@/lib/store";
import styles from "./booked.module.css";

export default function Booked() {
  const [state] = useDemo();
  const [copied, setCopied] = useState<string | null>(null);
  const unlockCents = state.pass ? 0 : PRICES.unlockCents;
  const split = splitCost(BOOKED.totalCents, unlockCents, GROUP_SIZE);

  function downloadIcs() {
    const blob = new Blob([icsFile(BOOKED)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hangout-weekend-away.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyLink(name: string, id: string) {
    const link = `https://hangout.app/settle/${id}-${split.eachCents}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(`Link for ${name} copied.`);
    } catch {
      setCopied(`Link for ${name}: ${link}`);
    }
  }

  return (
    <div className={s.screen}>
      <h1 className={s.bigTitle}>It&rsquo;s locked.</h1>

      <section className={styles.ticket} aria-labelledby="plan-title">
        <p className={styles.when}>{weekendLabel(PLAN_WEEKEND)}, 2 nights</p>
        <h2 id="plan-title" className={styles.planTitle}>
          {BOOKED.title}
        </h2>
        <p className={styles.where}>
          <Icon name="pin" size={18} />
          <span>
            {BOOKED.place}
            <br />
            {BOOKED.address}
          </span>
        </p>
        <div className={styles.perf} aria-hidden="true" />
        <div className={styles.foot}>
          <span className={styles.faces} aria-label={`${GROUP_SIZE} going`}>
            {[...CREW.map((m) => m.initial), "Y"].map((i, n) => (
              <span key={n} aria-hidden="true">
                {i}
              </span>
            ))}
          </span>
          <span>All {GROUP_SIZE} in</span>
        </div>
      </section>

      <p className={styles.direct}>
        You booked {BOOKED.place} directly and paid them {formatCents(BOOKED.totalCents)}. Hangout
        never holds the money.
      </p>

      <section className={s.cardOutline} aria-labelledby="split-title">
        <h2 id="split-title" className={s.sectionLabel}>
          Cost split
        </h2>
        <dl className={styles.bill}>
          <div>
            <dt>Stay, 2 nights</dt>
            <dd className={s.money}>{formatCents(split.stayCents)}</dd>
          </div>
          <div>
            <dt>Big Plan unlock</dt>
            <dd className={s.money}>
              {state.pass ? `${formatCents(0)} with Crew Pass` : formatCents(split.unlockCents)}
            </dd>
          </div>
          <div className={styles.total}>
            <dt>Each friend pays you</dt>
            <dd className={s.money}>{formatCents(split.eachCents)}</dd>
          </div>
        </dl>
        <p className={styles.summary}>
          Split {GROUP_SIZE} ways.
          {state.pass
            ? " The unlock is included in your Crew Pass."
            : ` The unlock adds ${formatCents(split.unlockEachCents)} each.`}{" "}
          Your share is {formatCents(split.organizerCents)}.
        </p>
      </section>

      <section aria-labelledby="settle-title">
        <h2 id="settle-title" className={s.sectionLabel}>
          Settle-up links
        </h2>
        <ul className={s.list}>
          {CREW.map((m) => (
            <li key={m.id} className={s.row}>
              <span className={s.avatar} aria-hidden="true">
                {m.initial}
              </span>
              <span className={s.grow}>
                {m.name}
                <span className={`${s.small} ${styles.block}`}>
                  Owes you {formatCents(split.eachCents)}
                </span>
              </span>
              <button type="button" className={styles.copy} onClick={() => copyLink(m.name, m.id)}>
                Copy link
              </button>
            </li>
          ))}
        </ul>
        <p className={s.status} aria-live="polite">
          {copied ?? ""}
        </p>
      </section>

      {BOOKED.partner && (
        <p className={s.small}>
          {BOOKED.place} is a Hangout partner. They pay us a small commission. Your price is the
          same.
        </p>
      )}

      <section aria-labelledby="cal-title">
        <h2 id="cal-title" className={s.sectionLabel}>
          Add to calendar
        </h2>
        <div className={styles.calButtons}>
          <a
            className={s.secondary}
            href={googleCalendarUrl(BOOKED)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="calendar" size={18} />
            Google Calendar
            <span className="visually-hidden">(opens in a new tab)</span>
          </a>
          <button type="button" className={s.secondary} onClick={downloadIcs}>
            <Icon name="download" size={18} />
            Download .ics
          </button>
        </div>
      </section>

      <div className={s.actions}>
        <Link href="/demo/checkin" className={s.primary}>
          Skip to the weekend
        </Link>
      </div>
    </div>
  );
}
