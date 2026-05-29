#!/usr/bin/env bash
# Antri-Iki-Ae — Linux update script
# Usage: ./update.sh [path/to/new-app-files]
# If no path given, assumes app files are already extracted to APP_DIR.

set -euo pipefail

APP_DIR="/var/www/antri.iki.ae"
APP_NAME="antri-iki-ae-api"

BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
RESET="\033[0m"

log()  { echo -e "${BOLD}[antri]${RESET} $*"; }
ok()   { echo -e "${GREEN}[ok]${RESET} $*"; }
die()  { echo -e "${RED}[error]${RESET} $*" >&2; exit 1; }

# --- Banner ---
echo ""
echo -e "${BOLD}============================================${RESET}"
echo -e "${BOLD}  Antri-Iki-Ae — Queue Management System  ${RESET}"
echo -e "${BOLD}  by iki.ae                                ${RESET}"
echo -e "${BOLD}============================================${RESET}"
echo ""

# --- Language selection ---
echo "  Select language / Pilih bahasa:"
echo "  1) English (default)"
echo "  2) Indonesia"
echo ""
read -rp "  [1/2, Enter = English]: " LANG_CHOICE

case "${LANG_CHOICE:-1}" in
  2)
    MSG_ROOT="Jalankan sebagai root: sudo ./update.sh"
    MSG_STEP1_TITLE="LANGKAH 1 dari 3: Ekspor data Anda sebelum melanjutkan."
    MSG_STEP1_1="  1. Buka http://[IP-SERVER] di browser"
    MSG_STEP1_2="  2. Masuk sebagai admin"
    MSG_STEP1_3="  3. Buka menu Admin > Backup"
    MSG_STEP1_4="  4. Klik 'Export' dan simpan file .zip di tempat yang aman"
    MSG_STEP1_PROMPT="Tekan ENTER setelah backup selesai, atau Ctrl+C untuk batal... "
    MSG_STEP2_TITLE="LANGKAH 2 dari 3: Memperbarui file aplikasi..."
    MSG_NO_PATH="Path tidak ditemukan:"
    MSG_COPY="Menyalin file baru..."
    MSG_DEPS="Menginstal dependensi backend..."
    MSG_BUILD="Membangun ulang backend..."
    MSG_MIGRATE="Menjalankan migrasi database..."
    MSG_RESTART="Me-restart PM2..."
    MSG_OK="Aplikasi diperbarui dan berjalan kembali."
    MSG_STEP3_TITLE="LANGKAH 3 dari 3: Pulihkan data Anda (jika diperlukan)."
    MSG_STEP3_NOTE="  Jika data Anda tidak muncul secara otomatis:"
    MSG_STEP3_1="  1. Buka http://[IP-SERVER] di browser"
    MSG_STEP3_2="  2. Masuk sebagai admin"
    MSG_STEP3_3="  3. Buka menu Admin > Backup"
    MSG_STEP3_4="  4. Klik 'Import' dan pilih file .zip backup Anda"
    MSG_DONE="Update selesai!"
    ;;
  *)
    MSG_ROOT="Run as root: sudo ./update.sh"
    MSG_STEP1_TITLE="STEP 1 of 3: Export your data before continuing."
    MSG_STEP1_1="  1. Open http://[SERVER-IP] in a browser"
    MSG_STEP1_2="  2. Log in as admin"
    MSG_STEP1_3="  3. Go to Admin > Backup"
    MSG_STEP1_4="  4. Click 'Export' and save the .zip file somewhere safe"
    MSG_STEP1_PROMPT="Press ENTER when backup is done, or Ctrl+C to cancel... "
    MSG_STEP2_TITLE="STEP 2 of 3: Updating app files..."
    MSG_NO_PATH="Path not found:"
    MSG_COPY="Copying new files..."
    MSG_DEPS="Installing backend dependencies..."
    MSG_BUILD="Building backend..."
    MSG_MIGRATE="Running database migrations..."
    MSG_RESTART="Restarting PM2..."
    MSG_OK="App updated and running."
    MSG_STEP3_TITLE="STEP 3 of 3: Restore your data (if needed)."
    MSG_STEP3_NOTE="  If your data does not appear automatically:"
    MSG_STEP3_1="  1. Open http://[SERVER-IP] in a browser"
    MSG_STEP3_2="  2. Log in as admin"
    MSG_STEP3_3="  3. Go to Admin > Backup"
    MSG_STEP3_4="  4. Click 'Import' and select your backup .zip file"
    MSG_DONE="Update complete!"
    ;;
esac

echo ""

[[ $EUID -ne 0 ]] && die "$MSG_ROOT"

# --- Step 1: Backup prompt ---
echo -e "${BOLD}$MSG_STEP1_TITLE${RESET}"
echo ""
echo "$MSG_STEP1_1"
echo "$MSG_STEP1_2"
echo "$MSG_STEP1_3"
echo "$MSG_STEP1_4"
echo ""
read -rp "$MSG_STEP1_PROMPT"

# --- Step 2: Update app files ---
echo ""
log "$MSG_STEP2_TITLE"

NEW_FILES="${1:-}"
if [[ -n "$NEW_FILES" ]]; then
  [[ -d "$NEW_FILES" ]] || die "$MSG_NO_PATH $NEW_FILES"
  log "$MSG_COPY"
  rsync -av --exclude="backend/data/" --exclude="backend/node_modules/" --exclude="backend/dist/" \
    "$NEW_FILES/" "$APP_DIR/"
fi

log "$MSG_DEPS"
cd "$APP_DIR/backend"
npm ci

log "$MSG_BUILD"
npm run build
npm prune --omit=dev

log "$MSG_MIGRATE"
npm run db:migrate

log "$MSG_RESTART"
pm2 restart "$APP_NAME" || pm2 start ecosystem.config.cjs
pm2 save

ok "$MSG_OK"

# --- Step 3: Restore prompt ---
echo ""
echo -e "${BOLD}$MSG_STEP3_TITLE${RESET}"
echo ""
echo "$MSG_STEP3_NOTE"
echo "$MSG_STEP3_1"
echo "$MSG_STEP3_2"
echo "$MSG_STEP3_3"
echo "$MSG_STEP3_4"
echo ""
echo -e "${BOLD}============================================${RESET}"
echo -e "${GREEN}  $MSG_DONE${RESET}"
echo -e "${BOLD}============================================${RESET}"
