import Image from "next/image";
import Link from "next/link";
import styles from "./Logo.module.css";

export default function Logo({
  href = "/",
  tone = "ink",
  size = 40,
}: {
  href?: string;
  tone?: "ink" | "white";
  size?: number;
}) {
  return (
    <Link href={href} className={`${styles.logo} ${styles[tone]}`} aria-label="Hangout home">
      <Image
        src="/logo-mark.png"
        alt=""
        width={size}
        height={size}
        className={styles.mark}
        priority
      />
      <span className={styles.word}>hangout</span>
    </Link>
  );
}
