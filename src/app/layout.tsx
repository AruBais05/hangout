import type { Metadata, Viewport } from "next";
import { Anybody, Figtree } from "next/font/google";
import "./globals.css";

const display = Anybody({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hangout — turn “we should hang out” into a booked plan",
  description:
    "Hangout helps friend groups find a time, vote on a plan and book it. Free to plan. Try it with a demo crew, no sign-up.",
};

export const viewport: Viewport = {
  themeColor: "#4826EC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
