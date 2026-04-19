import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym Notebook — Workout logging & PRs",
  description: "Personal fitness tracking focused on workouts, PRs, and progress history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) mutate <body> before React hydrates */}
      <body
        className="flex min-h-full flex-col font-sans text-zinc-900"
        suppressHydrationWarning
      >
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <footer className="shrink-0 mb-8 bg-black py-2.5 text-center text-[11px] text-white/65">
          <span className="tracking-wide">Created by </span>
          <a
            href="https://www.andrewbacigalupi.com"
            target="_blank"
            rel="noopener noreferrer"
            className=" text-white/90 transition hover:text-white hover:underline hover:decoration-white hover:underline-offset-4"
          >
            Andrew Bacigalupi
          </a>
        </footer>
      </body>
    </html>
  );
}
