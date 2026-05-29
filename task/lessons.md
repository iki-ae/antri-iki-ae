# Lessons — Institutional Memory

> Append after every correction or mistake: `[date] — what went wrong → rule to prevent it`
> Review at the start of every session before writing any code.

---

<!-- Entries go below, newest at top -->

[2026-05-29] — Pinia stores are empty on page load when `restore()` and `load()` are not called before mounting — router guards that check store state always see unauthenticated. Always bootstrap stores before `app.mount()`. Use `Promise.allSettled` so a failed config load doesn't block the app.

[2026-05-29] — i18n key paths used in templates must exactly match the locale JSON structure. Flat key like `session.kiosk` fails silently if the locale file has `session.mode_kiosk`. Audit template `$t()` calls against both locale files before building.

[2026-05-29] — `rebuildQueueState()` is async but was called without `await` in all queueService mutation functions → always `await` async state-rebuild functions before returning from a mutation, even in sync-looking call sites.

[2026-05-29] — `callNext()` and `openSession()` had TOCTOU race: read then write in separate statements → any DB check that gates a write must be inside a single `db.transaction()` call.

[2026-05-29] — Backup import wrote directly to the live DB before validating migrations → always stage to a temp/`.incoming` path, validate fully, then atomically rename into place. Live DB should be the last thing touched.
