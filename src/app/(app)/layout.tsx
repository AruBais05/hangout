import type { Metadata } from "next";
import AppShell from "@/components/demo/AppShell";

export const metadata: Metadata = {
  title: "Hangout",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
