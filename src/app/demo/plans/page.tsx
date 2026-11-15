"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import s from "@/components/demo/screen.module.css";
import { PLAN_FEATURES, PRICES } from "@/lib/config";
import { formatPrice } from "@/lib/money";
import { useDemo } from "@/lib/store";
import styles from "./plans.module.css";

export default function Plans() {
  const [state] = useDemo();

  const tiers = [
    {
      name: "Everyday",
      price: "$0",
      note: "Nobody pays",
      features: PLAN_FEATURES.everyday,
    },
    {
      name: "Big Plan unlock",
      price: formatPrice(PRICES.unlockCents),
      note: "Once per plan. Paid by the organizer, repaid through the split.",
      features: PLAN_FEATURES.unlock,
    },
    {
      name: "Crew Pass",
      price: `${formatPrice(PRICES.passYearlyCents)} a year`,
      note: `or ${formatPrice(PRICES.passMonthlyCents)} a month`,
      features: PLAN_FEATURES.pass,
      highlight: true,
    },
  ];

  return (
    <div className={s.screen}>
      <h1 className={s.title}>Plans</h1>

      <ul className={styles.tiers}>
        {tiers.map((t) => (
          <li key={t.name} className={`${styles.tier} ${t.highlight ? styles.highlight : ""}`}>
            <div className={styles.tierHead}>
              <h2 className={styles.tierName}>{t.name}</h2>
              <p className={`${styles.tierPrice} ${s.money}`}>{t.price}</p>
            </div>
            <p className={styles.note}>{t.note}</p>
            <ul className={styles.features}>
              {t.features.map((f) => (
                <li key={f}>
                  <Icon name="check" size={16} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className={s.actions}>
        {state.pass ? (
          <Link href="/demo/settings" className={s.primary}>
            Manage Crew Pass
          </Link>
        ) : (
          <Link href="/demo/pass" className={s.primary}>
            Get Crew Pass – {formatPrice(PRICES.passYearlyCents)}/year
          </Link>
        )}
        <Link href={state.returnTo ?? "/demo"} className={s.textLink}>
          Not now
        </Link>
      </div>
    </div>
  );
}
