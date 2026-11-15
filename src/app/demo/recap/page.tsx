"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { HISTORY, NEXT_PROPOSAL, PLAN_FEATURES, PRICES, RECAP, STREAK } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { BOOKED, GROUP_SIZE } from "@/lib/plan";
import { restartPlan, update, useDemo } from "@/lib/store";
import styles from "./recap.module.css";

function Photo({ shape }: { shape: string }) {
  // Simple drawn stand-ins for the group's photos.
  const art: Record<string, React.ReactNode> = {
    fire: (
      <>
        <path d="M50 18c10 14 18 22 18 36a18 18 0 01-36 0c0-10 6-16 9-24 3 6 5 9 9 10-2-8-2-14 0-22z" />
        <path d="M24 86l52-12M24 74l52 12" strokeWidth="6" />
      </>
    ),
    summit: <path d="M8 84L38 34l14 20 12-14 28 44z" />,
    stack: (
      <>
        <ellipse cx="50" cy="74" rx="30" ry="8" />
        <ellipse cx="50" cy="62" rx="28" ry="8" />
        <ellipse cx="50" cy="50" rx="26" ry="8" />
        <ellipse cx="50" cy="38" rx="24" ry="8" />
      </>
    ),
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
  };
  return (
    <svg viewBox="0 0 100 100" className={styles.art} aria-hidden="true">
      {art[shape]}
    </svg>
  );
}

export default function Recap() {
  const router = useRouter();
  const [state] = useDemo();
  const [shareMsg, setShareMsg] = useState("");
  const hasPass = !!state.pass;

  async function share() {
    const text = `Our ${BOOKED.title.toLowerCase()} recap on Hangout`;
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

  function planAnother() {
    restartPlan();
    router.push("/demo");
  }

  return (
    <div className={s.screen}>
      <div>
        <p className={s.small}>Weekend recap</p>
        <h1 className={s.title}>{BOOKED.title}</h1>
      </div>

      <ul className={styles.photos} aria-label="Photos">
        {RECAP.photos.map((p, i) => (
          <li key={p.caption} className={`${styles.photo} ${styles[`tone${i % 4}`]}`}>
            <Photo shape={p.shape} />
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
            {GROUP_SIZE} of {GROUP_SIZE}
          </dd>
        </div>
        <div>
          <dt>First through the door</dt>
          <dd>{RECAP.firstThrough.name}</dd>
        </div>
        <div className={styles.streak}>
          <dt>
            <Icon name="flame" size={18} />
            Group streak
          </dt>
          <dd>{STREAK.label}</dd>
        </div>
      </dl>

      {hasPass ? (
        <>
          <section className={s.cardPurple} aria-labelledby="next-title">
            <p id="next-title" className={styles.nextLabel}>
              Next hangout, proposed for you
            </p>
            <p className={styles.nextTitle}>{NEXT_PROPOSAL.title}</p>
            <p>{NEXT_PROPOSAL.when}</p>
            <p className={styles.nextWhy}>{NEXT_PROPOSAL.why}</p>
          </section>

          <section aria-labelledby="history-title">
            <h2 id="history-title" className={s.sectionLabel}>
              Group history
            </h2>
            <ol className={styles.history}>
              <li>
                <span className={styles.hDate}>Dec 4</span>
                <span className={s.grow}>
                  <strong>{BOOKED.title}</strong>
                  <span className={s.small}>
                    {BOOKED.place}, {GROUP_SIZE} went
                  </span>
                </span>
              </li>
              {HISTORY.map((h) => (
                <li key={h.title}>
                  <span className={styles.hDate}>{h.date}</span>
                  <span className={s.grow}>
                    <strong>{h.title}</strong>
                    <span className={s.small}>
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
          <Link
            href="/demo/plans"
            className={styles.offerLink}
            onClick={() => update({ returnTo: "/demo/recap" })}
          >
            See Crew Pass
          </Link>
        </section>
      )}

      <div className={s.actions}>
        <button type="button" className={s.primary} onClick={planAnother}>
          Plan another hangout
        </button>
      </div>
    </div>
  );
}
