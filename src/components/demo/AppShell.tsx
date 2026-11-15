"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { isBig, meetingOf } from "@/lib/plan";
import { setPass, useDemo } from "@/lib/store";
import styles from "./AppShell.module.css";

const ALL_STEPS = [
  { path: "/start", label: "Set up" },
  { path: "/start/people", label: "Your crew" },
  { path: "/room", label: "Waiting room" },
  { path: "/room/join", label: "Your answers" },
  { path: "/room/unlock", label: "Big plan", big: true },
  { path: "/room/ideas", label: "Ideas" },
  { path: "/room/vote", label: "Vote" },
  { path: "/room/in", label: "Who's in", big: true },
  { path: "/room/plan", label: "The plan" },
  { path: "/room/night", label: "On the day" },
  { path: "/room/recap", label: "Recap" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, ready] = useDemo();
  const big = isBig(meetingOf(state));
  const steps = ALL_STEPS.filter((s) => !s.big || big);
  const index = steps.findIndex((s) => s.path === pathname);
  const hasPass = !!state.pass;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className="wordmark">
          hangout
        </Link>
        <div className={styles.tools}>
          <button
            type="button"
            className={`${styles.passToggle} ${hasPass ? styles.on : ""}`}
            role="switch"
            aria-checked={hasPass}
            onClick={() => setPass(!hasPass)}
            disabled={!ready}
            title="Demo switch: Crew Pass on or off"
          >
            <span className={styles.knob} aria-hidden="true" />
            <span>{hasPass ? "Has pass" : "No pass"}</span>
          </button>
          <Link href="/settings" className={styles.iconLink} aria-label="Settings">
            <Icon name="settings" size={20} />
          </Link>
        </div>
      </header>

      <div className={styles.progressRow}>
        {index >= 0 ? (
          <>
            <span className={styles.stepLabel}>
              {steps[index].label}
              <span className={styles.stepCount}>
                {index + 1}/{steps.length}
              </span>
            </span>
            <div
              className={styles.progress}
              role="progressbar"
              aria-label="Progress"
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-valuenow={index + 1}
            >
              <span style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
            </div>
          </>
        ) : (
          <button type="button" className={styles.back} onClick={() => router.back()}>
            <Icon name="back" size={18} />
            Back
          </button>
        )}
      </div>

      {/* Saved demo state loads after hydration; keep the screen invisible until then. */}
      <main id="main" className={`${styles.main} ${ready ? "" : styles.loading}`} aria-busy={!ready}>
        {children}
      </main>
    </div>
  );
}
