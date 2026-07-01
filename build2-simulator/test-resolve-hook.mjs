// Node module-resolution hook used ONLY for running this project's *.test.ts
// files directly via `node --import ./test-resolve-hook.mjs <file>.test.ts`.
//
// Why this exists: Next.js's "bundler" moduleResolution (tsconfig.json)
// allows extensionless relative imports (e.g. `from "./three-axis"`), and
// production source files rely on that — correctly, since Next.js resolves
// them at build time. Node's native TypeScript-stripping loader has no such
// resolution step and fails with ERR_MODULE_NOT_FOUND on the same imports.
// This hook bridges that gap for test runs only: it does not touch any
// production source file's import statements, and it is never loaded by
// `next dev` / `next build`.
//
// No new dependency: uses only Node's built-in module customization hooks
// API (module.register), matching the zero-test-framework-dependency
// convention already established in build1-advisor's flag-hold-evaluator.test.ts.

import { register } from "node:module";

register(new URL("./test-resolve-hook-loader.mjs", import.meta.url));
