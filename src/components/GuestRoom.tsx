"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import BookLinks from "@/components/BookLinks";
import Icon from "@/components/Icon";
import { Flow } from "@/components/demo/JoinFlow";
import s from "@/components/demo/screen.module.css";
import { PERSONALITIES, PRICES } from "@/lib/config";
import { joinRoom, roomByCode, setMine, type CloudRoom, type JoinData } from "@/lib/cloud";
import { formatCents } from "@/lib/money";
import { purposeOf, rangeLabel } from "@/lib/plan";
import { venmoUrl } from "@/lib/split";
import type { CloudMember } from "@/lib/store";
import { ensureSession, sb } from "@/lib/supabase";
import styles from "./GuestRoom.module.css";

type View = { kind: "loading" } | { kind: "missing" } | { kind: "join"; room: CloudRoom } | { kind: "in"; room: CloudRoom };

/** A friend's view of a shared room: join, see who's in, vote, settle up. Live. */
export default function GuestRoom({ code }: { code: string }) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [members, setMembers] = useState<CloudMember[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const room = await roomByCode(code);
    if (!room) return setView({ kind: "missing" });
    const me = await ensureSession();
    setUid(me);
    const c = sb()!;
    const { data } = await c.from("members").select("*").eq("room_id", room.id).order("joined_at");
    const list = (data as CloudMember[]) ?? [];
    setMembers(list);
    // Members can read the room row itself; before joining, the code lookup is enough.
    const { data: fresh } = await c.from("rooms").select("*").eq("id", room.id).maybeSingle();
    const r = (fresh as CloudRoom) ?? room;
    setView(list.some((x) => x.user_id === me) ? { kind: "in", room: r } : { kind: "join", room: r });
  }, [code]);

  useEffect(() => {
    let alive = true;
    const first = setTimeout(() => void load(), 0); // first load right after mount
    const c = sb();
    if (!c) return () => clearTimeout(first);
    let ch: ReturnType<typeof c.channel> | null = null;
    // Live updates once we know the room id.
    const backup = setInterval(() => void load(), 15000); // in case the live connection drops
    void roomByCode(code).then(async (room) => {
      if (!alive || !room) return;
      const token = (await c.auth.getSession()).data.session?.access_token;
      if (token) await c.realtime.setAuth(token);
      if (!alive) return;
      ch = c.channel(`guest-${room.id}`);
      ch.on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `room_id=eq.${room.id}` }, () => void load());
      ch.on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, () => void load());
      ch.subscribe();
    });
    return () => {
      alive = false;
      clearTimeout(first);
      clearInterval(backup);
      if (ch) c.removeChannel(ch);
    };
  }, [code, load]);

  if (view.kind === "loading") {
    return (
      <div className={s.screen}>
        <p className={s.lede} role="status">
          <span className={s.spinner} aria-hidden="true" /> Opening the invite…
        </p>
      </div>
    );
  }

  if (view.kind === "missing") {
    return (
      <div className={s.screen}>
        <h1 className={s.title}>This invite doesn&rsquo;t work</h1>
        <p className={s.lede}>The link may be old or mistyped. Ask the host to share it again.</p>
        <div className={s.actions}>
          <Link href="/" className={s.primary}>
            Back to Hangout
          </Link>
        </div>
      </div>
    );
  }

  const room = view.room;
  const m = room.meeting;

  if (view.kind === "join") {
    if (members.length >= 50) {
      return (
        <div className={s.screen}>
          <h1 className={s.title}>This hangout is full</h1>
          <p className={s.lede}>50 people have joined, the most a hangout can have.</p>
        </div>
      );
    }
    return (
      <Flow
        guest
        invite={{ meeting: m, host: room.host_name, quiz: room.group_quiz }}
        onJoined={(d: JoinData) => {
          void joinRoom(room.id, d).then(() => load());
        }}
      />
    );
  }

  /* ---------- you're in ---------- */
  const me = members.find((x) => x.user_id === uid);
  const plans = room.plans?.result.plans ?? [];
  const votes = new Map<string, number>();
  for (const x of members) if (x.vote) votes.set(x.vote, (votes.get(x.vote) ?? 0) + 1);
  const winner = plans.length ? plans.reduce((a, b) => ((votes.get(b.id) ?? 0) > (votes.get(a.id) ?? 0) ? b : a), plans[0]) : null;
  const discount = winner?.partnerName ? Math.round((winner.eachCents * PRICES.partnerDiscountPct) / 100) : 0;
  const share = winner ? winner.eachCents - discount : 0;

  async function vote(id: string) {
    setBusy(true);
    await setMine(room.id, { vote: id });
    await load();
    setBusy(false);
  }

  async function paid() {
    setBusy(true);
    await setMine(room.id, { paid: true });
    await load();
    setBusy(false);
  }

  return (
    <div className={s.screen}>
      <div>
        <h1 className={s.title}>You&rsquo;re in{me ? `, ${me.name}` : ""}</h1>
        <p className={s.lede} style={{ marginTop: 8 }}>
          {room.host_name || "The host"}&rsquo;s {purposeOf(m).label.toLowerCase()} in {m.city}, {rangeLabel(m.from, m.to)}.
        </p>
      </div>

      <section aria-labelledby="who">
        <h2 id="who" className={s.label}>
          Who&rsquo;s in · {members.length}
        </h2>
        <ul className={styles.people}>
          {members.map((x) => (
            <li key={x.id}>
              <span className={x.user_id === uid ? s.avatarYou : s.avatarJoined} aria-hidden="true">
                {x.name[0]}
              </span>
              <span className={s.grow}>
                {x.name}
                {x.is_host ? " (host)" : ""} · {x.area || "Nearby"}
              </span>
              <span className={s.chip}>{PERSONALITIES[x.type].name}</span>
            </li>
          ))}
        </ul>
      </section>

      {!plans.length && (
        <p className={styles.wait} role="status">
          <Icon name="clock" size={18} /> Waiting for {room.host_name || "the host"} to plan the ideas. This page updates by itself.
        </p>
      )}

      {plans.length > 0 && !room.voting_ended && (
        <section aria-labelledby="vote">
          <h2 id="vote" className={s.label}>
            Vote · {[...votes.values()].reduce((a, b) => a + b, 0)} of {members.length} voted
          </h2>
          <ul className={styles.plans}>
            {plans.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`${styles.plan} ${me?.vote === p.id ? styles.picked : ""}`}
                  aria-pressed={me?.vote === p.id}
                  disabled={busy}
                  onClick={() => vote(p.id)}
                >
                  <span className={styles.planTop}>
                    <strong>{p.title}</strong>
                    <span className={s.money}>{p.eachCents ? formatCents(p.eachCents) : "Free"}</span>
                  </span>
                  <span className={s.sub}>
                    {p.startTime} · {p.neighborhood} · {votes.get(p.id) ?? 0} vote{votes.get(p.id) === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {winner && room.voting_ended && (
        <section className={s.cardYellow} aria-labelledby="won">
          <p id="won" className={s.label}>
            The crew picked
          </p>
          <p className={styles.winner}>{winner.title}</p>
          <p>
            {winner.startTime} · {winner.partnerName ?? winner.neighborhood}, {m.city}
          </p>
          <BookLinks idea={winner} city={m.city} />
          {share > 0 && (
            <div className={styles.settle}>
              <p>
                Your share: <strong className={s.money}>{formatCents(share)}</strong>
                {discount > 0 ? ` (10% partner discount included)` : ""}
              </p>
              <div className={styles.row}>
                {room.host_venmo && !me?.paid && (
                  <a className={s.secondary} href={venmoUrl(room.host_venmo, share, winner.title)} target="_blank" rel="noopener noreferrer">
                    Pay @{room.host_venmo} on Venmo
                    <span className="visually-hidden">(opens in a new tab)</span>
                  </a>
                )}
                <button type="button" className={s.secondary} onClick={paid} disabled={busy || me?.paid}>
                  <Icon name="check" size={18} />
                  {me?.paid ? "Paid" : "I paid"}
                </button>
              </div>
              {!room.host_venmo && <p className={s.small}>Ask the host how to pay them back.</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
