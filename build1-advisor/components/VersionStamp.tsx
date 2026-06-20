// "Data model: v0.2.0" display — always visible in header
//
// Reads NEXT_PUBLIC_DATA_MODEL_VERSION directly (not lib/session/session-state.ts's
// DATA_MODEL_VERSION constant) so the displayed value reflects the build's actual
// environment configuration, matching the env var this same value is sourced from
// across the app (see .env.local.example).

export function VersionStamp() {
  const version = process.env.NEXT_PUBLIC_DATA_MODEL_VERSION;

  return (
    <span className="font-mono text-xs text-kalder-version-stamp" data-testid="version-stamp">
      Data model: v{version}
    </span>
  );
}
