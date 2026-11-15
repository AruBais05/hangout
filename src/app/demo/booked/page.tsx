"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { CREW, LIMITS } from "@/lib/config";
import { formatCents } from "@/lib/money";
import { BOOKED, googleCalendarUrl, icsFile, longDate } from "@/lib/plan";
import { useDemo } from "@/lib/store";
import styles from "./booked.module.css";

export default function Booked() {
  const [state] = useDemo();
  const limit = LIMITS.feeFreeBookingsPerMonth;

  function downloadIcs() {
    const blob = new Blob([icsFile(BOOKED)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hangout-bouldering.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className={s.screen}>
      <h1 className={s.bigTitle}>It&rsquo;s booked.</h1>

      <section className={styles.ticket} aria-labelledby="plan-title">
        <p className={styles.when}>{longDate(BOOKED.slot)}</p>
        <h2 id="plan-title" className={styles.planTitle}>
          {BOOKED.title}
        </h2>
        <p className={styles.where}>
          <Icon name="pin" size={18} />
          <span>
            {BOOKED.venue}
            <br />
            {BOOKED.address}
          </span>
        </p>
        <div className={styles.perf} aria-hidden="true" />
        <div className={styles.foot}>
          <span className={styles.faces} aria-label={`${CREW.length + 1} going`}>
            {[...CREW.map((m) => m.initial), "Y"].map((i, n) => (
              <span key={n} aria-hidden="true">
                {i}
              </span>
            ))}
          </span>
          <span>
            {state.paid ? `You paid ${formatCents(state.paid.totalCents)}` : "Your share is unpaid"}
          </span>
        </div>
      </section>

      {state.pass && (
        <p className={styles.counter}>
          <Icon name="star" size={16} />
          {Math.min(state.feeFreeUsed, limit)} of {limit} fee-free bookings used this month
        </p>
      )}

      <section aria-labelledby="cal-title" className={styles.cal}>
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
          Skip to hangout night
        </Link>
      </div>
    </div>
  );
}
