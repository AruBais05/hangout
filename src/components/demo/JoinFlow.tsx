"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import { BUDGETS, PERSONALITIES, QUIZ, SLOTS, SLOT_HOURS } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { budgetKind, calendarBusy, cellKey, dayLabel, days, meetingOf, personalityOf, purposeOf } from "@/lib/plan";
import { update, useDemo, type CellState } from "@/lib/store";
import s from "./screen.module.css";
import styles from "./JoinFlow.module.css";

type Step = { kind: "times" } | { kind: "q"; i: number } | { kind: "result" };

const BUDGET_ID = "budget";

export default function JoinFlow({ guest = false }: { guest?: boolean }) {
  const router = useRouter();
  const [state] = useDemo();
  const m = meetingOf(state);
  const dayList = days(m.from, m.to);
  const kind = budgetKind(m);

  const [step, setStep] = useState<Step>({ kind: "times" });
  const [name, setName] = useState("");
  const [cells, setCells] = useState<Record<string, CellState>>({});
  const [calCells, setCalCells] = useState<string[]>([]);
  const [busyLabels, setBusyLabels] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState(false);
  const [quiz, setQuiz] = useState<Record<string, string[]>>({});
  const [budget, setBudget] = useState<number | null>(null);

  // The quiz: three personality questions, a private budget, then two preferences.
  const questions = [
    QUIZ[0],
    QUIZ[1],
    QUIZ[2],
    {
      id: BUDGET_ID,
      q: "What can you spend?",
      options: BUDGETS[kind].map((b, i, all) => ({
        label: i === all.length - 1 ? `${formatPrice(b)}+` : `Up to ${formatPrice(b)}`,
      })),
    },
    QUIZ[3],
    QUIZ[4],
  ];

  const freeCount = Object.values(cells).filter((v) => v === "free").length;

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

  function choose(qi: number, label: string, multi?: boolean) {
    const q = questions[qi];
    if (q.id === BUDGET_ID) {
      setBudget(BUDGETS[kind][q.options.findIndex((o) => o.label === label)]);
      setQuiz((z) => ({ ...z, [q.id]: [label] }));
    } else if (multi) {
      setQuiz((z) => {
        const cur = z[q.id] ?? [];
        if (label === "None") return { ...z, [q.id]: ["None"] };
        const without = cur.filter((x) => x !== "None");
        return {
          ...z,
          [q.id]: without.includes(label) ? without.filter((x) => x !== label) : [...without, label],
        };
      });
      return;
    } else {
      setQuiz((z) => ({ ...z, [q.id]: [label] }));
    }
    setTimeout(() => advance(qi), 220);
  }

  function advance(qi: number) {
    if (qi + 1 < questions.length) setStep({ kind: "q", i: qi + 1 });
    else finish();
  }

  function finish() {
    if (!guest) {
      update({ cells, calCells, calConnected: connected, quiz, budgetCents: budget, joined: true });
    }
    setStep({ kind: "result" });
  }

  /* ---------- result ---------- */
  if (step.kind === "result") {
    const type = PERSONALITIES[personalityOf(quiz)];
    return (
      <div className={s.screen}>
        <section className={styles.result} role="status">
          <p className={styles.resultKicker}>You&rsquo;re</p>
          <p className={styles.resultName}>{type.name}</p>
          <p className={styles.resultLine}>{type.line}</p>
        </section>
        <p className={s.lede}>
          {guest
            ? `You're in${name ? `, ${name}` : ""}. Your times are saved. The host will share the plan when everyone has joined.`
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

  /* ---------- quiz ---------- */
  if (step.kind === "q") {
    const q = questions[step.i];
    const picked = quiz[q.id] ?? [];
    const multi = "multi" in q && q.multi;
    return (
      <div className={s.screen}>
        <div className={styles.quizHead}>
          <span className={s.small}>
            Question {step.i + 1} of {questions.length}
          </span>
          <span className={styles.dots} aria-hidden="true">
            {questions.map((_, i) => (
              <span key={i} className={i <= step.i ? styles.dotOn : styles.dot} />
            ))}
          </span>
        </div>
        <fieldset className={styles.quiz} key={q.id}>
          <legend className={s.title}>{q.q}</legend>
          {q.id === BUDGET_ID && (
            <p className={`${s.small} ${styles.private}`}>
              <Icon name="lock" size={16} />
              Only you see this. The group only sees what works for everyone.
            </p>
          )}
          <div className={styles.answers}>
            {q.options.map((o) => (
              <label key={o.label} className={styles.answer}>
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={q.id}
                  checked={picked.includes(o.label)}
                  onChange={() => choose(step.i, o.label, !!multi)}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={s.actions}>
          {multi ? (
            <button
              type="button"
              className={s.primary}
              disabled={picked.length === 0}
              onClick={() => advance(step.i)}
            >
              {step.i + 1 === questions.length ? "Finish" : "Next"}
            </button>
          ) : (
            <p className={s.small}>Tap an answer to continue.</p>
          )}
          <button
            type="button"
            className={s.textLink}
            onClick={() => setStep(step.i === 0 ? { kind: "times" } : { kind: "q", i: step.i - 1 })}
          >
            Back
          </button>
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
            ? `${purposeOf(m).label}. Add your name, tap the times you're free, then take a 1-minute quiz.`
            : "Tap every time that works. You can change any cell."}
        </p>
      </div>

      {guest && (
        <label className={styles.field}>
          <span>Your name</span>
          <input type="text" value={name} maxLength={30} autoComplete="given-name" onChange={(e) => setName(e.target.value)} />
        </label>
      )}

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
          disabled={freeCount === 0 || (guest && !name.trim())}
          onClick={() => setStep({ kind: "q", i: 0 })}
        >
          Next: quick quiz
        </button>
        <p className={s.small} aria-live="polite">
          {guest && !name.trim()
            ? "Add your name to continue."
            : freeCount === 0
              ? "Tap at least one free time."
              : `${freeCount} free time${freeCount > 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  );
}
