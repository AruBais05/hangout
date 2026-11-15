"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import LocationPicker, { type Picked } from "@/components/LocationPicker";
import { BUDGET_RANGES, DEAL_BREAKERS, PEOPLE, PERSONALITIES, SLOTS, SLOT_HOURS, TRAVEL_MINUTES, type QuizQuestion, type TravelMinutes } from "@/lib/config";
import { calendarBusy, cellKey, dayLabel, days, meetingOf, personalityOf, purposeOf, quizOf } from "@/lib/plan";
import { update, useDemo, type CellState, type Me } from "@/lib/store";
import s from "./screen.module.css";
import styles from "./JoinFlow.module.css";

// Fixed questions (ours, never the AI's): name, location + travel, budget, deal-breakers.
// Then the group's 5 personality questions (AI-written when available, the same for everyone).
const FIXED = ["name", "where", "budget", "deal"] as const;
type Fixed = (typeof FIXED)[number];
type Step = { kind: "times" } | { kind: "fixed"; id: Fixed } | { kind: "q"; i: number } | { kind: "result" };

/** Waits for saved demo state, so a returning user's answers are filled in. */
export default function JoinFlow({ guest = false }: { guest?: boolean }) {
  const [state, ready] = useDemo();
  if (!ready) return <div className={s.screen} aria-busy="true" />;
  // An invite can't add a 51st person, or anyone once every seat is taken.
  const m = meetingOf(state);
  const taken = state.crewJoined + (state.joined ? 1 : 0);
  if (guest && state.meeting && taken >= Math.min(m.people, PEOPLE.max)) {
    return (
      <div className={s.screen}>
        <h1 className={s.title}>This hangout is full</h1>
        <p className={s.lede}>
          All {m.people} seats are taken. Ask the host to start a new hangout{m.people >= PEOPLE.max ? ` (max ${PEOPLE.max} people)` : ""}.
        </p>
        <div className={s.actions}>
          <Link href="/" className={s.primary}>
            Back to Hangout
          </Link>
        </div>
      </div>
    );
  }
  return <Flow guest={guest} />;
}

function Flow({ guest }: { guest: boolean }) {
  const router = useRouter();
  const [state] = useDemo();
  const m = meetingOf(state);
  const dayList = days(m.from, m.to);
  // Locked when the personality part starts, so a late AI quiz can't swap questions mid-way.
  const [locked, setLocked] = useState<QuizQuestion[] | null>(null);
  const questions = locked ?? quizOf(state);
  const aiWritten = state.groupQuiz?.source === "ai";

  const [step, setStep] = useState<Step>({ kind: "times" });
  const [cells, setCells] = useState<Record<string, CellState>>({});
  const [calCells, setCalCells] = useState<string[]>([]);
  const [busyLabels, setBusyLabels] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [me, setMe] = useState<Me>(state.me);
  const [city, setCity] = useState<{ name: string; center: [number, number] }>({ name: m.city, center: m.center });

  const total = FIXED.length + questions.length;
  const position = step.kind === "fixed" ? FIXED.indexOf(step.id) : step.kind === "q" ? FIXED.length + step.i : 0;
  const freeCount = Object.values(cells).filter((v) => v === "free").length;
  const firstName = me.name.trim();

  function toggle(key: string) {
    setCells((c) => {
      const next = { ...c };
      if (c[key] === "free") delete next[key];
      else next[key] = "free";
      return next;
    });
    // Once you edit a cell it's yours, so "Disconnect" leaves it alone.
    setCalCells((list) => list.filter((k) => k !== key));
  }

  function connect() {
    const busy = calendarBusy(dayList);
    const next = { ...cells };
    const touched: string[] = [];
    for (const d of dayList) {
      for (const slot of SLOTS) {
        const k = cellKey(d, slot);
        if (busy[k]) {
          next[k] = "busy";
          touched.push(k);
        } else if (!next[k]) {
          next[k] = "free";
          touched.push(k);
        }
      }
    }
    setCells(next);
    setCalCells(touched);
    setBusyLabels(busy);
    setConnected(true);
  }

  function disconnect() {
    setCells((c) => {
      const next = { ...c };
      for (const k of calCells) delete next[k];
      return next;
    });
    setCalCells([]);
    setConnected(false);
  }

  function go(next: Step) {
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  function nextFrom(id: Fixed) {
    const i = FIXED.indexOf(id);
    if (i + 1 >= FIXED.length) setLocked(quizOf(state));
    go(i + 1 < FIXED.length ? { kind: "fixed", id: FIXED[i + 1] } : { kind: "q", i: 0 });
  }

  function back() {
    if (step.kind === "fixed") {
      const i = FIXED.indexOf(step.id);
      go(i === 0 ? { kind: "times" } : { kind: "fixed", id: FIXED[i - 1] });
    } else if (step.kind === "q") {
      go(step.i === 0 ? { kind: "fixed", id: FIXED[FIXED.length - 1] } : { kind: "q", i: step.i - 1 });
    }
  }

  function picked(p: Picked) {
    setMe((x) => ({ ...x, point: p.point, area: p.area || p.city || "Nearby" }));
    // The host's pin sets the group's city right away; the demo crew and plans move with it.
    if (!guest && p.city) {
      setCity({ name: p.city, center: p.point });
      update((st) => (st.meeting ? { meeting: { ...st.meeting, city: p.city, center: p.point } } : {}));
    }
  }

  function answer(qi: number, ai: number) {
    setAnswers((a) => ({ ...a, [qi]: ai }));
    setTimeout(() => {
      if (qi + 1 < questions.length) go({ kind: "q", i: qi + 1 });
      else finish({ ...answers, [qi]: ai });
    }, 220);
  }

  function finish(final: Record<number, number>) {
    if (!guest) {
      update({
        cells,
        calCells,
        calConnected: connected,
        answers: final,
        me: { ...me, name: firstName.slice(0, 20) },
        meeting: { ...m, city: city.name, center: city.center },
        joined: true,
      });
    }
    go({ kind: "result" });
  }

  const progress = (
    <div className={styles.quizHead}>
      <span className={s.small}>
        Question {position + 1} of {total}
      </span>
      <span className={styles.dots} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i <= position ? styles.dotOn : styles.dot} />
        ))}
      </span>
    </div>
  );

  const backLink = (
    <button type="button" className={s.textLink} onClick={back}>
      Back
    </button>
  );

  /* ---------- result ---------- */
  if (step.kind === "result") {
    const type = PERSONALITIES[personalityOf(answers, questions)];
    return (
      <div className={s.screen}>
        <section className={styles.result} role="status">
          <p className={styles.resultKicker}>{firstName ? `${firstName}, you're a` : "You're a"}</p>
          <p className={styles.resultName}>{type.name}</p>
          <p className={styles.resultLine}>{type.line}</p>
        </section>
        <p className={s.small}>
          Others see you as <strong>{firstName || "You"} · {me.area || "Nearby"}</strong>. Never your exact address.
        </p>
        <p className={s.lede}>
          {guest
            ? "You're in. The host will share the plan when everyone has joined."
            : "Your times and answers are saved. Your budget stays private."}
        </p>
        <div className={s.actions}>
          {guest ? (
            <Link href="/" className={s.primary}>
              Done
            </Link>
          ) : (
            <button type="button" className={s.primary} onClick={() => router.push("/room")}>
              Back to the waiting room
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ---------- personality questions ---------- */
  if (step.kind === "q") {
    const q = questions[step.i];
    return (
      <div className={s.screen}>
        {progress}
        <fieldset className={styles.quiz} key={`q${step.i}`}>
          <legend className={s.title}>{q.text}</legend>
          {aiWritten && (
            <p className={`${s.small} ${styles.private}`}>
              <Icon name="sparkle" size={16} />
              Questions written by AI for this group
            </p>
          )}
          <div className={styles.answers}>
            {q.answers.map((a, ai) => (
              <label key={a.text} className={styles.answer}>
                <input type="radio" name={`q${step.i}`} checked={answers[step.i] === ai} onChange={() => answer(step.i, ai)} />
                <span>{a.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={s.actions}>
          <p className={s.small}>Tap an answer to continue.</p>
          {backLink}
        </div>
      </div>
    );
  }

  /* ---------- fixed questions ---------- */
  if (step.kind === "fixed" && step.id === "name") {
    return (
      <form className={s.screen} onSubmit={(e) => { e.preventDefault(); if (firstName) nextFrom("name"); }}>
        {progress}
        <label className={styles.field}>
          <span className={s.title}>What&rsquo;s your first name?</span>
          <input
            type="text"
            value={me.name}
            maxLength={20}
            autoComplete="given-name"
            autoFocus
            onChange={(e) => setMe((x) => ({ ...x, name: e.target.value.replace(/[\r\n]/g, "") }))}
          />
        </label>
        <p className={s.small}>Friends see this name on the plan. Up to 20 letters.</p>
        <div className={s.actions}>
          <button type="submit" className={s.primary} disabled={!firstName}>
            Next
          </button>
          {backLink}
        </div>
      </form>
    );
  }

  if (step.kind === "fixed" && step.id === "where") {
    return (
      <div className={s.screen}>
        {progress}
        <div>
          <h1 className={s.title}>Where are you coming from?</h1>
          <p className={s.lede} style={{ marginTop: 8 }}>
            Your rough area helps pick a place that&rsquo;s fair for everyone.
          </p>
        </div>
        <LocationPicker center={city.center} city={city.name} value={me.point} onPick={picked} />
        <p className={styles.cityLine}>
          <Icon name="pin" size={16} />
          <span>
            City: <strong>{city.name}</strong>
            {me.area ? <> · You: {me.area}</> : null}
          </span>
        </p>
        <fieldset className={styles.quiz}>
          <legend className={s.label}>How far will you travel?</legend>
          <div className={styles.chipsRow}>
            {TRAVEL_MINUTES.map((t) => (
              <label key={t} className={styles.answer}>
                <input type="radio" name="travel" checked={me.travel === t} onChange={() => setMe((x) => ({ ...x, travel: t as TravelMinutes }))} />
                <span>{t} min</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={s.actions}>
          <button type="button" className={s.primary} onClick={() => nextFrom("where")}>
            {me.point ? "Next" : "Skip, use the city center"}
          </button>
          {backLink}
        </div>
      </div>
    );
  }

  if (step.kind === "fixed" && step.id === "budget") {
    return (
      <div className={s.screen}>
        {progress}
        <fieldset className={styles.quiz}>
          <legend className={s.title}>What can you spend, per person?</legend>
          <p className={`${s.small} ${styles.private}`}>
            <Icon name="lock" size={16} />
            Only you see this. The group only sees what works for everyone.
          </p>
          <div className={styles.answers}>
            {BUDGET_RANGES.map((b) => (
              <label key={b.id} className={styles.answer}>
                <input
                  type="radio"
                  name="budget"
                  checked={me.budget === b.id}
                  onChange={() => {
                    setMe((x) => ({ ...x, budget: b.id }));
                    setTimeout(() => nextFrom("budget"), 220);
                  }}
                />
                <span>{b.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={s.actions}>
          <p className={s.small}>Tap an answer to continue.</p>
          {backLink}
        </div>
      </div>
    );
  }

  if (step.kind === "fixed" && step.id === "deal") {
    const pickedList = me.dealBreakers;
    const flip = (label: string) =>
      setMe((x) => {
        if (label === "None") return { ...x, dealBreakers: ["None"] };
        const cur = x.dealBreakers.filter((d) => d !== "None");
        return { ...x, dealBreakers: cur.includes(label) ? cur.filter((d) => d !== label) : [...cur, label] };
      });
    return (
      <div className={s.screen}>
        {progress}
        <fieldset className={styles.quiz}>
          <legend className={s.title}>Any deal-breakers?</legend>
          <p className={s.small}>Pick all that apply.</p>
          <div className={styles.answers}>
            {DEAL_BREAKERS.map((d) => (
              <label key={d} className={styles.answer}>
                <input type="checkbox" checked={pickedList.includes(d)} onChange={() => flip(d)} />
                <span>{d}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={s.actions}>
          <button type="button" className={s.primary} disabled={pickedList.length === 0} onClick={() => nextFrom("deal")}>
            Next
          </button>
          {backLink}
        </div>
      </div>
    );
  }

  /* ---------- times ---------- */
  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>{guest ? "You're invited" : "When are you free?"}</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          {guest
            ? `${purposeOf(m).label} in ${m.city}. Tap the times you're free, then take a 1-minute quiz.`
            : "Tap every time that works. You can change any cell."}
        </p>
      </div>

      <div className={styles.calRow}>
        {connected ? (
          <div className={styles.sheet} role="status">
            <Icon name="calendar" size={20} />
            <span className={s.grow}>
              <strong>Demo calendar connected · sample week</strong>
              <span className={s.sub}>Busy times are filled in. Everything else is marked free.</span>
            </span>
            <button type="button" className={s.textLink} onClick={disconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <button type="button" className={s.secondary} onClick={connect}>
            <Icon name="calendar" size={18} />
            Connect calendar (demo)
          </button>
        )}
        {!connected && <p className={s.small}>Demo only: fills in a sample work week. No sign-in.</p>}
      </div>

      <div className={styles.grid} role="group" aria-label="Your free times">
        <span aria-hidden="true" />
        {SLOTS.map((slot) => (
          <span key={slot} className={styles.head} aria-hidden="true">
            {slot}
            <span className={styles.hours}>{SLOT_HOURS[slot].label}</span>
          </span>
        ))}
        {dayList.map((d, di) => (
          <div key={d} className={styles.gridRow} role="presentation">
            <span className={styles.day} aria-hidden="true">
              {dayLabel(d)}
            </span>
            {SLOTS.map((slot, si) => {
              const k = cellKey(d, slot);
              const st = cells[k];
              const label = st === "busy" ? busyLabels[k] ?? "Busy" : st === "free" ? "Free" : "";
              return (
                <button
                  key={k}
                  type="button"
                  className={`${styles.cell} ${st ? styles[st] : ""} ${calCells.includes(k) ? styles.fromCal : ""}`}
                  style={{ "--d": `${(di * 3 + si) * 35}ms` } as React.CSSProperties}
                  aria-pressed={st === "free"}
                  aria-label={`${dayLabel(d, "long")} ${slot}: ${st === "busy" ? `busy, ${label}` : st === "free" ? "free" : "not set"}`}
                  onClick={() => toggle(k)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className={s.actions}>
        <button
          type="button"
          className={s.primary}
          disabled={freeCount === 0}
          onClick={() => go({ kind: "fixed", id: "name" })}
        >
          Next: quick quiz
        </button>
        <p className={s.small} aria-live="polite">
          {freeCount === 0
              ? "Tap at least one free time."
              : `${freeCount} free time${freeCount > 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  );
}
