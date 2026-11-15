import type { Metadata } from "next";
import DemoShell from "@/components/demo/DemoShell";

export const metadata: Metadata = {
  title: "Hangout demo",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
