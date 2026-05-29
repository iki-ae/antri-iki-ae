# Antri-Iki-Ae — Claude Code Context

**Product:** Generic multi-purpose queue management system
**Tagline:** Antri Iki Ae · Sistem Antrian Serbaguna
**Studio:** iki.ae — github.com/iki-ae/antri-iki-ae
**License:** Business Source License 1.1 (BSL)
**Watermark:** "by iki.ae" — hardcoded, always visible, non-removable via UI

---

## ENVIRONMENT

**This CLAUDE.md lives on the development server.** All file edits, commands, and builds run here.

- **Dev:** Proxmox LXC (Debian 12) — accessed via VS Code Remote-SSH or Claude Code Remote Control over Tailscale
- **App path:** `/var/www/antri-iki-ae/` · **PM2:** `antri-iki-ae-api` · **Port:** 3001
- **Serve:** Nginx → Fastify + static `frontend/dist/`
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
- Read `tasks/sessions.md` for current project status
- Read `tasks/lessons.md` for past mistakes before writing any code

At the end of every session:
- Update `tasks/sessions.md`: what was done, decisions made, what's next
- Append any mistakes to `tasks/lessons.md`: `[date] — what went wrong → rule to prevent it`

---

## WATERMARK — NON-NEGOTIABLE

`WatermarkFooter.vue` imported in **every view including Display and Kiosk.**

```
"by iki.ae"  ·  [small QR/barcode]
```

- Display: bottom-center, white, visible from 3 meters, always on top
- Admin/Operator: subtle footer, 12px, muted
- Config page shows preview only — cannot remove "by iki.ae"
- `watermark_url` in config = customizable WA/website link (affects the barcode target)
- The barcode is part of the watermark component — not optional, not configurable

---

## GIT WORKFLOW

- GitHub is source of truth. Claude commits on request only — never auto-commits.
- Claude writes commit messages. English only.
- Logical completion points only — not mid-task.

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
| Project progress + session log | `tasks/sessions.md` ← read first |
| Backend (routes, services, DB, SSE) | `tasks/build-backend.md` |
| Frontend (views, components, stores) | `tasks/build-frontend.md` |
| Installer / deployment scripts | `tasks/build-installer.md` |
| Mistakes log | `tasks/lessons.md` |

---

**Generate production-ready code. Indonesian UI by default (via i18n keys, not hardcoded strings).**

**CRITICAL OUTPUT RULE: Execute → Confirm → Stop. No unsolicited documentation.**
