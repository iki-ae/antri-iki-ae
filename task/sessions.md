# Session Summary — Antri-Iki-Ae

> Update this at the end of every session: what was done, what's next, any decisions made.
> Read this at the start of every session before reading task briefs.

---

## Current Status

**Phase:** Active Development — Phase 1 blockers resolved (again), server running
**Last updated:** 2026-05-29 (Session 6)

---

## What's Been Built

- Full backend scaffold (all 11 routes, services, SSE, auth)
- Full frontend scaffold (all views, stores, i18n, components)
- DB schema + migration (Drizzle, SQLite WAL)
- Seed: config row + default admin user (`admin` / `admin123`)
- Frontend built to `dist/`
- PM2 running (`antri-iki-ae-api`, port 3001)

---

## In Progress

_Nothing yet._

---

## Up Next

- [ ] Nginx config (standalone, not CloudPanel) — done inline in install.sh; may need separate `/etc/nginx/sites-available/antri-iki-ae` template for manual installs
- [ ] Pack WSL2 distribution tar (`wsl --export`) for distribution
- [ ] README / deployment guide

---

## Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-29 | CloudPanel deployments use `--skip-nginx` flag | CloudPanel owns Nginx config |

---

## Session Log

_Entries go here, newest at top._

### 2026-05-29 — Session 6
**Did:** Fresh-session audit + Phase 1 re-run (dev environment had no node_modules, no dist, PM2 not running):
- Installed backend + frontend npm deps (`npm install`)
- DB_PATH mismatch already fixed in code from prior sessions — confirmed correct
- Ran `db:generate:sqlite` + applied migrations programmatically (drizzle-kit v0.20 quirk — `migrate` command doesn't exist; used `drizzle-orm/better-sqlite3/migrator` directly)
- Fixed `package.json` `db:generate`/`db:migrate` scripts to use correct drizzle-kit v0.20 commands
- Fixed `tsconfig.json` `rootDir` (`./src` → `.`) — schema.ts outside src/ broke `tsc`
- Updated `ecosystem.config.cjs` script path to `./dist/src/server.js` (consequence of rootDir change)
- Installed missing `@types/archiver` + `@types/unzipper`
- Fixed frontend TS errors: `configStore` computed refs (`watermarkUrl`, `watermarkText`, `institutionName`), `onIonViewWillEnter` moved from `vue` → `@ionic/vue` imports in `DashboardPage.vue` + `OperatorPage.vue`, `DisplayPage.vue` `:value` → `:display-number`, `AdminShell.vue` `auto-hide` → `:auto-hide`, `CategoriesPage.vue` `maxlength="2"` → `:maxlength="2"` + native `<input type="color">` replacing `ion-input type="color"`, `SessionPage.vue` `HTMLInputElement` → `HTMLIonInputElement` cast
- Built backend (`tsc` clean) + frontend (Vite clean)
- Installed PM2 globally, started process, saved list
- Verified: health ✓, config ✓, login ✓
- Committed all unstaged pre-existing changes (Sessions 2–5 work): installer scripts bilingual polish, `@fastify/static` SPA serving, CLAUDE.md env update

**Decided:** `db:migrate` npm script now uses inline Node.js ESM to call `drizzle-orm` migrator directly — drizzle-kit v0.20 does not have a `migrate` CLI command.

**Next:** Phase 2 correctness bugs (already done in Session 2 per log — verify they're still in the built code), then Nginx config template, WSL2 tar packaging, README.

### 2026-05-29 — Session 5
**Did:** Login page redesign (UI polish only — no backend changes, no schema changes):
- Rewrote `LoginPage.vue` from scratch using native `<input>` + CSS floating-label pattern (dropped `ion-input` — Ionic component padding collapses floating labels at small heights)
- Accent header band (`--color-accent`) with decorative circles; brand `antri.iki.ae` with dimmed `antri.` prefix; tagline via `$t('app.tagline')`
- Floating labels: CSS-only float via `:not(:placeholder-shown)` + `:focus ~ label`; accent focus ring; right-side SVG icon slot
- Password field: `lock-closed-outline` start icon + eye/eye-off SVG toggle via `v-if/v-else` on `showPassword`
- Login button: accent color, uppercase, letter-spacing, hover darkens + lifts 1px
- Footer: fully clickable `<a>`, secondary-color background, right-aligned "powered by / **iki.ae**" text, 38×38px white QR box (34px image inside)
- Added `frontend/src/assets/qr-iki-ae.svg` — real QR encoding `https://iki.ae`, generated via `qrcode` npm dev dep
- Added `frontend/public/favicon.ico` — 32+16px, accent background, white QR modules
- Documented input field pattern and card footer pattern in `task/build-frontend.md`

**Decided:** Use native `<input>` + CSS for all auth/card form fields — not `ion-input`. Ionic's shadow DOM padding is incompatible with CSS floating-label technique at constrained heights.

**Next:** Nginx config template, WSL2 tar packaging, README/deployment guide.

### 2026-05-29 — Session 4
**Did:** Phase 4 — installer & deployment scripts, all 5 files written:
- `install.bat` — rewritten: added admin check, WSL2 check, tar presence check, copies `portproxy-refresh.bat` to `C:\antri-iki-ae\`, registers Task Scheduler task (`AntriIkiAe-PortProxy`) at logon with highest privilege, deletes stale portproxy rule before adding new one
- `portproxy-refresh.bat` — standalone WSL2 IP refresh script; runs silently at logon; handles missing IP gracefully
- `update.bat` — guided 3-step update: backup prompt → WSL unregister+reimport → portproxy refresh + portproxy-refresh.bat copy → restore prompt
- `install.sh` — full Linux installer: Node.js LTS via NodeSource, PM2, `npm ci`, `db:migrate`, PM2 startup; Nginx config with SSE directives (`proxy_read_timeout 3600s`, `proxy_buffering off`); `--skip-nginx` flag for CloudPanel; domain via `$ANTRI_DOMAIN` env or hostname fallback
- `update.sh` — guided 3-step: backup prompt → optional `rsync` of new files, `npm ci`, `npm run build`, `db:migrate`, PM2 restart → restore prompt

**Next:** Pack WSL2 tar for distribution, README/deployment guide.

### 2026-05-29 — Session 3
**Did:** Phase 3 — frontend correctness, 8 bugs fixed:
- Added Axios 401 interceptor — clears auth store and redirects to `/login` on token expiry
- Fixed app bootstrap in `main.ts` — `authStore.restore()` + `configStore.load()` now run before router guard fires; page refresh no longer bounces logged-in users to `/login`
- Rewrote `KioskPage.vue` — replaced broken `kioskApi.status()` call (route didn't exist) with `displayApi.state()`; added Mode A bulk branding screen (antri.iki.ae heading + iki.ae barcode) and Mode B category picker; proper mode branching on session.mode
- Fixed all missing i18n keys in both `id.json` and `en.json`: `admin.nav.*`, `operator.*`, `session.kiosk/bulk/active/confirmClose/confirmReset/resetWarning`, `user.*`, `config.*`, `kiosk.pickCategory/yourNumber/autoReset/unavailable/bulkHint`, `backup.exportDesc/importDesc/download/restore`, `auth.invalidCredentials`, `errors.PREFIX_LOCKED`
- Fixed `SessionPage.vue` — replaced hardcoded Indonesian alert strings with `useI18n()` `t()` calls
- Fixed `ConfigPage.vue` — watermark preview shows `configStore.watermarkText` instead of hardcoded English string; save now reloads config store and uses i18n toast
- Added `variant="subtle"` to `<WatermarkFooter />` in all 7 admin pages + OperatorPage
- Build: clean `vue-tsc` + Vite. PM2 restarted.

**Next:** Nginx config, install scripts (install.sh, install.bat, portproxy-refresh.bat, update.sh, update.bat).

### 2026-05-29 — Session 2
**Did:** Phase 2 correctness bugs — all 6 fixed:
- `callNext()` wrapped in `db.transaction()` — read+update atomic, prevents two operators claiming the same ticket
- `openSession()` wrapped in `db.transaction()` — check+insert atomic, prevents duplicate open sessions
- All `rebuildQueueState()` callers in `queueService.ts` now `await`ed; affected functions made `async` — state is guaranteed rebuilt before broadcast fires
- JWT TTL corrected from `12h` → `9h` (spec requirement)
- `PUT /api/categories/:id` now rejects prefix changes with `409 PREFIX_LOCKED` if the category has tickets in the current open session
- Backup import rewritten: writes to `.incoming`, runs Drizzle migrations on it, only swaps to live if migrations pass; live DB never touched on failure

**Build:** Clean `tsc` — no errors. PM2 restarted, server online.

**Next:** Phase 3 — frontend correctness + UX audit (operator view, admin pages, display, kiosk).

### 2026-05-29 — Session 1
**Did:** Full codebase audit (first run). Fixed all Phase 1 blockers:
- Installed backend + frontend npm dependencies
- Fixed DB_PATH mismatch (was `/var/www/antri-iki-ae/`, corrected to `/var/www/antri.iki.ae/`) in `database.ts`, `backup.ts`, `drizzle.config.ts`, `ecosystem.config.cjs`
- Fixed `tsconfig.json` `rootDir` (was `./src`, changed to `.` to include `drizzle/schema.ts`)
- Updated `ecosystem.config.cjs` script path to `./dist/src/server.js`
- Fixed `db:generate`/`db:migrate` npm scripts for drizzle-kit v0.20
- Generated + applied first migration (7 tables)
- Added seed logic to `database.ts` (config row id=1, default admin user)
- Added missing `@types/archiver` and `@types/unzipper` dev deps
- Fixed frontend TypeScript errors blocking `vue-tsc`: `configStore` computed refs, `onIonViewWillEnter` import source, `DisplayPage.vue` prop names, `AdminShell.vue` `:auto-hide`, `CategoriesPage.vue` `maxlength`/`type="color"`, `SessionPage.vue` cast
- Built frontend (`dist/` created)
- Started PM2, saved process list

**Decided:** Default admin credentials: `admin` / `admin123` — must be changed before production.

**Next:** Phase 2 correctness bugs — `callNext()` transaction, `openSession()` transaction, `rebuildQueueState()` missing await, backup import atomicity, prefix change protection, JWT TTL fix.

<!-- Format:
### [Date] — Session N
**Did:** ...
**Decided:** ...
**Next:** ...
-->
