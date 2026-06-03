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
- **Backup & restore** — export and import the full database as a .db file
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


### Easy Installation (Windows 11)

Download the ready-to-deploy WSL image at [https://antri.iki.ae](https://antri.iki.ae) and follow the instructions. Free to use with no feature limitations.

Default credentials: `admin` / `antri123` — **change immediately after first login.**

### Clean Installation (Windows 11)

> Requires Windows 11. If unsure, use the Easy Installation method above.

**Step 1 — Enable WSL2**

Open PowerShell as Administrator and run:
```powershell
wsl --install Debian
```
When prompted, restart your PC.

**Step 2 — Set up IKI Antri**

After restart, open PowerShell as Administrator and run all of these one by one:
```powershell
wsl -d Debian -- bash -c "sudo apt-get update && sudo apt-get install -y git"
wsl -d Debian -- bash -c "sudo git clone https://github.com/iki-ae/antri-iki-ae /var/www/antri.iki.ae"
wsl -d Debian -- bash -c "cd /var/www/antri.iki.ae && sudo ./install.sh --skip-nginx"
```

**Step 3 — Allow access from other devices on your network**

```powershell
for /f "tokens=1" %i in ('wsl -d Debian hostname -I') do netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=%i
netsh advfirewall firewall add rule name="IKI-Antri" dir=in action=allow protocol=TCP localport=3001
```

**Step 4 — Auto-refresh port on Windows restart**

Download `portproxy-refresh.bat` from [https://antri.iki.ae](https://antri.iki.ae) and run in PowerShell as Administrator:
```powershell
Copy-Item "C:\Users\$env:USERNAME\Downloads\portproxy-refresh.bat" "C:\portproxy-refresh.bat"
schtasks /create /tn "IKIAntri-PortProxy" /tr "C:\portproxy-refresh.bat" /sc onlogon /rl highest /f
```

**Step 5 — Open the app**

```
http://localhost:3001
```

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

IKI Antri is licensed under the **Business Source License 1.1 (BSL 1.1)**.

You are free to read, self-host, and use this software for internal organizational purposes. You may not remove or obscure attribution to iki.ae, nor offer it as a hosted or managed service to third parties without a commercial license.

On **2029-01-01** this software converts to the **MIT License** and becomes fully open source.

See [LICENSE](LICENSE) for the full license text.

### Support & Commercial Use

For paid support, customization, or hardware bundles:
**[https://support.iki.ae](https://support.iki.ae)**

Organizations that need white-label rights or managed-service rights may contact us for a commercial license.

### Credits

IKI Antri is built and maintained by [Sion Thutu](https://iki.ae), founder of [iki.ae](https://iki.ae).

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
- **Cadangan & pulihkan** — ekspor dan impor database lengkap sebagai file .db
- **Multibahasa** — Indonesia dan Inggris sudah tersedia

### Instalasi Mudah (Windows 11)

Unduh WSL image siap pakai di [https://antri.iki.ae](https://antri.iki.ae) dan ikuti petunjuknya. Gratis digunakan tanpa batasan fitur.

Kredensial default: `admin` / `antri123` — **segera ganti setelah login pertama.**

### Instalasi Manual (Windows 11)

> Membutuhkan Windows 11. Jika tidak yakin, gunakan metode Instalasi Mudah di atas.

**Langkah 1 — Aktifkan WSL2**

Buka PowerShell sebagai Administrator dan jalankan:
```powershell
wsl --install Debian
```
Restart PC saat diminta.

**Langkah 2 — Pasang IKI Antri**

Setelah restart, buka PowerShell sebagai Administrator dan jalankan satu per satu:
```powershell
wsl -d Debian -- bash -c "sudo apt-get update && sudo apt-get install -y git"
wsl -d Debian -- bash -c "sudo git clone https://github.com/iki-ae/antri-iki-ae /var/www/antri.iki.ae"
wsl -d Debian -- bash -c "cd /var/www/antri.iki.ae && sudo ./install.sh --skip-nginx"
```

**Langkah 3 — Izinkan akses dari perangkat lain di jaringan**

```powershell
for /f "tokens=1" %i in ('wsl -d Debian hostname -I') do netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=%i
netsh advfirewall firewall add rule name="IKI-Antri" dir=in action=allow protocol=TCP localport=3001
```

**Langkah 4 — Perbarui port otomatis saat Windows restart**

Unduh `portproxy-refresh.bat` dari [https://antri.iki.ae](https://antri.iki.ae) dan jalankan di PowerShell sebagai Administrator:
```powershell
Copy-Item "C:\Users\$env:USERNAME\Downloads\portproxy-refresh.bat" "C:\portproxy-refresh.bat"
schtasks /create /tn "IKIAntri-PortProxy" /tr "C:\portproxy-refresh.bat" /sc onlogon /rl highest /f
```

**Langkah 5 — Buka aplikasi**

```
http://localhost:3001
```

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

IKI Antri dilisensikan di bawah **Business Source License 1.1 (BSL 1.1)**.

Anda bebas membaca, menjalankan secara mandiri, dan menggunakan perangkat lunak ini untuk keperluan internal organisasi. Anda tidak diperbolehkan menghapus atau menyembunyikan atribusi iki.ae, maupun menawarkannya sebagai layanan yang dihosting kepada pihak ketiga tanpa lisensi komersial.

Pada **2029-01-01**, perangkat lunak ini akan beralih ke **MIT License** dan menjadi sepenuhnya open source.

Lihat [LICENSE](LICENSE) untuk teks lisensi lengkap.

### Dukungan & Penggunaan Komersial

Untuk dukungan berbayar, kustomisasi, atau paket hardware:
**[https://support.iki.ae](https://support.iki.ae)**

Organisasi yang membutuhkan hak white-label atau layanan terkelola dapat menghubungi kami untuk lisensi komersial.

### Kredit

IKI Antri dibuat dan dipelihara oleh [Sion Thutu](https://iki.ae), pendiri [iki.ae](https://iki.ae).

---

*by [iki.ae](https://iki.ae)*
