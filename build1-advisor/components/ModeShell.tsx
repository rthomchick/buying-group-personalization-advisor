// Session-persistent mode selector and sidebar navigation

"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessionState } from "@/lib/session/session-context";
import type { ActiveMode } from "@/lib/session/session-state";

const MODE_LABELS: Record<ActiveMode, string> = {
  reference: "Reference",
  advisory: "Advisory",
  guided: "Guided Workflow",
};

const MODE_ORDER: ActiveMode[] = ["reference", "advisory", "guided"];

export function ModeShell() {
  const { sessionState, setActiveMode } = useSessionState();

  if (!sessionState) return null;

  return (
    <Tabs value={sessionState.activeMode} onValueChange={(value) => setActiveMode(value as ActiveMode)}>
      <TabsList>
        {MODE_ORDER.map((mode) => (
          <TabsTrigger key={mode} value={mode}>
            {MODE_LABELS[mode]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
