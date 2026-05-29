#!/usr/bin/env bash
# Antri-Iki-Ae — Linux update script
# Usage: ./update.sh [path/to/new-app-files]
# If no path given, assumes app files are already extracted to APP_DIR.

set -euo pipefail

APP_DIR="/var/www/antri.iki.ae"
APP_NAME="antri-iki-ae-api"

BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

log()  { echo -e "${BOLD}[antri]${RESET} $*"; }
ok()   { echo -e "${GREEN}[ok]${RESET} $*"; }
warn() { echo -e "${YELLOW}[warn]${RESET} $*"; }
die()  { echo -e "${RED}[error]${RESET} $*" >&2; exit 1; }

[[ $EUID -ne 0 ]] && die "Jalankan sebagai root: sudo ./update.sh"

# --- Step 1: Backup prompt ---
echo ""
echo -e "${BOLD}LANGKAH 1 dari 3: Ekspor data Anda sebelum melanjutkan.${RESET}"
echo ""
echo "  1. Buka http://[IP-SERVER] di browser"
echo "  2. Masuk sebagai admin"
echo "  3. Buka menu Admin > Backup"
echo "  4. Klik 'Export' dan simpan file .zip di tempat yang aman"
echo ""
read -rp "Tekan ENTER setelah backup selesai, atau Ctrl+C untuk batal... "

# --- Step 2: Update app files ---
echo ""
log "LANGKAH 2 dari 3: Memperbarui file aplikasi..."

NEW_FILES="${1:-}"
if [[ -n "$NEW_FILES" ]]; then
  if [[ ! -d "$NEW_FILES" ]]; then
    die "Path tidak ditemukan: $NEW_FILES"
  fi
  log "Menyalin file baru dari $NEW_FILES ke $APP_DIR..."
  rsync -av --exclude="backend/data/" --exclude="backend/node_modules/" --exclude="backend/dist/" \
    "$NEW_FILES/" "$APP_DIR/"
fi

log "Menginstal dependensi backend..."
cd "$APP_DIR/backend"
npm ci --omit=dev

log "Membangun ulang backend..."
npm run build

log "Menjalankan migrasi database..."
npm run db:migrate

log "Me-restart PM2..."
pm2 restart "$APP_NAME" || pm2 start ecosystem.config.cjs
pm2 save

ok "Aplikasi diperbarui dan berjalan kembali."

# --- Step 3: Restore prompt ---
echo ""
echo -e "${BOLD}LANGKAH 3 dari 3: Pulihkan data Anda (jika diperlukan).${RESET}"
echo ""
echo "  Jika data Anda tidak muncul secara otomatis:"
echo "  1. Buka http://[IP-SERVER] di browser"
echo "  2. Masuk sebagai admin"
echo "  3. Buka menu Admin > Backup"
echo "  4. Klik 'Import' dan pilih file .zip backup Anda"
echo ""
echo -e "${BOLD}============================================${RESET}"
echo -e "${GREEN}  Update selesai!${RESET}"
echo -e "${BOLD}============================================${RESET}"
