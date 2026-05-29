# Antri-Iki-Ae

**Antri Iki Ae** · Sistem Antrian Serbaguna — General-purpose queue management system

> *"Antri Iki Ae"* — Javanese for *"Just queue here"*. Built by [iki.ae](https://iki.ae)

> Multi-operator · Multi-display · Multi-category · Offline LAN · Real-time

Built by [iki.ae](https://iki.ae)

---

## Features

- **Multi-category queues** — A-001, B-001, C-001 with independent counters
- **Multi-operator** — each operator manages their own counter from a phone browser
- **Multi-display** — unlimited display screens subscribe via SSE, no login needed
- **Two session modes** — bulk-issued (PPDB) or self-service kiosk (walk-in)
- **Offline LAN** — runs entirely on a local Windows PC via WSL2, no internet needed
- **Export/import** — one-click backup and restore for updates
- **Multi-language** — Bahasa Indonesia default, configurable

## Surfaces

| Surface | URL | Who |
|---|---|---|
| Admin | `/admin` | Setup, session control, config |
| Operator | `/operator` | Call/recall/skip numbers (mobile) |
| Display | `/display` | Queue board for TV/monitor (public) |
| Kiosk | `/kiosk` | Self-service ticket issuance (public) |

## Stack

`Fastify` + `Drizzle ORM` + `SQLite` · `Ionic 8` + `Vue 3` + `Pinia` + `vue-i18n`

## Install (Windows)

1. Download `antri-iki-ae.tar` + `install.bat`
2. Double-click `install.bat`
3. Open browser → `http://localhost:3001`

## License

[Business Source License 1.1](./LICENSE) — free for non-commercial use.
Commercial installations: [hello@iki.ae](mailto:hello@iki.ae)

---

*Powered by [iki.ae](https://iki.ae)*
