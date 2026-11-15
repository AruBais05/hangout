"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { currentAccount, logOut } from "@/lib/auth";
import { useDemo } from "@/lib/store";
import styles from "./AccountMenu.module.css";

/** Header account state: Log in, or your name + Crew Pass badge with a menu. */
export default function AccountMenu() {
  const router = useRouter();
  const [state, ready] = useDemo();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const account = currentAccount(state);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!ready) return <span className={styles.placeholder} aria-hidden="true" />;

  if (!account) {
    return (
      <div className={styles.row}>
        <Link href="/login" className={styles.login}>
          Log in
        </Link>
        <Link href="/settings" className={styles.icon} aria-label="Settings">
          <Icon name="settings" size={20} />
        </Link>
      </div>
    );
  }

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className={styles.wrap} ref={box}>
      <button type="button" className={styles.me} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className={styles.avatar} aria-hidden="true">
          {account.name[0]?.toUpperCase()}
        </span>
        <span className={styles.name}>{account.name}</span>
        {state.pass && <span className={styles.badge}>Crew Pass</span>}
      </button>
      {open && (
        <ul className={styles.menu} role="menu">
          <li role="none">
            <button type="button" role="menuitem" onClick={() => go("/settings")}>
              Settings
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" onClick={() => go("/settings#spending")}>
              My spending
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" onClick={() => go("/history")}>
              History
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                logOut();
                go("/");
              }}
            >
              Log out
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
