// Loader-half of test-resolve-hook.mjs. Split into two files because
// node:module's register() loads this module in a separate loader realm —
// the `resolve` hook must live in the file passed to register(), not the
// file that calls register() itself.

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[a-zA-Z0-9]+$/.test(specifier)) {
    const basePath = fileURLToPath(new URL(specifier, context.parentURL));
    if (existsSync(basePath + ".ts")) {
      return nextResolve(specifier + ".ts", context);
    }
  }
  return nextResolve(specifier, context);
}

// Next.js's resolveJsonModule allows plain `import x from "./y.json"` with no
// import attribute. Node's native ESM loader requires an explicit
// `with { type: "json" }` attribute on the import itself at LOAD time (not
// resolve time), which production source files correctly omit (Next.js
// doesn't need or want it). Force the format here so those source files stay
// untouched.
export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) {
    return nextLoad(url, { ...context, format: "json", importAttributes: { ...context.importAttributes, type: "json" } });
  }
  return nextLoad(url, context);
}
