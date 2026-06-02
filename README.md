# IKI Antri

**Multi-Purpose Queue Management System**
by [iki.ae](https://iki.ae) — [https://antri.iki.ae](https://antri.iki.ae)

---

> 🇮🇩 [Baca dalam Bahasa Indonesia](#bahasa-indonesia)

---

## English

### What is IKI Antri?

IKI Antri is a free, self-hosted queue management system designed for clinics, offices, schools, banks, corporations, and any organization that needs to manage a physical queue. It runs entirely on your own server — no cloud subscription, no high-end hardware required.

### Features

- **Kiosk mode** — visitors take a queue number themselves via a touchscreen
- **Bulk mode** — admin issues a batch of tickets in advance
- **Operator dashboard** — call, recall, skip, and serve tickets from any browser
- **Big display** — full-screen queue board with live announcements (Web Speech API)
- **Thermal printer support** — 55mm roll, tested on Android Chrome with ESC/POS printers
- **Multi-category** — independent queues per service category, each with its own counter
- **Per-category sessions** — open, close, and reset queues independently per category
- **Live updates** — SSE-based real-time sync across all connected surfaces
- **Admin panel** — manage categories, counters, users, sessions, and settings
- **Backup & restore** — export and import the full database as a ZIP file
- **Multilingual** — Indonesian and English built-in

### Tech Stack

| Layer | Technology |
|---|---|
| Backend | Fastify + Drizzle ORM + better-sqlite3 |
| Frontend | Ionic 8 + Vue 3 + Pinia + vue-i18n |
| Language | TypeScript (strict) |
| Auth | JWT — httpOnly cookie — 9h TTL |
| Real-time | Server-Sent Events (SSE) |
| Database | SQLite (WAL mode) |


### Easy Installation

Download the ready-to-deploy WSL image or VirtualBox VHD at [https://antri.iki.ae](https://antri.iki.ae) and follow the instructions. Free to use with no feature limitations.

Default credentials: `admin` / `antri123` — **change immediately after first login.**

### Surfaces

| URL | Purpose |
|---|---|
| `/` | Admin login |
| `/admin` | Admin panel |
| `/operator` | Operator dashboard |
| `/display` | Big display board (fullscreen) |
| `/kiosk` | Kiosk ticket terminal |

### License

IKI Antri is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

You are free to use, modify, and self-host this software. If you run a modified version as a public-facing internet service, you must make the modified source code available under the same license.

See [LICENSE](LICENSE) for the full license text.

### Support & Commercial Use

For paid support, customization, or hardware bundles:
**[https://support.iki.ae](https://support.iki.ae)**

Organizations or individuals that need to use IKI Antri commercially without AGPL obligations may contact us for a commercial license.

---

## Bahasa Indonesia

### Apa itu IKI Antri?

IKI Antri adalah sistem manajemen antrian gratis yang dapat di-*self-host*, dirancang untuk klinik, kantor, sekolah, bank, perusahaan, dan organisasi lain yang perlu mengelola antrian fisik. Berjalan sepenuhnya di server Anda sendiri — tidak memerlukan langganan cloud maupun spesifikasi hardware yang tinggi.

### Fitur

- **Mode Kios** — pengunjung mengambil nomor antrian sendiri melalui layar sentuh
- **Mode Bulk** — admin menerbitkan tiket dalam jumlah besar sekaligus
- **Dashboard Operator** — panggil, panggil ulang, lewati, dan selesaikan tiket dari browser mana pun
- **Layar Besar** — papan antrian layar penuh dengan pengumuman suara langsung
- **Dukungan printer thermal** — gulungan 55mm, diuji di Android Chrome dengan printer ESC/POS
- **Multi-kategori** — antrian independen per kategori layanan, masing-masing dengan loket sendiri
- **Sesi per-kategori** — buka, tutup, dan reset antrian secara independen per kategori
- **Pembaruan langsung** — sinkronisasi real-time berbasis SSE di semua perangkat
- **Panel admin** — kelola kategori, loket, pengguna, sesi, dan pengaturan
- **Cadangan & pulihkan** — ekspor dan impor database lengkap sebagai file ZIP
- **Multibahasa** — Indonesia dan Inggris sudah tersedia

### Instalasi Mudah

Unduh WSL image atau VirtualBox VHD siap pakai di [https://antri.iki.ae](https://antri.iki.ae) dan ikuti petunjuknya. Gratis digunakan tanpa batasan fitur.

Kredensial default: `admin` / `antri123` — **segera ganti setelah login pertama.**

### Tampilan / Halaman

| URL | Fungsi |
|---|---|
| `/` | Login admin |
| `/admin` | Panel admin |
| `/operator` | Dashboard operator |
| `/display` | Papan antrian layar besar |
| `/kiosk` | Terminal tiket kios |

### Lisensi

IKI Antri dilisensikan di bawah **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Anda bebas menggunakan, memodifikasi, dan menjalankan secara mandiri perangkat lunak ini di server Anda sendiri. Jika Anda menjalankan versi yang dimodifikasi sebagai layanan publik yang dapat diakses melalui internet, Anda harus membuat kode sumber yang telah dimodifikasi tersebut tersedia di bawah lisensi AGPL-3.0 yang sama.

Lihat [LICENSE](LICENSE) untuk teks lisensi lengkap.

### Dukungan & Penggunaan Komersial

Untuk dukungan berbayar, kustomisasi, atau paket hardware:
**[https://support.iki.ae](https://support.iki.ae)**

Organisasi atau individu yang perlu menggunakan IKI Antri secara komersial tanpa kewajiban AGPL dapat menghubungi kami untuk lisensi komersial.

---

*by [iki.ae](https://iki.ae)*
