import type { Expense } from "./store";

// Crew Pass cost split: expenses shared evenly, then the fewest payments to settle up.

export type Debt = { from: string; to: string; cents: number; handle: string; key: string };

/** Who owes whom, with as few payments as possible. `members` are the people who are in. */
export function settleUp(members: string[], expenses: Expense[]): Debt[] {
  if (members.length === 0) return [];
  const balance = new Map<string, number>(members.map((m) => [m, 0]));
  const handleOf = new Map<string, string>();
  for (const e of expenses) {
    if (!balance.has(e.payer)) continue;
    // Even split in whole cents; the payer absorbs the leftover cents.
    const each = Math.floor(e.amountCents / members.length);
    for (const m of members) balance.set(m, balance.get(m)! - each);
    balance.set(e.payer, balance.get(e.payer)! + each * members.length);
    if (e.handle) handleOf.set(e.payer, e.handle);
  }
  const owe = [...balance].filter(([, b]) => b < 0).map(([n, b]) => ({ n, b: -b })).sort((a, b) => b.b - a.b);
  const get = [...balance].filter(([, b]) => b > 0).map(([n, b]) => ({ n, b })).sort((a, b) => b.b - a.b);
  const debts: Debt[] = [];
  let i = 0;
  let j = 0;
  while (i < owe.length && j < get.length) {
    const cents = Math.min(owe[i].b, get[j].b);
    if (cents > 0) {
      const to = get[j].n;
      debts.push({ from: owe[i].n, to, cents, handle: handleOf.get(to) ?? "", key: `${owe[i].n}>${to}` });
    }
    owe[i].b -= cents;
    get[j].b -= cents;
    if (owe[i].b === 0) i++;
    if (get[j].b === 0) j++;
  }
  return debts;
}

/** Venmo pay link: opens Venmo with the person, amount and note filled in. */
export function venmoUrl(handle: string, cents: number, note: string): string {
  const p = new URLSearchParams({
    txn: "pay",
    recipients: handle.replace(/^@/, ""),
    amount: (cents / 100).toFixed(2),
    note: note.slice(0, 80),
  });
  return `https://account.venmo.com/pay?${p.toString()}`;
}

/** Venmo usernames: letters, numbers, - and _, 5 to 30 characters. Keeps only the handle. */
export function cleanHandle(text: string): string {
  return text.trim().replace(/^@/, "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 30);
}
