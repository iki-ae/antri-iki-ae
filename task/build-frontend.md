# Task Brief: Frontend

> Read this before any frontend task: views, components, stores, routing, i18n, UI patterns.

---

## PROJECT STRUCTURE — FRONTEND

```
frontend/
├── dist/                        # Nginx serves this — output of `ionic build`
└── src/
    ├── main.ts
    ├── App.vue
    ├── i18n/
    │   ├── index.ts             # vue-i18n setup — locale loaded from config API
    │   └── locales/
    │       ├── id.json          # Bahasa Indonesia (default)
    │       └── en.json          # English
    ├── router/
    │   └── index.ts             # Routes + role guards
    ├── stores/
    │   ├── auth.ts              # Pinia — JWT payload, role, counter assignment
    │   ├── queue.ts             # Pinia — live queue state from SSE
    │   └── config.ts            # Pinia — institution config, locale
    ├── types/
    │   └── index.ts             # TypeScript interfaces
    ├── api/
    │   └── index.ts             # Axios instance + typed API calls
    ├── views/
    │   ├── admin/               # /admin/* — role: admin
    │   │   ├── AdminShell.vue   # ion-menu + ion-router-outlet
    │   │   ├── DashboardPage.vue
    │   │   ├── CategoriesPage.vue
    │   │   ├── CountersPage.vue
    │   │   ├── UsersPage.vue
    │   │   ├── SessionPage.vue  # Open/close + mode select + bulk-issue
    │   │   ├── ConfigPage.vue   # Institution name, locale, watermark preview
    │   │   └── BackupPage.vue   # Export / import
    │   ├── operator/            # /operator — role: operator
    │   │   └── OperatorPage.vue # Call next, recall, skip — mobile optimized
    │   ├── display/             # /display — public
    │   │   └── DisplayPage.vue  # Fullscreen, SSE, watermark, no Ionic chrome
    │   ├── kiosk/               # /kiosk — public
    │   │   └── KioskPage.vue    # Category picker → ticket number → auto-reset
    │   └── auth/
    │       └── LoginPage.vue
    └── components/
        ├── WatermarkFooter.vue  # "by iki.ae" — used in ALL views
        ├── QueueBoard.vue       # Reusable display board (display + admin dashboard)
        └── TicketNumber.vue     # Large formatted number (A-001 style)
```

---

## ROUTING & ROLE GUARDS

| Route | Surface | Auth |
|---|---|---|
| `/login` | Login | none |
| `/admin/*` | Admin shell | JWT role=admin |
| `/operator` | Operator | JWT role=operator |
| `/display` | Display board | none (public) |
| `/kiosk` | Kiosk | none (public) |

- Redirect `/admin` → `/login` if no valid JWT or wrong role
- Operator redirected to `/operator` on login — cannot access `/admin`

---

## AUTH — AXIOS INTERCEPTOR

`api/index.ts` must intercept 401 and redirect to login:
```typescript
api.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    authStore.clear();
    router.push('/login');
  }
  return Promise.reject(error);
});
```
Covers mid-session token expiry — operator redirected cleanly instead of silent failure.

---

## SSE — CLIENT SIDE

- `queue.ts` Pinia store subscribes to `GET /api/events`
- On message: parse `QueueState`, update store
- Display, Kiosk, and Operator views all use this store — no polling anywhere
- Reconnect on network drop — re-subscribe, get full state immediately

---

## i18n — FRONTEND

- Default locale: `id` (Bahasa Indonesia)
- Locale loaded on app start from `GET /api/config`, stored in `config` store
- All UI strings via `$t('key')` — zero hardcoded Indonesian in `.vue` files
- RTL: set `dir` on `<html>` from locale config. Current locales (`id`, `en`) are LTR. RTL infrastructure is present but Ionic component RTL support is partial and untested — do not assume RTL-safe without per-component verification if adding an RTL locale.

---

## UI PATTERNS

- **List pages:** search + filter + table/card + empty state
- **Forms:** inline modals preferred over separate pages
- **Lifecycle:** `onIonViewWillEnter` for data refresh — not `onMounted`
- **Date locale:** `id-ID` (default)
- **Destructive actions:** confirm with `ion-alert`
- **Async ops:** `ion-loading`
- **Feedback:** `ion-toast` for success/error

---

## DISPLAY PAGE — SPECIAL RULES

- NO `ion-header`, NO `ion-tab-bar`, NO `ion-menu`
- Full viewport: `height: 100dvh`, `overflow: hidden`
- Font sizes readable from 5 meters
- `WatermarkFooter` always rendered at bottom

---

## KIOSK PAGE — SPECIAL RULES

- NO `ion-header`, NO nav
- Large tap targets — minimum 120px buttons
- Auto-reset to category picker after 10 seconds via `setTimeout`
- Show ticket number full-screen after category selection
- Mode branching on load — check `session.mode` from `GET /api/display/state`:
  ```typescript
  if (state.session.mode === 'bulk') {
    // show branding page (Mode A)
  } else {
    // show category picker (Mode B)
  }
  ```
  Mode A branding page: full-screen, `antri.iki.ae` as the heading, large `iki.ae` barcode centered, no category picker. This is a holding screen — visitors are pre-issued tickets, the kiosk is not a point of entry.

---

## WATERMARK — NON-NEGOTIABLE

`WatermarkFooter.vue` must be imported and rendered in **every view.**

- Display: bottom-center, white text, always on top, visible from 3 meters
- Admin/Operator: subtle footer, 12px, muted color
- `ConfigPage.vue` shows a preview — does NOT allow removing "by iki.ae"
