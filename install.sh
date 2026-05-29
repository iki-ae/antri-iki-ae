#!/usr/bin/env bash
# Antri-Iki-Ae — Linux installer
# Supports: Debian 12+, Ubuntu 22.04+, Proxmox LXC/VM, VirtualBox, Hyper-V, cloud VPS
# Usage:
#   ./install.sh              — full install with Nginx
#   ./install.sh --skip-nginx — skip Nginx setup (CloudPanel or custom Nginx managed externally)

set -euo pipefail

SKIP_NGINX=0
for arg in "$@"; do
  [[ "$arg" == "--skip-nginx" ]] && SKIP_NGINX=1
done

APP_DIR="/var/www/antri.iki.ae"
APP_NAME="antri-iki-ae-api"
PORT=3001

BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

log()  { echo -e "${BOLD}[antri]${RESET} $*"; }
ok()   { echo -e "${GREEN}[ok]${RESET} $*"; }
warn() { echo -e "${YELLOW}[warn]${RESET} $*"; }
die()  { echo -e "${RED}[error]${RESET} $*" >&2; exit 1; }

# --- Checks ---
[[ $EUID -ne 0 ]] && die "Jalankan sebagai root: sudo ./install.sh"

if ! command -v apt-get &>/dev/null; then
  die "Installer ini membutuhkan sistem berbasis Debian/Ubuntu (apt)."
fi

if [[ ! -f "$APP_DIR/backend/ecosystem.config.cjs" ]]; then
  die "File app tidak ditemukan di $APP_DIR. Pastikan Anda mengekstrak app terlebih dahulu."
fi

# --- Node.js ---
log "Memeriksa Node.js..."
if ! command -v node &>/dev/null || [[ "$(node -e 'process.exit(Number(process.versions.node.split(\".\")[0]) < 20)')" ]]; then
  log "Menginstal Node.js LTS via NodeSource..."
  apt-get update -qq
  apt-get install -y curl ca-certificates gnupg
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
  apt-get install -y nodejs
fi
ok "Node.js $(node --version)"

# --- PM2 ---
log "Memeriksa PM2..."
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi
ok "PM2 $(pm2 --version)"

# --- App dependencies ---
log "Menginstal dependensi backend..."
cd "$APP_DIR/backend"
npm ci --omit=dev

# --- DB migrations ---
log "Menjalankan migrasi database..."
npm run db:migrate

# --- PM2 process ---
log "Memulai PM2 process..."
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# --- PM2 startup ---
log "Mengatur PM2 startup otomatis..."
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
pm2 save

# --- Nginx ---
if [[ $SKIP_NGINX -eq 1 ]]; then
  warn "Nginx dilewati (--skip-nginx). Pastikan reverse proxy Anda meneruskan ke 127.0.0.1:$PORT"
  warn "Tambahkan direktif SSE ke vhost Nginx Anda:"
  warn "  proxy_read_timeout 3600s;"
  warn "  proxy_buffering off;"
else
  log "Menginstal dan mengonfigurasi Nginx..."
  apt-get install -y nginx gettext-base

  ANTRI_DOMAIN="${ANTRI_DOMAIN:-$(hostname -f 2>/dev/null || echo '_')}"
  export ANTRI_DOMAIN ANTRI_PORT="$PORT"

  TEMPLATE="$APP_DIR/nginx/antri-iki-ae.conf"
  if [[ ! -f "$TEMPLATE" ]]; then
    die "Template Nginx tidak ditemukan: $TEMPLATE"
  fi

  envsubst '${ANTRI_DOMAIN} ${ANTRI_PORT}' < "$TEMPLATE" \
    > /etc/nginx/sites-available/antri-iki-ae

  ln -sf /etc/nginx/sites-available/antri-iki-ae /etc/nginx/sites-enabled/antri-iki-ae
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

  nginx -t && systemctl reload nginx
  ok "Nginx dikonfigurasi untuk domain: $ANTRI_DOMAIN"
fi

# --- Done ---
echo ""
echo -e "${BOLD}============================================${RESET}"
echo -e "${GREEN}  Instalasi selesai!${RESET}"
echo ""
echo "  Akses app:"
if [[ $SKIP_NGINX -eq 1 ]]; then
  echo "    http://[IP-SERVER]:$PORT"
else
  echo "    http://[IP-SERVER]  (via Nginx port 80)"
  echo "    Atau konfigurasikan domain + SSL (certbot) sesuai kebutuhan"
fi
echo ""
echo "  Login admin default:"
echo "    Username : admin"
echo "    Password : admin123"
echo ""
echo -e "  ${RED}PENTING: Ganti password admin segera setelah login!${RESET}"
echo -e "${BOLD}============================================${RESET}"
