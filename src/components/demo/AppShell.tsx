"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useEffect } from "react";
import { isBig, meetingOf, needsUnlock } from "@/lib/plan";
import AccountMenu from "@/components/AccountMenu";
import { useDemo } from "@/lib/store";
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
  { path: "/room/pay", label: "Settle up" },
  { path: "/room/plan", label: "The plan" },
  { path: "/room/night", label: "On the day" },
  { path: "/room/recap", label: "Recap" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, ready] = useDemo();
  const big = isBig(meetingOf(state)) || needsUnlock(state);
  const steps = ALL_STEPS.filter((s) => !s.big || big);
  const index = steps.findIndex((s) => s.path === pathname);

  // Big plans: setup stays open; ideas, voting and everything after send you to the unlock until it's paid.
  const GATED = ["/room/ideas", "/room/vote", "/room/in", "/room/pay", "/room/plan", "/room/night", "/room/recap"];
  const locked = ready && needsUnlock(state) && GATED.some((p) => pathname.startsWith(p));
  useEffect(() => {
    if (locked) router.replace("/room/unlock");
  }, [locked, router]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className="wordmark">
          hangout
        </Link>
        <div className={styles.tools}>
          <AccountMenu />
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
        {locked ? null : children}
      </main>
    </div>
  );
}
