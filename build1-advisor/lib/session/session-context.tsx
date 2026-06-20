// React context wrapper around lib/session/session-state.ts's pure functions.
//
// session-state.ts deliberately exposes no React APIs (createInitialSessionState,
// loadSessionState, saveSessionState, switchMode are plain functions) so they stay
// testable without a component tree. This file is the one place that wires those
// functions into React state + sessionStorage persistence for the app.
//
// On mount: attempt loadSessionState(); if it throws (H-06 data model version
// mismatch — see session-state.ts), surface the error rather than silently
// discarding the stored session. If no stored session exists, create a fresh one.
// Every setState call persists via saveSessionState() so sessionStorage never
// drifts from the in-memory state.

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  type AppSessionState,
  type ActiveMode,
  createInitialSessionState,
  loadSessionState,
  saveSessionState,
  switchMode,
} from "./session-state";

type SessionContextValue = {
  sessionState: AppSessionState | null;
  versionMismatchError: string | null;
  setSessionState: (next: AppSessionState) => void;
  setActiveMode: (mode: ActiveMode) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const DEFAULT_PRACTITIONER_ID = "practitioner";

export function SessionStateProvider({ children }: { children: React.ReactNode }) {
  const [sessionState, setSessionStateRaw] = useState<AppSessionState | null>(null);
  const [versionMismatchError, setVersionMismatchError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const loaded = loadSessionState();
      const initial = loaded ?? createInitialSessionState(DEFAULT_PRACTITIONER_ID);
      setSessionStateRaw(initial);
      saveSessionState(initial);
    } catch (error) {
      setVersionMismatchError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  function setSessionState(next: AppSessionState) {
    setSessionStateRaw(next);
    saveSessionState(next);
  }

  function setActiveMode(mode: ActiveMode) {
    setSessionStateRaw((current) => {
      if (!current) return current;
      const next = switchMode(current, mode);
      saveSessionState(next);
      return next;
    });
  }

  const value = useMemo(
    () => ({ sessionState, versionMismatchError, setSessionState, setActiveMode }),
    [sessionState, versionMismatchError],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionState(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionState() must be called within a SessionStateProvider.");
  }
  return context;
}
