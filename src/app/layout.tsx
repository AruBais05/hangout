import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const font = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hangout — turn “we should hang out” into a plan",
  description:
    "Hangout helps friend groups find a time, pick an idea and lock the plan. Everyday hangouts are free. Try it with a demo crew, no sign-up.",
};

export const viewport: Viewport = {
  themeColor: "#FFFC00",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body>{children}</body>
    </html>
  );
}
