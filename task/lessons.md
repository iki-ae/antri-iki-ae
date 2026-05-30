# Lessons — Institutional Memory

> Append after every correction or mistake: `[date] — what went wrong → rule to prevent it`
> Review at the start of every session before writing any code.

---

<!-- Entries go below, newest at top -->

[2026-05-30] — `closeSession` only set `sessions.status = 'closed'` and left all in-flight tickets (`called`/`recalled`/`serving`) active indefinitely — they poisoned the `COUNTER_HAS_ACTIVE_TICKET` guard in future sessions. Rule: close session must atomically mark all active tickets for that session as `done` in the same transaction before setting session status to `closed`.

[2026-05-30] — `COUNTER_HAS_ACTIVE_TICKET` guard in `callNext()` queried active tickets without filtering by `session_id` — tickets from old closed sessions blocked `callNext` on those counters forever. Rule: any ticket-status guard must always include `eq(tickets.session_id, session.id)`.

[2026-05-30] — `watch(lastCalled)` on the display page only sees the final computed value after Vue batches reactive updates — if two SSE messages arrive before Vue flushes, the watcher fires once with the last value and the intermediate call is silently dropped. Rule: for per-SSE-message detection (rapid-fire operators), run detection synchronously inside `onmessage` before `state.value` is assigned, not in a Vue watcher on a computed derived from state.

[2026-05-30] — The first SSE message after `connect()` always reflects the current page-load snapshot, not a new operator action. If `_lastCalledAt` is empty (fresh connect), every active ticket looks "new" and triggers announcements — causing sound to play on the first user click. Rule: treat the first SSE message as a silent seed: populate `_lastCalledAt` and fire a one-shot `onFirstState` callback, but do not fire `onAnnounce` listeners. Reset the seed flag on `disconnect()` so reconnects also skip their first message.

[2026-05-30] — Recall sound "not playing after first recall" was diagnosed as a Web Speech API / frontend problem and led to replacing it with espeak-ng TTS — but the real bug was `recallTicket()` rejecting status `'recalled'` with `TICKET_CANNOT_RECALL`, so no SSE was ever broadcast and the frontend never had anything to speak. Before assuming a frontend/browser problem, verify the backend actually succeeded (check the API response, not just the UI symptom). A silent 400 from the API is invisible in the display page.

[2026-05-30] — 401 interceptor called `store.logout()` on `/auth/me` 401 (expected unauthenticated) → `logout()` called `/api/auth/logout` → also 401 → interceptor fired again → infinite cascade redirecting to `/login`. Fix: never intercept 401s from `/auth/me` or `/auth/logout` — they are bootstrap/teardown endpoints designed to 401 unauthenticated. Use a `clear()` method (state reset only, no API call) instead of `logout()` inside the interceptor.

[2026-05-30] — `isRestoring()` flag did not reliably suppress the 401 interceptor — Axios response callbacks are microtasks, so by the time the interceptor runs `_restoring` was already `false` (set in the `finally` block of `restore()`). Do not rely on timing flags to suppress interceptors; skip by URL pattern instead.

[2026-05-29] — CSS grid `auto-fill` / `minmax` counter boxes had uneven heights when cells contained variable content (number vs dash) — grid row sizing is only reliable when all cells have identical DOM structure and fixed-height content. For operator-facing counter cards where content varies, use independent `flex-wrap` cards instead; each card sizes itself, no cross-cell alignment dependency.

[2026-05-29] — `v-if="count"` hides a badge when `count === 0` (falsy) — in the counter preview header the waiting badge disappeared when there were 0 waiting tickets. Use `v-if="count !== null"` or remove the `v-if` entirely and always render the badge, showing `0` explicitly when empty.

[2026-05-29] — Ticket route handlers in `tickets.ts` were calling async service functions (`callNext`, `recallTicket`, etc.) without `await` — responses were sent before `rebuildQueueState()` completed, causing stale SSE broadcasts. Always `await` async service calls in route handlers.

[2026-05-29] — In-memory queue state (`_state` in `queueService.ts`) initialises as `{ session: null }` and is only updated by mutations. Any PM2 restart (e.g. after a frontend build) resets it, leaving an open DB session invisible to SSE clients until the next mutation. Fix: call `rebuildQueueState()` once in `server.ts` after all routes are registered, before `app.listen()`. This must always be present.

[2026-05-29] — `ion-select-option` does not forward `style` or dynamic CSS variables — dynamic background colors on select options (e.g. per-category color) cannot be set via the component. Use `cssClass` on the option + inject a `<style>` element into `document.head` via `watchEffect`; clean up with `onUnmounted`. Scope the rules to the alert's `cssClass` (set via `:interface-options="{ cssClass: '...' }"`) to avoid polluting other selects.

[2026-05-29] — Ionic alert/popover overlays render outside the component's shadow DOM — `scoped` styles never reach them. Any styling of `ion-select` alert internals (`.alert-radio-group`, `.alert-radio-button`, etc.) must be in a global stylesheet (e.g. `variables.css`) or injected dynamically into `document.head`.

[2026-05-29] — `<ion-icon name="icon-name">` renders invisibly when no global icon registry is configured. This project uses the tree-shakeable pattern: `import { addIcons } from 'ionicons'`, `import { iconName } from 'ionicons/icons'`, call `addIcons({ iconName })` in script setup, bind with `:icon="iconName"`. Never use the string `name=` attribute.

[2026-05-29] — Always rebuild (`npm run build`) and restart PM2 after any frontend change — Nginx serves `frontend/dist/` as static files, so changes to `.vue` files are not live until a build runs.

[2026-05-29] — `path.resolve(__dirname, '../../frontend/dist')` in compiled ESM resolves relative to the `.js` output file, not the source file — directory depth depends on `outDir`/`rootDir` config and changes silently when tsconfig changes. Use an absolute path constant (`/var/www/antri.iki.ae/frontend/dist`) for static asset roots that won't move.

[2026-05-29] — `npm ci --omit=dev` skips devDependencies including `typescript`/`tsc` — running `npm run build` after it fails with `tsc: not found`. Always `npm ci` (full), then `npm run build`, then `npm prune --omit=dev` to strip dev deps after the build.

[2026-05-29] — drizzle-kit v0.20 has no `migrate` CLI command (only `generate:sqlite`, `push:sqlite`, `studio`) — calling `drizzle-kit migrate` exits with "unknown command". Use `drizzle-orm/better-sqlite3/migrator` programmatically in a Node.js inline script instead. Pin the `db:migrate` npm script to that pattern for this version.

[2026-05-29] — `tsconfig.json` with `rootDir: ./src` rejects files imported from outside `src/` (e.g. `drizzle/schema.ts`) even if they're listed in `include` — TypeScript errors with TS6059. Set `rootDir: .` when the project imports across sibling directories; update compiled output paths accordingly (`dist/src/server.js` instead of `dist/server.js`).

[2026-05-29] — `ion-input` does not accept `type="color"` (TextFieldTypes union excludes it) — vue-tsc errors. Replace with a native `<input type="color">` styled inline. Similarly, `maxlength` on `ion-input` must be bound as `:maxlength` (number), not `maxlength` (string attribute).

[2026-05-29] — `onIonViewWillEnter` is exported from `@ionic/vue`, not from `vue` — importing it from `vue` compiles fine in some setups but fails in strict `vue-tsc`. Always import Ionic lifecycle hooks from `@ionic/vue`.

[2026-05-29] — `ion-input` shadow DOM padding collapses CSS floating labels at constrained heights — the `:not(:placeholder-shown)` trigger never fires cleanly because Ionic injects its own internal label element. Use native `<input>` + CSS for any form that needs floating labels. `ion-input` is fine for forms where label-placement="floating" is handled entirely by Ionic (no custom CSS float needed).

[2026-05-29] — Pinia stores are empty on page load when `restore()` and `load()` are not called before mounting — router guards that check store state always see unauthenticated. Always bootstrap stores before `app.mount()`. Use `Promise.allSettled` so a failed config load doesn't block the app.

[2026-05-29] — `app.use(router)` triggers the initial navigation synchronously — the router guard fires before any async `restore()` call resolves, even when `app.mount()` is deferred with `Promise.allSettled`. Fix: add a `restoreReady: Promise<void>` to the auth store (resolved in `finally` of `restore()`), and `await auth.restoreReady` at the top of the `beforeEach` guard. The guard becomes `async`. This guarantees the guard always sees the post-restore auth state.

[2026-05-29] — i18n key paths used in templates must exactly match the locale JSON structure. Flat key like `session.kiosk` fails silently if the locale file has `session.mode_kiosk`. Audit template `$t()` calls against both locale files before building.

[2026-05-29] — `rebuildQueueState()` is async but was called without `await` in all queueService mutation functions → always `await` async state-rebuild functions before returning from a mutation, even in sync-looking call sites.

[2026-05-29] — `callNext()` and `openSession()` had TOCTOU race: read then write in separate statements → any DB check that gates a write must be inside a single `db.transaction()` call.

[2026-05-29] — Backup import wrote directly to the live DB before validating migrations → always stage to a temp/`.incoming` path, validate fully, then atomically rename into place. Live DB should be the last thing touched.
