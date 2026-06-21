// Root layout — version stamp header (Data model: v0.2.0)

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
  title: "Kalder Website Experience Simulator",
  description: "Visitor classification state -> personalized web experience and decisioning trace, per Document 5.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col bg-background font-sans text-foreground antialiased`}>
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="text-sm font-semibold text-foreground">Kalder Website Experience Simulator</span>
          <span className="font-mono text-xs text-kalder-version-stamp">Data model: v0.2.0</span>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
