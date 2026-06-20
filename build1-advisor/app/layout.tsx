// Root layout — mode shell, version stamp header, session state provider

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SessionStateProvider } from "@/lib/session/session-context";
import { ModeShell } from "@/components/ModeShell";
import { VersionStamp } from "@/components/VersionStamp";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kalder AI Advisor",
  description: "Reference, Advisory, and Guided Workflow modes against the Kalder corpus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col bg-background font-sans text-foreground antialiased`}>
        <SessionStateProvider>
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <ModeShell />
            <VersionStamp />
          </header>
          <main className="flex-1">{children}</main>
        </SessionStateProvider>
      </body>
    </html>
  );
}
