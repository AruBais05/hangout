"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Checkout from "@/components/demo/Checkout";
import { useDemo } from "@/lib/store";

/** Crew Pass checkout. You need an account first: Crew Pass lives in it. */
export default function PassCheckout() {
  const router = useRouter();
  const [state, ready] = useDemo();
  const needsAccount = ready && !state.session;
  useEffect(() => {
    if (needsAccount) router.replace("/signup");
  }, [needsAccount, router]);
  if (!ready || needsAccount) return null;
  return <Checkout item="pass" />;
}
