# Lessons — Institutional Memory

> Append after every correction or mistake: `[date] — what went wrong → rule to prevent it`
> Review at the start of every session before writing any code.

---

<!-- Entries go below, newest at top -->

[2026-05-29] — drizzle-kit v0.20 has no `migrate` CLI command (only `generate:sqlite`, `push:sqlite`, `studio`) — calling `drizzle-kit migrate` exits with "unknown command". Use `drizzle-orm/better-sqlite3/migrator` programmatically in a Node.js inline script instead. Pin the `db:migrate` npm script to that pattern for this version.

[2026-05-29] — `tsconfig.json` with `rootDir: ./src` rejects files imported from outside `src/` (e.g. `drizzle/schema.ts`) even if they're listed in `include` — TypeScript errors with TS6059. Set `rootDir: .` when the project imports across sibling directories; update compiled output paths accordingly (`dist/src/server.js` instead of `dist/server.js`).

[2026-05-29] — `ion-input` does not accept `type="color"` (TextFieldTypes union excludes it) — vue-tsc errors. Replace with a native `<input type="color">` styled inline. Similarly, `maxlength` on `ion-input` must be bound as `:maxlength` (number), not `maxlength` (string attribute).

[2026-05-29] — `onIonViewWillEnter` is exported from `@ionic/vue`, not from `vue` — importing it from `vue` compiles fine in some setups but fails in strict `vue-tsc`. Always import Ionic lifecycle hooks from `@ionic/vue`.

[2026-05-29] — `ion-input` shadow DOM padding collapses CSS floating labels at constrained heights — the `:not(:placeholder-shown)` trigger never fires cleanly because Ionic injects its own internal label element. Use native `<input>` + CSS for any form that needs floating labels. `ion-input` is fine for forms where label-placement="floating" is handled entirely by Ionic (no custom CSS float needed).

[2026-05-29] — Pinia stores are empty on page load when `restore()` and `load()` are not called before mounting — router guards that check store state always see unauthenticated. Always bootstrap stores before `app.mount()`. Use `Promise.allSettled` so a failed config load doesn't block the app.

[2026-05-29] — i18n key paths used in templates must exactly match the locale JSON structure. Flat key like `session.kiosk` fails silently if the locale file has `session.mode_kiosk`. Audit template `$t()` calls against both locale files before building.

[2026-05-29] — `rebuildQueueState()` is async but was called without `await` in all queueService mutation functions → always `await` async state-rebuild functions before returning from a mutation, even in sync-looking call sites.

[2026-05-29] — `callNext()` and `openSession()` had TOCTOU race: read then write in separate statements → any DB check that gates a write must be inside a single `db.transaction()` call.

[2026-05-29] — Backup import wrote directly to the live DB before validating migrations → always stage to a temp/`.incoming` path, validate fully, then atomically rename into place. Live DB should be the last thing touched.
