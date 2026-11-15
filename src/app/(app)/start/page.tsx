"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CityField from "@/components/CityField";
import { cleanHandle } from "@/lib/split";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { DEFAULT_MEETING, DEMO_QUIZ, MAX_DAYS, PEOPLE, PRICES, PURPOSES, type GroupQuiz, type PurposeId, type Vibe } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { bigReasons, days, isBig, meetingOf } from "@/lib/plan";
import { newMeeting, update, useDemo } from "@/lib/store";
import styles from "./start.module.css";

export default function Start() {
  const router = useRouter();
  const [state] = useDemo();
  const [purpose, setPurpose] = useState<PurposeId>(DEFAULT_MEETING.purpose);
  const [vibe, setVibe] = useState<Vibe>(DEFAULT_MEETING.vibe);
  const [from, setFrom] = useState(DEFAULT_MEETING.from);
  const [to, setTo] = useState(DEFAULT_MEETING.to);
  const [people, setPeople] = useState(DEFAULT_MEETING.people);
  const [name, setName] = useState("");
  const [venmo, setVenmo] = useState<string | null>(null);
  const venmoValue = venmo ?? state.venmoHandle;

  const span = from && to ? days(from, to).length : 0;
  const dateError = !from || !to
    ? "Pick a start and an end date."
    : to < from
      ? "The end date is before the start date."
      : span > MAX_DAYS
        ? `Pick ${MAX_DAYS} days or fewer.`
        : "";
  // Starts from the last city used; "Change city" (or the host's map pin later) moves everything.
  const saved = meetingOf(state);
  const [picked, setPicked] = useState<{ name: string; center: [number, number] } | null>(null);
  const city = picked?.name ?? saved.city;
  const center = picked?.center ?? saved.center;
  const meeting = { purpose, from, to, people, name, vibe, city, center };
  const big = isBig(meeting);

  function next() {
    if (dateError) return;
    // The demo quiz is ready at once, so nobody waits. The AI writes this group's quiz in the
    // background, once; everyone who joins gets the same questions.
    const demo: GroupQuiz = { source: "demo", questions: DEMO_QUIZ };
    newMeeting(meeting, demo, cleanHandle(venmoValue));
    fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose, vibe, city }),
    })
      .then((r) => r.json())
      .then((q: GroupQuiz) => {
        if (q?.questions?.length) update((st) => (st.joined ? {} : { groupQuiz: q }));
      })
      .catch(() => {});
    // Big plans pay first (unlock or Crew Pass), then set up the crew.
    router.push(isBig(meeting) && !state.pass ? "/room/unlock" : "/start/people");
  }

  return (
    <div className={s.screen}>
      <h1 className={s.title}>Start a hangout</h1>

      <fieldset className={styles.group}>
        <legend className={s.label}>What&rsquo;s it for?</legend>
        <div className={styles.purposes}>
          {PURPOSES.map((p) => (
            <label key={p.id} className={styles.tile}>
              <input
                type="radio"
                name="purpose"
                checked={purpose === p.id}
                onChange={() => {
                  setPurpose(p.id);
                  setVibe(p.vibe);
                }}
              />
              <span>
                <strong>{p.label}</strong>
                <span className={s.sub}>{p.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.group}>
        <span className={s.label}>Where?</span>
        <CityField value={city} onChange={setPicked} />
      </div>

      <fieldset className={styles.group}>
        <legend className={s.label}>What&rsquo;s the vibe?</legend>
        <div className={styles.vibes}>
          {(
            [
              { id: "active", label: "Active", hint: "Moving, doing, exploring" },
              { id: "chill", label: "Chill", hint: "Sit down, talk, relax" },
            ] as const
          ).map((v) => (
            <label key={v.id} className={styles.tile}>
              <input type="radio" name="vibe" checked={vibe === v.id} onChange={() => setVibe(v.id)} />
              <span>
                <strong>{v.label}</strong>
                <span className={s.sub}>{v.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={s.split}>
        <fieldset className={styles.group}>
          <legend className={s.label}>When could it happen?</legend>
          <div className={styles.dates}>
            <label className={styles.field}>
              <span>From</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-describedby="date-hint" />
            </label>
            <label className={styles.field}>
              <span>To</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-describedby="date-hint" />
            </label>
          </div>
          <p id="date-hint" className={dateError ? styles.error : s.small} role={dateError ? "alert" : undefined}>
            {dateError || `${span} days to pick from. Everyone marks when they're free.`}
          </p>
        </fieldset>

        <div>
          <span className={s.label} id="people-label">
            How many people, with you?
          </span>
          <div className={styles.stepper} role="group" aria-labelledby="people-label">
            <button
              type="button"
              aria-label="Fewer people"
              onClick={() => setPeople((n) => Math.max(PEOPLE.min, n - 1))}
              disabled={people <= PEOPLE.min}
            >
              −
            </button>
            <output aria-live="polite" className={s.money}>
              {people}
            </output>
            <button
              type="button"
              aria-label="More people"
              onClick={() => setPeople((n) => Math.min(PEOPLE.max, n + 1))}
              disabled={people >= PEOPLE.max}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <label className={styles.field}>
        <span>Name it (optional)</span>
        <input
          type="text"
          value={name}
          maxLength={40}
          placeholder="e.g. Saturday crew"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Your Venmo (optional)</span>
        <input
          type="text"
          value={venmoValue}
          maxLength={31}
          placeholder="@username, so friends can pay you back"
          autoComplete="off"
          onChange={(e) => setVenmo(e.target.value)}
        />
      </label>

      <p className={big ? styles.noteBig : styles.noteFree} aria-live="polite">
        <Icon name={big ? "star" : "check"} size={18} />
        <span>
          {big ? (
            <>
              <strong>Big plan</strong> ({bigReasons(meeting).join(", ")}): {formatPrice(PRICES.unlockCents)} to
              unlock once, or free with Crew Pass.
            </>
          ) : (
            <>
              <strong>Everyday plan: free.</strong> No fees.
            </>
          )}
        </span>
      </p>

      <div className={s.actions}>
        <button type="button" className={s.primary} onClick={next} disabled={!!dateError}>
          {big && !state.pass ? `Next: unlock for ${formatPrice(PRICES.unlockCents)}` : "Next"}
        </button>
      </div>
    </div>
  );
}
