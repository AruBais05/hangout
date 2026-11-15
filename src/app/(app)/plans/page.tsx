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
    { name: "Everyday", price: "$0", note: "Planning, voting and booking links are free. No fees.", features: PLAN_FEATURES.everyday },
    {
      name: "Big Plan unlock",
      price: formatPrice(PRICES.unlockCents),
      note: "Once per big plan (trips, or 10 to 50 people). Free with Crew Pass.",
      features: PLAN_FEATURES.unlock,
    },
    {
      name: "Crew Pass",
      price: `${formatPrice(PRICES.passYearlyCents)}/yr`,
      note: "Yearly. For groups that hang out often.",
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
            <div className={styles.head}>
              <h2 className={styles.name}>{t.name}</h2>
              <p className={`${styles.price} ${s.money}`}>{t.price}</p>
            </div>
            <p className={s.small}>{t.note}</p>
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
          <Link href="/settings" className={s.primary}>
            Manage Crew Pass
          </Link>
        ) : (
          <Link href={state.session ? "/pass" : "/signup"} className={s.primary}>
            Get Crew Pass – {formatPrice(PRICES.passYearlyCents)}/year
          </Link>
        )}
        <Link href={state.returnTo ?? "/room"} className={s.textLink}>
          Not now
        </Link>
      </div>
    </div>
  );
}
