"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import MapLinks from "@/components/MapLinks";
import s from "@/components/demo/screen.module.css";
import { AI } from "@/lib/config";
import { eventsSearchUrl } from "@/lib/maps";
import { formatCents, formatPrice } from "@/lib/money";
import { dayLabel, isBig, meetingOf, myName, rankIdeas, suggestInput, workableRange } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import { inputKey, planCount, samplePlans, type SuggestInput, type SuggestResult } from "@/lib/suggest";
import styles from "./ideas.module.css";

const VOTE_SECONDS = 90;
const LOCAL_PREFIX = "hangout-plans:";

function readLocal(key: string): SuggestResult | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_PREFIX + key);
    return raw ? (JSON.parse(raw) as SuggestResult) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, result: SuggestResult) {
  try {
    window.localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(result));
  } catch {
    // Storage blocked: the server cache still helps.
  }
}

/** Asks the server for plans. Any failure or a slow answer gives sample plans, never an error. */
async function fetchPlans(input: SuggestInput, fresh: boolean): Promise<SuggestResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI.timeoutMs); // skeleton for at most 8 seconds
  try {
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, fresh }),
      signal: ctrl.signal,
    });
    const data = (await res.json()) as SuggestResult;
    if (!res.ok || !Array.isArray(data.plans) || data.plans.length === 0) throw new Error("bad");
    return data;
  } catch {
    const count = planCount(input.hasPass);
    return { source: "sample", plans: samplePlans(input, count), budgetCents: 0, count, events: [] };
  } finally {
    clearTimeout(timer);
  }
}

export default function Ideas() {
  const router = useRouter();
  const [state, ready] = useDemo();
  const m = meetingOf(state);
  const big = isBig(m);
  const input = suggestInput(state);
  const key = inputKey(input);
  const loaded = state.suggest?.key === key ? state.suggest.result : null;
  const ideas = rankIdeas(state);
  const range = workableRange(state);
  const me = myName(state);
  const [pick, setPick] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const chosen = ideas.some((i) => i.id === (pick ?? state.myVote)) ? (pick ?? state.myVote) : null;
  const locked = big && !state.unlocked && !state.pass;

  // Load plans for these inputs: browser cache first (a refresh never calls again), then the server.
  const inflight = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || locked || loaded || inflight.current === key) return;
    inflight.current = key;
    const cached = readLocal(key);
    const job = cached ? Promise.resolve({ ...cached, source: "cache" as const }) : fetchPlans(input, false);
    job.then((result) => {
      if (result.source !== "sample") writeLocal(key, result);
      update({ suggest: { key, result } });
      inflight.current = null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, locked, loaded, key]);

  async function newIdeas() {
    setRefreshing(true);
    setPick(null);
    const result = await fetchPlans(input, true);
    if (result.source !== "sample") writeLocal(key, result);
    update({ suggest: { key, result }, myVote: null });
    setRefreshing(false);
  }

  if (locked) {
    return (
      <div className={s.screen}>
        <h1 className={s.title}>Unlock this plan first</h1>
        <p className={s.lede}>Big plans need the one-time unlock or a Crew Pass.</p>
        <div className={s.actions}>
          <Link href="/room/unlock" className={s.primary}>
            Go to unlock
          </Link>
        </div>
      </div>
    );
  }

  function vote() {
    update({ myVote: chosen, votingEnded: false, voteEndsAt: Date.now() + VOTE_SECONDS * 1000 });
    router.push("/room/vote");
  }

  const waiting = !loaded || refreshing;
  const isAi = loaded && loaded.source !== "sample";

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>
          {waiting ? "Planning for your crew…" : `${ideas.length} ideas for your crew`}
        </h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          {dayLabel(input.date, "long")}, {m.city}. Pick your favorite.
        </p>
      </div>

      {big && (
        <section className={s.cardInk} aria-labelledby="range-title">
          <p id="range-title" className={styles.rangeLabel}>
            <Icon name="lock" size={16} />
            Private budget match
          </p>
          <p className={styles.rangeValue}>
            {formatPrice(range.low)}–{formatPrice(range.high)} a person
          </p>
          <p className={styles.rangeNote}>Works for all {m.people} of you. Nobody&rsquo;s number is shown.</p>
        </section>
      )}

      {waiting ? (
        <div className={styles.ideas} aria-busy="true" aria-label="Planning for your crew">
          {Array.from({ length: planCount(input.hasPass) }, (_, i) => (
            <div key={i} className={styles.skeleton} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className={styles.source}>
            {isAi ? (
              <>
                <Icon name="sparkle" size={16} />
                Suggested by AI. Check details before you go.
              </>
            ) : (
              <>
                Sample plans.{" "}
                <button type="button" className={s.textLink} onClick={newIdeas}>
                  Try again
                </button>
              </>
            )}
          </p>

          <fieldset className={styles.ideas}>
            <legend className="visually-hidden">Your vote</legend>
            {ideas.map((idea, i) => (
              <div key={idea.id} className={styles.card}>
                <label className={styles.idea}>
                  <input type="radio" name="vote" checked={chosen === idea.id} onChange={() => setPick(idea.id)} />
                  <span className={styles.box}>
                    <span className={styles.top}>
                      <span className={styles.rank} aria-label={`Rank ${i + 1}`}>
                        {i + 1}
                      </span>
                      <span className={s.grow}>
                        <span className={styles.name}>{idea.title}</span>
                        <span className={s.sub}>
                          {idea.startTime} · {idea.neighborhood}
                        </span>
                      </span>
                      <span className={`${styles.price} ${s.money}`}>
                        {idea.eachCents === 0 ? "Free" : formatCents(idea.eachCents)}
                        {idea.eachCents > 0 && <span className={s.small}>each</span>}
                      </span>
                    </span>
                    <span className={styles.summary}>{idea.summary}</span>
                    <span className={s.sub}>{idea.whyGroup}</span>
                    {idea.whyFits[me] && (
                      <span className={styles.forYou}>
                        <strong>For you:</strong> {idea.whyFits[me]}
                      </span>
                    )}
                    {idea.reasons.length > 0 && (
                      <span className={s.chips}>
                        {idea.reasons.map((r) => (
                          <span key={r} className={styles.reason}>
                            <Icon name={r.startsWith("Partner") ? "star" : "calendar"} size={14} />
                            {r}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </label>
                <MapLinks target={{ searchHint: idea.searchHint, city: m.city }} directions={false} />
              </div>
            ))}
          </fieldset>

          <div className={styles.more}>
            <button type="button" className={s.secondary} onClick={newIdeas}>
              New ideas
            </button>
            <a className={s.textLink} href={eventsSearchUrl(m.city, input.date)} target="_blank" rel="noopener noreferrer">
              See what&rsquo;s on that night
              <span className="visually-hidden">(opens in a new tab)</span>
            </a>
          </div>
        </>
      )}

      <div className={s.actions}>
        <button type="button" className={s.primary} disabled={!chosen || waiting} onClick={vote}>
          Vote for this
        </button>
        <p className={s.small} aria-live="polite">
          {waiting ? "This takes a few seconds." : chosen ? "Next, see how the crew voted." : "Pick one to vote."}
        </p>
      </div>
    </div>
  );
}
