# Session Summary — Antri-Iki-Ae

> Update this at the end of every session: what was done, what's next, any decisions made.
> Read this at the start of every session before reading task briefs.

---

## Current Status

**Phase:** Active Development — installer complete, Nginx running, frontend served
**Last updated:** 2026-05-29 (Session 18)

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

### 2026-05-29 — Session 18
**Did:** Display page full redesign:
- `LoginPage.vue`: "Big Display Mode" quick-link now uses `href="/display"` (full navigation) instead of `router.push` — more reliable cross-browser, ensures clean SSE state on display load
- `TicketNumber.vue`: added `md` size variant (`clamp(1.4rem, 4vh, 3.2rem)`)
- `DisplayPage.vue` complete rewrite — new layout:
  - Fixed `1024×768` frame (`display-frame`) centered in full-viewport shell (`display-root`); background outside frame matches `--color-surface-alt` (light)
  - Full-width accent header (56px): institution name left, "powered by iki.ae" + QR pill right
  - Body splits into left panel (390px / ~40%) and right panel (flex: 1 / ~60%)
  - **Left panel:** two slots — top 70% (current call card) + bottom 30% (previous call card, `#fefdff` bg). Current: counter label 40px/800, number 100px/900. Previous: same layout at 28px/68px, 0.65 opacity
  - **Right panel:** queue board grouped by category (mirrors admin dashboard) — category colored header + counter boxes grid; `flex-grow` per section proportional to grid row count so all counter boxes are equal size regardless of category counter count. Right panel fills top-to-bottom with no scroll
  - **Animations:** number blinks 5× at 1s/step-end on new call; matching counter box flashes once with 5s ease-out color fade in category color tint; both reset cleanly on rapid successive calls via `requestAnimationFrame` + timer clear
  - **Previous ticket tracking:** `watch` on `lastCalled` captures outgoing value into `prevCalled` ref on each change
  - `lastCalled` extended with `counterId` to identify which counter box to flash

**Decided:**
- Fixed px sizes (not `vw` clamp) inside `display-frame` — `vw` references viewport not frame, giving wrong sizes on larger screens
- `flex-grow` proportional to `ceil(counterCount / COLS)` (COLS=5) distributes right panel height correctly across categories with different counter counts — equal row height across all categories
- Previous ticket stored in component state (not backend) — `QueueState` has no history; a `watch` on the computed `lastCalled` captures the outgoing value before it's replaced

**Next:** Pack WSL2 distribution tar, README/deployment guide.

---

### 2026-05-29 — Session 17
**Did:** Dashboard counter box fixes + skipped badge:
- Fixed `TicketNumber` overflow in 160px counter boxes: added `size="sm"` prop (`1.75rem / 800 weight`) — operator page keeps default large hero size, dashboard passes `size="sm"`
- Updated counter box style to match operator `.ticket-card`: white surface card, `border-radius: var(--radius-lg)`, `border: 1px solid var(--color-border)`, 4px colored top border in category color (always, not conditional); cards sit on `var(--color-surface-alt)` tray with `12px` gap
- Removed `counter-box--active` conditional class — top border is always category-colored (matches operator card's always-primary top border)
- Added skipped count badge to category header: `skippedMap` computed aggregates `state.skipped[]` by `category_id`; badge uses `ticket.skipped` i18n key; shown only when count > 0; sits alongside waiting badge in a `header-badges` flex row

**Next:** Pack WSL2 distribution tar, README/deployment guide.

---

### 2026-05-29 — Session 16
**Did:** Operator dashboard overhaul — full UX redesign + skipped number recall feature:

**Operator Shell + Routing:**
- Converted `/operator` from a flat route to a shell+children pattern matching admin: `OperatorShell.vue` + `/operator/dashboard` + `/operator/settings`
- `OperatorShell.vue`: same CSS flex sidebar as `AdminShell` — brand header (watermark), nav (Dashboard + Settings), user name footer, logout row; `WatermarkFooter variant="subtle"` rendered once in the main column
- `OperatorDashboard.vue`: queue/action content, uses `AdminPageHeader` for hamburger; removed inline logout
- `OperatorSettings.vue`: floating-label inputs for Operator Name + password change; uses `.page-body` + `.settings-card` layout
- `PUT /api/users/me` backend endpoint (behind `requireAuth`) for self-update of name/password

**Dashboard layout decisions:**
- Now Serving box always rendered (no v-if); idle state shows `——` at 80px (same height as ticket number)
- Counter label prepended to Now Serving label: "Counter A-1 — Now Serving"
- Waiting count removed from standalone row — shown only in counter preview header
- Action button layout: Recall (full width, top) / Done Serving | Skip | Call Next (3-col, bottom)
- Recall uses filled `refreshCircle` icon (visually bolder than outline variant)
- Bottom row buttons: `72px` height, smaller icon/text; Recall: `120px`, 48px icon, 24px bold text
- State machine: has ticket → Recall/Done/Skip enabled, Call Next + skipped recall disabled; no ticket → Call Next + skipped recall enabled, Recall/Done/Skip disabled
- `busy` ref guards all actions — prevents double-tap and race conditions; replaces the old `calling` ref
- Disabled buttons: `opacity: 0.15`, `pointer-events: none`, no hover color change

**Counter preview section:**
- Replaced CSS grid approach (caused uneven heights) with independent flex cards (`flex-wrap`)
- Each `.counter-card` is self-contained — height equality from identical content, not grid constraints
- Colored category header bar with waiting badge (always visible, `0 Belum Dipanggil` when empty)
- `counter-card--mine` highlighted with `--color-surface-alt` background
- `max-width: 480px` matches other card elements

**Skipped number recall:**
- Backend: `skipped[]` array added to `QueueState` + `rebuildQueueState()` — ordered by ticket number, filtered per SSE broadcast
- Backend: `callSkippedTicket(ticket_id, counter_id)` in `queueService.ts` — validates `status === 'skipped'`, sets `called` + assigns counter, broadcasts
- Backend: `POST /api/tickets/call-skipped` route — uses `request.user.counterId` from JWT
- Backend: fixed missing `await` on all 4 existing ticket route handlers (pre-existing bug)
- Frontend: `skipped[]` added to `QueueState` type; `ticketsApi.callSkipped(id)` added
- Frontend: `categorySkipped` computed — filters to operator's own category; SSE-driven (list updates on all operator clients instantly)
- Skipped list renders below counter preview — only when `categorySkipped.length > 0`; each row: ticket number + accent "Panggil Ulang" button; disabled when operator has a current ticket

**i18n:** Added `operator.nav.*`, `operator.settings.*`, `operator.skipped.*` keys to both locales. `operator.waiting` → "Belum Dipanggil" (ID). Operator Name label → "Nama Operator" (ID).

**Decided:**
- CSS grid `auto-fill` for counter boxes causes uneven row heights when cells have variable content — use independent flex cards instead
- Operator shell reuses `useSidebarStore` (one shell active at a time, no conflict)
- Skipped recall is SSE-driven: clicking recall on one operator's screen removes the ticket from all other operators' skipped lists instantly
- `busy` single ref replaces per-action flags — simpler, prevents all concurrent action firing

**Next:** Pack WSL2 distribution tar, README/deployment guide.

---

### 2026-05-29 — Session 15
**Did:** Login page quick-access buttons (Display / Kiosk):
- Added two buttons below the login card, wrapped in a second card (`quick-links`)
- Container switched to `flex-direction: column` so the second card stacks below the login card
- Display first, Kiosk second; labels "Big Display Mode" / "Kiosk Mode" (i18n: `nav.display` / `nav.kiosk`)
- Icons: `easelOutline` (Display) and `ticketOutline` (Kiosk) — imported via `addIcons` + `:icon=` pattern
- Added `nav.display` / `nav.kiosk` keys to both `en.json` and `id.json`
- Frontend rebuilt and PM2 restarted

**Decided:** Icons must always use `addIcons` + `:icon=` — `name=` string attribute was tried first and rendered nothing (no CDN loaded). This is already a documented lesson.

**Next:** Pack WSL2 distribution tar, README/deployment guide.

---

### 2026-05-29 — Session 14
**Did:** Dashboard QueueBoard redesign + bug fix:
- Fixed in-memory queue state not surviving PM2 restarts: added `await rebuildQueueState()` in `server.ts` before `app.listen()` — state now hydrated from DB on every startup
- Rewrote `QueueBoard.vue`: counters now grouped by category; each category is a bordered card section with a colored header bar (category prefix + name + waiting count badge); counters inside use CSS grid (`repeat(auto-fill, minmax(160px, 1fr))`) for uniform box sizing; box title follows CountersPage standard: `$t('counter.label') + ' ' + prefix + '-' + counter.name` (e.g. "Loket A-1")
- Counter boxes: `border-right` on all boxes (card `overflow:hidden` clips rightmost cleanly — no open edge); `border-bottom` on all boxes for mobile row separators; active counter gets 3px top border in category color via CSS custom property `--cat-color`

**Decided:** CSS grid `auto-fill` + `minmax(160px, 1fr)` gives consistent box width — all cells same size including last row. `border-right` kept on last child (not removed) so card edge acts as natural terminator.

**Next:** Pack WSL2 distribution tar, README/deployment guide.

---

### 2026-05-29 — Session 13
**Did:** Admin shell + all admin pages UI overhaul:
- `AdminPageHeader.vue`: removed logout button and `title` prop; toolbar now shows `configStore.institutionName` (Display Title) only; hamburger remains
- `AdminShell.vue`: added `doLogout()` + `.sidebar-logout` — full-width danger-color row at the bottom of the sidebar; `logOutOutline` icon imported
- All 7 admin pages: removed `:title` prop from `<AdminPageHeader />`; added `.card-header` inside `.page-body` with page title (primary color) + `border-bottom: 2px solid var(--color-primary)` separator; sticky (`position: sticky; top: 0; background: var(--color-surface-alt)`)
- Categories, Counters, Users: desktop add button in `.card-header` right slot (primary blue); FAB hidden on desktop (`@media ≥ 900px`); mobile unchanged (FAB shown, header button hidden)
- ConfigPage: Watermark URL + Preview sections removed; Institution Name defaults to `iki.ae` if blank; per-field Save buttons; Language selector auto-saves + `window.location.reload()`
- i18n: `config.institutionName` label → "Display Title" (EN) / "Judul Tampilan" (ID)
- All `.card-header` / `.card-add-btn` / `.card-title` / responsive FAB rules consolidated in `variables.css` — scoped styles stripped from all pages

**Decided:** Card header is inside `.page-body` (constrained to `max-width: 480px`), not full-width — keeps the mobile-card approach consistent. Global card-header styles live in `variables.css`.

**Next:** Pack WSL2 distribution tar, README/deployment guide.

---

### 2026-05-29 — Session 12
**Did:** ConfigPage overhaul + layout rule established:
- Replaced `ion-list`/`ion-item`/`ion-input`/`ion-select` with native `<input>`/`<select>` + CSS floating-label pattern per build-frontend.md spec
- Removed Watermark URL and Watermark Preview sections (no longer exposed in UI)
- Removed section heading labels (redundant with floating labels)
- Card aligned left (not centered) — `max-width: 480px`, block flow, `padding: 24px 16px 48px`
- Institution Name defaults to `iki.ae` if empty on load
- Institution Name and Watermark URL each have an inline Save button (per-field save, no bottom submit)
- Language selector auto-saves and calls `window.location.reload()` on change
- Renamed i18n key `config.institutionName` value → "Display Title" (EN) / "Judul Tampilan" (ID) — key unchanged

**Decided:** Left-aligned mobile-card-width body (`max-width: 480px`, left-aligned, padded page background) is the standard layout for all admin settings/form pages — not full-width, not centered. Documented in `task/build-frontend.md`.

**Next:** Pack WSL2 distribution tar, README/deployment guide.

---

### 2026-05-29 — Session 11
**Did:** UsersPage overhaul:
- Added `DELETE /:id` route to `backend/src/routes/users.ts` — rejects self-deletion and last-admin deletion at API level
- Added `id` field to `stores/auth.ts` (loaded from `/auth/me`) — required for self-delete guard in frontend
- Added `usersApi.remove(id)` to `frontend/src/api/index.ts`
- Rewrote `UsersPage.vue`:
  - Replaced header add button with `ion-fab` (bottom-right)
  - Admin group: `--ion-color-primary` header
  - Operator group: split by category — one colored header per category (`cat.color`), label `prefix — name` matching CountersPage pattern; unassigned operators fall through to a plain "Operator" group
  - Edit + delete icons per row; delete hidden when `u.id === auth.id` (self) or when only one admin remains; confirmation alert before delete
  - Counter label in operator subtitle: `Counter: A-Counter 1` format (i18n `counter.label` + `prefix-name`)
  - Role selector hidden in edit modal (new user only)
  - Counter select: grouped by category with colored disabled headers + `prefix-name` options; scrollable alert with visible scrollbar (`scrollbar-width: thin` + webkit rules in `variables.css`); dynamic per-category header colors injected via `watchEffect` into `document.head`

**Next:** Pack WSL2 distribution tar, README/deployment guide.

---

### 2026-05-29 — Session 10
**Did:** CategoriesPage FAB + icon fix:
- Added `ion-fab` + `ion-fab-button` (bottom-right) to `CategoriesPage.vue` as the primary create action
- Removed the header add button (was in `AdminPageHeader` `#end` slot) — FAB is the sole create entry point
- Fixed all three icons on the page (header add, row pencil, FAB add) — were using `name="..."` string binding which requires a global registry this project doesn't use; replaced with `addIcons()` + `:icon="..."` bound refs (`addOutline`, `pencilOutline` from `ionicons/icons`)
- Rebuilt frontend + restarted PM2

**Next:** Pack WSL2 distribution tar, README/deployment guide.

---

## Up Next

- [x] Nginx config — `nginx/antri-iki-ae.conf` template + wired into `install.sh`
- [x] Frontend static serving — `@fastify/static` registered in `server.ts`
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

### 2026-05-29 — Session 9
**Did:** Fixed page-refresh redirect-to-login bug:
- Root cause: `app.use(router)` triggers the initial navigation before `authStore.restore()` (the `/me` API call) resolves — guard saw `isLoggedIn = false` and sent users to `/login` every time
- Added `restoreReady: Promise<void>` to `stores/auth.ts` — resolved in the `finally` block of `restore()` so it always settles (success or 401)
- Updated `router/index.ts` guard to `async` and `await auth.restoreReady` before any auth check
- Rebuilt frontend (clean Vite build)

**Next:** Pack WSL2 distribution tar, README/deployment guide.

### 2026-05-29 — Session 8
**Did:** Admin sidebar redesign — replaced `ion-split-pane`/`ion-menu` with a pure CSS flexbox layout:
- Dropped `ion-split-pane`, `ion-menu`, `menuController` from `AdminShell.vue` entirely
- Sidebar is now a plain `<aside>` in a flex-row `ion-page`: brand header (top) + nav (middle, scrollable) + user name (bottom)
- Desktop: sidebar always visible, collapses via `margin-left: -260px` on toggle; state persisted in `localStorage` under `antri_sidebar_open`
- Mobile (< 900px): fixed overlay drawer + semi-transparent backdrop, closes on backdrop click or navigation
- Added `stores/sidebar.ts` — Pinia store for `isOpen`, `isMobile`, `toggle()`, `setMobile()` — shared between shell and child headers
- Added `components/AdminPageHeader.vue` — shared `ion-header` with hamburger (start) + title + optional `#end` slot + logout icon (end); used by all 7 admin child pages
- Updated all 7 admin pages (`DashboardPage`, `SessionPage`, `ConfigPage`, `BackupPage`, `CategoriesPage`, `CountersPage`, `UsersPage`) to use `AdminPageHeader` — removed their inline `ion-header`/`ion-toolbar`/`ion-title`
- Pages with an action button (`CategoriesPage`, `CountersPage`, `UsersPage`) pass it via `<template #end>`
- Sidebar brand header: accent background, right-aligned "powered by / **iki.ae**" text + white-boxed QR, links to `configStore.watermarkUrl`
- All admin toolbars accent-colored via scoped `:deep(ion-toolbar)` in the shell; modal toolbars keep primary blue
- Removed `WatermarkFooter` from all 7 admin pages — sidebar brand header is the sole watermark for the admin surface

**Decided:** Admin watermark exposure moves from per-page subtle footer to persistent sidebar brand header. Footer repetition dropped — sidebar is always visible throughout the admin session, providing sufficient exposure.

**Next:** Pack WSL2 distribution tar, README/deployment guide.

### 2026-05-29 — Session 7
**Did:** Installer polish + frontend static serving:
- Added `@fastify/static` to `backend/package.json` dependencies; registered in `server.ts` with SPA fallback (`setNotFoundHandler` → `sendFile('index.html')`)
- Fixed static path: `path.resolve(__dirname, '../../frontend/dist')` resolved to wrong path at runtime (`backend/frontend/dist`) — replaced with hardcoded absolute `/var/www/antri.iki.ae/frontend/dist`
- Fixed `install.sh` Node.js version check — broken `process.exit()` eval with shell-escaped quotes; replaced with `process.stdout.write()` + integer comparison
- Fixed `install.sh` build step: `npm ci --omit=dev` skips `tsc` (dev dep) — changed to `npm ci` + `npm run build` + `npm prune --omit=dev`; same fix applied to `update.sh`
- Added `nginx/antri-iki-ae.conf` vhost template with `envsubst` placeholders; `install.sh` now renders it via `envsubst` instead of inline heredoc
- Translated all installer scripts from Indonesian to English (code language rule)
- Added bilingual language selection (English default / Indonesian) to `install.sh`, `update.sh`, `install.bat`, `update.bat` — prompt shown after banner
- Updated CLAUDE.md: corrected Serve line (Nginx 1.26.3 now installed and active)

**Decided:** Frontend dist path in `server.ts` is hardcoded absolute — `__dirname` relative traversal is unreliable across compiled output directory depths.

**Next:** Pack WSL2 distribution tar, README/deployment guide.

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
