"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { setPass, useDemo } from "@/lib/store";
import styles from "./DemoShell.module.css";

export const STEPS = [
  "/demo",
  "/demo/quiz",
  "/demo/dates",
  "/demo/unlock",
  "/demo/options",
  "/demo/vote",
  "/demo/in",
  "/demo/booked",
  "/demo/checkin",
  "/demo/recap",
];

export default function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, ready] = useDemo();
  const stepIndex = STEPS.indexOf(pathname);
  const hasPass = !!state.pass;

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Hangout home">
            <Image src="/logo-mark.png" alt="" width={30} height={30} className={styles.mark} />
            <span>hangout</span>
          </Link>
          <div className={styles.tools}>
            <button
              type="button"
              className={`${styles.passToggle} ${hasPass ? styles.on : ""}`}
              role="switch"
              aria-checked={hasPass}
              onClick={() => setPass(!hasPass)}
              disabled={!ready}
              title="Demo toggle: switch the Crew Pass on or off"
            >
              <span className={styles.knob} aria-hidden="true" />
              <span>{hasPass ? "Has pass" : "No pass"}</span>
            </button>
            <Link href="/demo/settings" className={styles.iconLink} aria-label="Settings">
              <Icon name="settings" size={20} />
            </Link>
          </div>
        </header>

        {stepIndex >= 0 ? (
          <div className={styles.progressRow}>
            <div
              className={styles.progress}
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-valuenow={stepIndex + 1}
              aria-label="Demo progress"
            >
              <span style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
            </div>
            <span className={styles.stepLabel}>
              Step {stepIndex + 1} of {STEPS.length}
            </span>
          </div>
        ) : (
          <div className={styles.progressRow}>
            <button type="button" className={styles.back} onClick={() => router.back()}>
              <Icon name="back" size={18} />
              Back
            </button>
          </div>
        )}

        {/* Saved demo state loads after hydration; keep the screen invisible until then. */}
        <main id="main" className={`${styles.main} ${ready ? "" : styles.loading}`} aria-busy={!ready}>
          {children}
        </main>
      </div>
    </div>
  );
}
