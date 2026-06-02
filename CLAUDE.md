# Antri-Iki-Ae — Claude Code Context

**Product:** Multi-purpose queue management system
**Tagline:** IKI Antri · Sistem Antrian Multiguna
**Studio:** iki.ae — github.com/iki-ae/antri-iki-ae
**License:** GNU Affero General Public License v3.0 (AGPL-3.0)
**Watermark:** "by iki.ae" — hardcoded, always visible, non-removable via UI

---

## ENVIRONMENT

**This CLAUDE.md lives on the development server.** All file edits, commands, and builds run here.

- **Dev:** Proxmox 9.1 LXC (Debian 13 Trixie, minimum default template, no extra config) — accessed via VS Code Remote-SSH or Claude Code
- **App path:** `/var/www/antri.iki.ae/` · **PM2:** `antri-iki-ae-api` · **Port:** 3001
- **Serve:** Nginx (1.26.3) → Fastify on port 3001 → serves static `frontend/dist/` via `@fastify/static`
- **DB:** SQLite at `backend/data/antri-iki-ae.db`

---

## STACK

```
Backend:   Fastify + Drizzle ORM + better-sqlite3
Frontend:  Ionic 8 + Vue 3 + Pinia + vue-i18n
Language:  TypeScript (strict)
Auth:      JWT (jsonwebtoken) — httpOnly cookie — TTL: 9 hours
Real-time: SSE — one endpoint, all clients subscribe
i18n:      vue-i18n frontend + i18next backend — locale from config table
```

---

## CODE LANGUAGE RULE — STRICT

All code in English only: variable names, function names, file names, DB columns, routes, CSS classes, comments, commit messages, env vars, enums.

✅ `getNextTicket()` `isSessionOpen` `categoryPrefix` `counter_id`
❌ `getAntrian()` `sesiTerbuka` `prefixKategori` `id_loket`

**Exception:** UI strings belong in i18n locale files only (`id.json`, `en.json`).

---

## THINK BEFORE CODING

State assumptions explicitly before touching any file:

- **Which files change — and which don't?**
- **DB schema touched?** → migration required. Never edit `schema.ts` without generating one.
- **Ticket/session state changed?** → must call `broadcastQueueState()`.
- **Watermark affected?** → `WatermarkFooter.vue` must remain in every view. Non-negotiable.

- **Kiosk surface affected?** → In bulk mode (Mode A), kiosk shows a branded page (`antri.iki.ae` + `iki.ae` barcode) — not the category picker. Category picker is Mode B only.
- **Adding an RTL locale?** → RTL infrastructure is present (`dir` on `<html>`) but Ionic component RTL support is partial and untested. Do not assume RTL-safe without per-component verification.

Ambiguous? **Ask before proceeding.**

Always make a plan and ask for confirmation before executing anything.

---

## SELF-IMPROVEMENT LOOP

At the start of every session:
- Read `task/sessions.md` for current project status
- Read `task/lessons.md` for past mistakes before writing any code

At the end of every session:
- Update `task/sessions.md`: what was done, decisions made, what's next
- Append any mistakes to `task/lessons.md`: `[date] — what went wrong → rule to prevent it`

---

## WATERMARK — NON-NEGOTIABLE

The "by iki.ae" mark must be visible on every surface. Placement differs by surface:

| Surface | Placement | Component |
|---|---|---|
| Display (`/display`) | Bottom-center, white, visible from 3 meters | `WatermarkFooter.vue` variant="display" |
| Kiosk (`/kiosk`) | Header bar right — "powered by iki.ae" + QR pill | Inline in `KioskPage.vue` header (no `WatermarkFooter` component) |
| Operator (`/operator`) | Sidebar brand header — persistent | `OperatorShell.vue` sidebar — no per-page footer needed |
| Admin (`/admin/*`) | Sidebar brand header — persistent, always visible | `AdminShell.vue` sidebar — no per-page footer needed |
| Login | Card footer strip — "powered by iki.ae" + QR | Inline `<a>` strip in `LoginPage.vue` |

- Watermark text (`by iki.ae`) and URL (`https://iki.ae`) are hardcoded in the frontend — not DB-driven, not configurable via UI or API
- The QR is part of the watermark — not optional, not configurable
- On every boot, the backend integrity check force-resets `watermark_text = 'by iki.ae'` in the DB regardless of current value
- The PUT `/api/config` handler strips `watermark_text` from the body — it cannot be changed via API
- **Admin and Operator pages do NOT use `WatermarkFooter.vue`** — `WatermarkFooter.vue` is deleted; both surfaces use their sidebar brand header
- **Display and Kiosk** use inline "powered by iki.ae" + QR pill in the accent header

---

## GIT WORKFLOW

- GitHub is source of truth. Claude commits on request only — never auto-commits.
- Claude writes commit messages. English only.
- Logical completion points only — not mid-task.
- No `Co-Authored-By` trailers in commit messages.

---

## SESSION HYGIENE

Start a fresh Claude Code session per distinct task. Long sessions re-read full history on every turn.

---

## TESTING

1. Backend: focused route tests — PASS/FAIL only
2. Frontend: TypeScript type-check + critical path
3. Migrations: verify schema matches `schema.ts`
4. Skip: styling, read-only ops, translation strings

Output: `"Tests passed"` or `"Test failed: [error]"` — followed by a brief plain-English summary of what was tested and why it matters.

---

## TASK BRIEFS

Read the relevant brief before starting any task in that area:

| Task | Brief |
|---|---|
| Project progress + session log | `task/sessions.md` ← read first |
| Backend (routes, services, DB, SSE) | `task/build-backend.md` |
| Frontend (views, components, stores) | `task/build-frontend.md` |
| Installer / deployment scripts | `task/build-installer.md` |
| Mistakes log | `task/lessons.md` |

---

**Generate production-ready code. Indonesian UI by default (via i18n keys, not hardcoded strings).**

**CRITICAL OUTPUT RULE: Execute → Confirm → Stop. No unsolicited documentation.**
