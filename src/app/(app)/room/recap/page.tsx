"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { HISTORY, NEXT_PROPOSAL, PLAN_FEATURES, PRICES, STREAK_LABEL } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { crewOf, meetingOf, rankIdeas, winnerOf } from "@/lib/plan";
import { update, useDemo } from "@/lib/store";
import styles from "./recap.module.css";

const SHAPES: Record<string, React.ReactNode> = {
  group: (
    <>
      {[18, 34, 50, 66, 82].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={i % 2 ? 44 : 40} r="8" />
          <path d={`M${x - 10} 90v-22a10 10 0 0120 0v22z`} />
        </g>
      ))}
    </>
  ),
  spark: <path d="M50 10l9 29 31 1-25 18 9 30-24-18-24 18 9-30-25-18 31-1z" />,
  stack: (
    <>
      <ellipse cx="50" cy="74" rx="30" ry="8" />
      <ellipse cx="50" cy="60" rx="27" ry="8" />
      <ellipse cx="50" cy="46" rx="24" ry="8" />
    </>
  ),
};

export default function Recap() {
  const router = useRouter();
  const [state] = useDemo();
  const m = meetingOf(state);
  const crew = crewOf(m);
  const idea = winnerOf(state, rankIdeas(state));
  const [shareMsg, setShareMsg] = useState("");
  const hasPass = !!state.pass;

  const photos = [
    { shape: "group", caption: "Group photo" },
    { shape: "spark", caption: "Best moment" },
    { shape: "stack", caption: "The food" },
  ];

  async function share() {
    const text = `Our ${idea.title.toLowerCase()} recap on Hangout`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Hangout recap", text, url: window.location.origin });
        setShareMsg("Shared.");
      } else {
        await navigator.clipboard.writeText(`${text}: ${window.location.origin}`);
        setShareMsg("Link copied.");
      }
    } catch {
      setShareMsg("");
    }
  }

  return (
    <div className={s.screen}>
      <div>
        <p className={s.small}>Recap</p>
        <h1 className={s.title}>{idea.title}</h1>
      </div>

      <ul className={styles.photos} aria-label="Photos">
        {photos.map((p, i) => (
          <li key={p.caption} className={`${styles.photo} ${styles[`tone${i}`]}`}>
            <svg viewBox="0 0 100 100" className={styles.art} aria-hidden="true">
              {SHAPES[p.shape]}
            </svg>
            <span className={styles.caption}>{p.caption}</span>
          </li>
        ))}
      </ul>

      <button type="button" className={s.secondary} onClick={share}>
        <Icon name="share" size={18} />
        Share recap
      </button>
      <p className={s.status} aria-live="polite">
        {shareMsg}
      </p>

      <dl className={styles.stats}>
        <div>
          <dt>Showed up</dt>
          <dd>
            {m.people} of {m.people}
          </dd>
        </div>
        <div>
          <dt>First through the door</dt>
          <dd>{crew[0]?.name ?? "You"}</dd>
        </div>
        <div className={styles.streak}>
          <dt>
            <Icon name="flame" size={18} />
            Group streak
          </dt>
          <dd>{STREAK_LABEL}</dd>
        </div>
      </dl>

      {hasPass ? (
        <>
          <section className={s.cardYellow} aria-labelledby="next-title">
            <p id="next-title" style={{ fontWeight: 800, fontSize: "0.9rem" }}>
              Next hangout, proposed for you
            </p>
            <p className={styles.nextTitle}>{NEXT_PROPOSAL.title}</p>
            <p>{NEXT_PROPOSAL.when}</p>
            <p className={s.small} style={{ marginTop: 6, color: "var(--ink)" }}>
              {NEXT_PROPOSAL.why}
            </p>
          </section>
          <section aria-labelledby="history-title">
            <h2 id="history-title" className={s.label}>
              Group history
            </h2>
            <ol className={styles.history}>
              <li>
                <span className={styles.hDate}>Now</span>
                <span className={s.grow}>
                  <strong>{idea.title}</strong>
                  <span className={s.sub}>
                    {idea.place}, {m.people} went
                  </span>
                </span>
              </li>
              {HISTORY.map((h) => (
                <li key={h.title}>
                  <span className={styles.hDate}>{h.date}</span>
                  <span className={s.grow}>
                    <strong>{h.title}</strong>
                    <span className={s.sub}>
                      {h.place}, {h.went} went
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : (
        <section className={styles.offer} aria-labelledby="offer-title">
          <h2 id="offer-title" className={styles.offerTitle}>
            Plan big often?
          </h2>
          <p>
            Crew Pass is {formatPrice(PRICES.passYearlyCents)} a year: {PLAN_FEATURES.pass.join(", ").toLowerCase()}.
          </p>
          <Link href="/plans" className={s.textLink} onClick={() => update({ returnTo: "/room/recap" })}>
            See Crew Pass
          </Link>
        </section>
      )}

      <div className={s.actions}>
        <button type="button" className={s.primary} onClick={() => router.push("/start")}>
          Plan another hangout
        </button>
      </div>
    </div>
  );
}
