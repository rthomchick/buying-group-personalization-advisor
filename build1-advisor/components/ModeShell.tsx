// Session-persistent mode selector and sidebar navigation

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessionState } from "@/lib/session/session-context";
import type { ActiveMode } from "@/lib/session/session-state";

const MODE_LABELS: Record<ActiveMode, string> = {
  reference: "Reference",
  advisory: "Advisory",
  guided: "Guided Workflow",
};

const MODE_ROUTES: Record<ActiveMode, string> = {
  reference: "/reference",
  advisory: "/advisory",
  guided: "/guided",
};

const MODE_ORDER: ActiveMode[] = ["reference", "advisory", "guided"];

// Active tab is derived from the URL, not activeMode — so a direct navigation
// (typed URL, browser back/forward, refresh) highlights the right tab even
// before any click ever updates session state.
function modeFromPathname(pathname: string): ActiveMode | null {
  return MODE_ORDER.find((mode) => pathname.startsWith(MODE_ROUTES[mode])) ?? null;
}

export function ModeShell() {
  const { sessionState, setActiveMode } = useSessionState();
  const pathname = usePathname();
  const router = useRouter();

  if (!sessionState) return null;

  const activeMode = modeFromPathname(pathname);

  function handleValueChange(value: string) {
    const mode = value as ActiveMode;
    setActiveMode(mode);
    router.push(MODE_ROUTES[mode]);
  }

  return (
    <div className="flex items-center gap-6">
      <Link href="/" className="text-sm font-semibold text-foreground hover:text-kalder-accent">
        Kalder AI Advisor
      </Link>
      <Tabs value={activeMode ?? undefined} onValueChange={handleValueChange}>
        <TabsList>
          {MODE_ORDER.map((mode) => (
            <TabsTrigger key={mode} value={mode}>
              {MODE_LABELS[mode]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
