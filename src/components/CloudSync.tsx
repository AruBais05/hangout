"use client";

import { useEffect } from "react";
import { loadCloudProfile } from "@/lib/auth";
import { refreshRoom, watchRoom } from "@/lib/cloud";
import { update, useDemo } from "@/lib/store";
import { cloudOn, sb } from "@/lib/supabase";

/** Supabase mode: keeps your account and the shared room in step with the database. Renders nothing. */
export default function CloudSync() {
  const [state, ready] = useDemo();

  useEffect(() => {
    if (!cloudOn) return;
    const c = sb();
    if (!c) return;
    void loadCloudProfile();
    // Don't call Supabase inside the auth callback itself (it can deadlock); defer it.
    const { data } = c.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => void loadCloudProfile(), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const roomId = ready ? state.room?.id : undefined;
  useEffect(() => {
    if (!roomId) return;
    const sync = async () => {
      const room = await refreshRoom(roomId);
      if (room?.unlocked) update({ unlocked: true });
    };
    void sync();
    return watchRoom(roomId, () => void sync());
  }, [roomId]);

  return null;
}
