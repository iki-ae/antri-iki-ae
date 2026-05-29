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
    │   │   ├── AdminShell.vue   # CSS flex shell: <aside> sidebar + .main router-outlet
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
    ├── stores/
    │   ├── auth.ts              # Pinia — JWT payload, role, counter assignment
    │   ├── queue.ts             # Pinia — live queue state from SSE
    │   ├── config.ts            # Pinia — institution config, locale
    │   └── sidebar.ts           # Pinia — admin sidebar open/collapsed state + mobile flag
    └── components/
        ├── WatermarkFooter.vue  # "by iki.ae" — Display, Kiosk, Operator only (NOT admin pages)
        ├── AdminPageHeader.vue  # Shared admin toolbar: hamburger + title + #end slot + logout
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

## PAGE BODY LAYOUT — ALL ADMIN PAGES

All admin pages wrap their `<ion-content>` body in a `.page-body` div. **No** `class="ion-padding"` on `<ion-content>`.

```html
<ion-content>
  <div class="page-body">
    <!-- page content -->
  </div>
</ion-content>
```

```css
.page-body {
  padding: 24px 16px 48px;
  min-height: 100%;
  background: var(--color-surface-alt);
}

.page-body > * {
  max-width: 480px;   /* constrains all direct children — left-aligned, not centered */
}
```

Rules:
- **Left-aligned** — no `justify-content: center`, no `margin: auto`
- `max-width: 480px` on direct children — keeps content at a comfortable reading width on wide screens; eliminates large unused space on desktop
- `background: var(--color-surface-alt)` on the page body
- Settings/form pages add a `.settings-card` wrapper inside `.page-body` for the bordered card look:
  ```css
  .settings-card {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border-radius: 12px;
    border: 1px solid var(--color-border);
    overflow: hidden;
  }
  ```
- `ion-fab` sits outside `.page-body` (uses `slot="fixed"`) — not affected by `max-width`
- `ion-modal` sits outside `.page-body` — not affected by `max-width`
- DashboardPage is the only exception — `QueueBoard` is a full-width display component

---

## INPUT FIELD PATTERN

Do **not** use `ion-input` for form fields. Use native `<input>` with CSS floating labels.

```html
<div class="field">
  <input id="x" type="text" placeholder=" " />
  <label for="x">Label Text</label>
  <span class="icon"><!-- SVG icon, right-aligned --></span>
</div>
```

Rules:
- `placeholder=" "` (single space) is required — the CSS float trigger depends on `:not(:placeholder-shown)`
- Label floats up on focus or when filled via: `input:focus ~ label, input:not(:placeholder-shown) ~ label`
- Floated state: `font-size: 10.5px`, `font-weight: 600`, `color: var(--color-accent)`, `text-transform: uppercase`
- Input height: `56px`, padding: `18px 44px 6px 16px` (top clears the floated label, right clears the icon)
- Focus ring: `border-color: var(--color-accent)` + `box-shadow: 0 0 0 3px rgba(224,140,47,0.12)`
- Icon slot: `position: absolute; right: 14px; top: 50%; transform: translateY(-50%)`
- Password toggle icon uses `pointer-events: all` and swaps SVG via `v-if/v-else` on `showPassword` — no JS DOM manipulation

---

## CARD FOOTER — WATERMARK STRIP

The card footer (used on `LoginPage` and any branded card) is a fully clickable `<a>` strip, not `WatermarkFooter.vue`.

```html
<a class="footer" :href="configStore.watermarkUrl" target="_blank" rel="noopener">
  <div class="footer-text">
    powered by
    <strong>iki.ae</strong>
  </div>
  <div class="qr">
    <img src="@/assets/qr-iki-ae.svg" alt="iki.ae" />
  </div>
</a>
```

Rules:
- Background: `var(--color-secondary)` — distinct from the page background
- Hover: `var(--color-secondary-dark)`
- Layout: `display: flex; align-items: center; justify-content: flex-end; gap: 12px`
- Text: right-aligned, `"powered by"` at 11px `rgba(255,255,255,0.65)`, `<strong>iki.ae</strong>` at 13px `rgba(255,255,255,0.95)`
- QR container: `38×38px` white rounded box (`border-radius: var(--radius-sm)`), image inside at `34×34px`
- QR asset: `src/assets/qr-iki-ae.svg` — encodes `https://iki.ae`, links to `configStore.watermarkUrl`
- The entire strip is the clickable target — no nested buttons

---

## ADMIN SHELL — LAYOUT PATTERN

`AdminShell.vue` uses a pure CSS flexbox layout — **no `ion-split-pane`, no `ion-menu`, no `menuController`.**

```
ion-page.shell  (display: flex; flex-direction: row)
  aside.sidebar          ← always-visible on desktop, overlay drawer on mobile
    a.sidebar-brand      ← accent header: "powered by iki.ae" + QR (watermark)
    nav.sidebar-nav      ← nav buttons, active item highlighted in primary blue
    div.sidebar-user     ← logged-in user name, pinned bottom
  div.main               ← flex: 1; contains ion-router-outlet
```

- Sidebar toggle state in `stores/sidebar.ts` (`isOpen`, `isMobile`, `toggle()`)
- Desktop collapse: `margin-left: -260px` transition; state persisted in `localStorage`
- Mobile (< 900px): `position: fixed; transform: translateX(-100%)` overlay + backdrop
- Child pages use `AdminPageHeader.vue` instead of inline `ion-header`

## ADMIN PAGE HEADER — PATTERN

All admin child pages use `AdminPageHeader.vue` — never write inline `ion-header` in admin pages.

```html
<AdminPageHeader />
```

The component renders: hamburger (toggles sidebar) → `configStore.institutionName` (Display Title). No `title` prop — all pages show the same institution name in the toolbar. No logout icon — logout lives in the sidebar.

**Logout** is a full-width `.sidebar-logout` button at the bottom of `AdminShell.vue`'s sidebar — danger text color, hover fill. Do not add logout to the page header.

**Page title** goes in `.card-header` inside `.page-body`, not in the toolbar:
```html
<div class="page-body">
  <div class="card-header">
    <h2 class="card-title">{{ $t('admin.nav.categories') }}</h2>
    <!-- optional: add button for desktop -->
    <button class="card-add-btn desktop-only" @click="openForm()">
      <ion-icon :icon="addOutline" />
    </button>
  </div>
  <!-- page content -->
</div>
```

`.card-header` styles are global in `variables.css` — do not repeat in scoped styles:
- `position: sticky; top: 0; z-index: 10` — sticks within the scroll container
- `background: var(--color-surface-alt)` — matches page body, covers scrolling content
- `border-bottom: 2px solid var(--color-primary)` — separator line
- `.card-title` color: `var(--color-primary)`
- `.card-add-btn`: primary blue, 36×36px, shown on desktop only
- `.desktop-only` hidden at `< 900px`; `.mobile-fab` hidden at `≥ 900px` — both rules in `variables.css`

**FAB pattern for list pages (Categories, Counters, Users):**
```html
<!-- Desktop: card-header button (class="card-add-btn desktop-only") -->
<!-- Mobile: FAB -->
<ion-fab class="mobile-fab" slot="fixed" vertical="bottom" horizontal="end">
  <ion-fab-button @click="openForm()">
    <ion-icon :icon="addOutline" />
  </ion-fab-button>
</ion-fab>
```

**Icon rule:** Always use `addIcons({ iconName })` from `ionicons` + `:icon="iconName"` bound ref. Never use `name="icon-name"` string — it only works with a global registry that this project does not configure.

## WATERMARK — NON-NEGOTIABLE

Placement differs by surface — see CLAUDE.md for the full table.

- **Admin pages:** watermark is in the `AdminShell.vue` sidebar brand header. Do NOT add `WatermarkFooter` to admin pages.
- **Display/Kiosk/Operator:** `WatermarkFooter.vue` still required.
- `ConfigPage.vue` shows a watermark text preview — does NOT allow removing "by iki.ae"
