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
    MSG_ROOT="Jalankan sebagai root: sudo ./install.sh"
    MSG_NO_APT="Installer ini membutuhkan sistem berbasis Debian/Ubuntu (apt)."
    MSG_NO_APP="File app tidak ditemukan di $APP_DIR. Ekstrak file app terlebih dahulu."
    MSG_CHECK_NODE="Memeriksa Node.js..."
    MSG_INSTALL_NODE="Menginstal Node.js LTS via NodeSource..."
    MSG_CHECK_PM2="Memeriksa PM2..."
    MSG_DEPS="Menginstal dependensi backend..."
    MSG_BUILD="Membangun backend..."
    MSG_MIGRATE="Menjalankan migrasi database..."
    MSG_PM2_START="Memulai PM2 process..."
    MSG_PM2_BOOT="Mengatur PM2 startup otomatis..."
    MSG_NGINX_SKIP="Nginx dilewati (--skip-nginx). Pastikan reverse proxy Anda meneruskan ke 127.0.0.1:$PORT"
    MSG_NGINX_SSE1="Tambahkan direktif SSE berikut ke vhost Nginx Anda:"
    MSG_NGINX_SSE2="  proxy_read_timeout 3600s;"
    MSG_NGINX_SSE3="  proxy_buffering off;"
    MSG_NGINX_INSTALL="Menginstal dan mengonfigurasi Nginx..."
    MSG_NGINX_NO_TPL="Template Nginx tidak ditemukan: $APP_DIR/nginx/antri-iki-ae.conf"
    MSG_NGINX_OK="Nginx dikonfigurasi untuk:"
    MSG_DONE="Instalasi selesai!"
    MSG_ACCESS_SKIP="  http://[IP-SERVER]:$PORT"
    MSG_ACCESS_NGINX="  http://[IP-SERVER]  (via Nginx, port 80)"
    MSG_ACCESS_SSL="  Atau konfigurasikan domain + SSL (certbot) sesuai kebutuhan"
    MSG_USER="  Username : admin"
    MSG_PASS="  Password : antri123"
    MSG_WARN_PASS="  PENTING: Ganti password admin segera setelah login!"
    MSG_LOGIN="  Login admin default:"
    MSG_ACCESS="  Akses aplikasi:"
    ;;
  *)
    MSG_ROOT="Run as root: sudo ./install.sh"
    MSG_NO_APT="This installer requires a Debian/Ubuntu system (apt)."
    MSG_NO_APP="App files not found at $APP_DIR. Extract the app files first."
    MSG_CHECK_NODE="Checking Node.js..."
    MSG_INSTALL_NODE="Installing Node.js LTS via NodeSource..."
    MSG_CHECK_PM2="Checking PM2..."
    MSG_DEPS="Installing backend dependencies..."
    MSG_BUILD="Building backend..."
    MSG_MIGRATE="Running database migrations..."
    MSG_PM2_START="Starting PM2 process..."
    MSG_PM2_BOOT="Configuring PM2 startup on boot..."
    MSG_NGINX_SKIP="Nginx skipped (--skip-nginx). Ensure your reverse proxy forwards to 127.0.0.1:$PORT"
    MSG_NGINX_SSE1="Add these SSE directives to your Nginx vhost:"
    MSG_NGINX_SSE2="  proxy_read_timeout 3600s;"
    MSG_NGINX_SSE3="  proxy_buffering off;"
    MSG_NGINX_INSTALL="Installing and configuring Nginx..."
    MSG_NGINX_NO_TPL="Nginx template not found: $APP_DIR/nginx/antri-iki-ae.conf"
    MSG_NGINX_OK="Nginx configured for:"
    MSG_DONE="Installation complete!"
    MSG_ACCESS_SKIP="  http://[SERVER-IP]:$PORT"
    MSG_ACCESS_NGINX="  http://[SERVER-IP]  (via Nginx, port 80)"
    MSG_ACCESS_SSL="  Or configure a domain + SSL (certbot) as needed"
    MSG_USER="  Username : admin"
    MSG_PASS="  Password : antri123"
    MSG_WARN_PASS="  IMPORTANT: Change the admin password immediately after login!"
    MSG_LOGIN="  Default admin login:"
    MSG_ACCESS="  Access the app:"
    ;;
esac

echo ""

# --- Checks ---
[[ $EUID -ne 0 ]] && die "$MSG_ROOT"
command -v apt-get &>/dev/null || die "$MSG_NO_APT"
[[ -f "$APP_DIR/backend/ecosystem.config.cjs" ]] || die "$MSG_NO_APP"

# --- Node.js ---
log "$MSG_CHECK_NODE"
NODE_MAJOR=0
if command -v node &>/dev/null; then
  NODE_MAJOR=$(node -e 'process.stdout.write(process.versions.node.split(".")[0])')
fi
if [[ $NODE_MAJOR -lt 20 ]]; then
  log "$MSG_INSTALL_NODE"
  apt-get update -qq
  apt-get install -y curl ca-certificates gnupg
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
  apt-get install -y nodejs
fi
ok "Node.js $(node --version)"

# --- PM2 ---
log "$MSG_CHECK_PM2"
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi
ok "PM2 $(pm2 --version)"

# --- App dependencies + build ---
log "$MSG_DEPS"
cd "$APP_DIR/backend"
npm ci

log "$MSG_BUILD"
npm run build
npm prune --omit=dev

# --- DB migrations ---
log "$MSG_MIGRATE"
npm run db:migrate

# --- PM2 process ---
log "$MSG_PM2_START"
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# --- PM2 startup ---
log "$MSG_PM2_BOOT"
if grep -qi microsoft /proc/version 2>/dev/null; then
  # WSL: systemd is not available — use wsl.conf boot command instead
  cat > /etc/wsl.conf <<'EOF'
[boot]
command = su -c "pm2 resurrect" root
[network]
generateHosts = true
generateResolvConf = true
EOF
  pm2 save
else
  pm2 startup systemd -u root --hp /root | tail -1 | bash || true
  pm2 save
fi

# --- Nginx ---
if [[ $SKIP_NGINX -eq 1 ]]; then
  warn "$MSG_NGINX_SKIP"
  warn "$MSG_NGINX_SSE1"
  warn "$MSG_NGINX_SSE2"
  warn "$MSG_NGINX_SSE3"
else
  log "$MSG_NGINX_INSTALL"
  apt-get install -y nginx gettext-base

  ANTRI_DOMAIN="${ANTRI_DOMAIN:-_}"
  export ANTRI_DOMAIN ANTRI_PORT="$PORT"

  TEMPLATE="$APP_DIR/nginx/antri-iki-ae.conf"
  [[ -f "$TEMPLATE" ]] || die "$MSG_NGINX_NO_TPL"

  envsubst '${ANTRI_DOMAIN} ${ANTRI_PORT}' < "$TEMPLATE" \
    > /etc/nginx/sites-available/antri-iki-ae

  ln -sf /etc/nginx/sites-available/antri-iki-ae /etc/nginx/sites-enabled/antri-iki-ae
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

  nginx -t && systemctl reload nginx
  ok "$MSG_NGINX_OK $ANTRI_DOMAIN"
fi

# --- Done ---
echo ""
echo -e "${BOLD}============================================${RESET}"
echo -e "${GREEN}  $MSG_DONE${RESET}"
echo ""
echo "$MSG_ACCESS"
if [[ $SKIP_NGINX -eq 1 ]]; then
  echo "$MSG_ACCESS_SKIP"
else
  echo "$MSG_ACCESS_NGINX"
  echo "$MSG_ACCESS_SSL"
fi
echo ""
echo "$MSG_LOGIN"
echo "$MSG_USER"
echo "$MSG_PASS"
echo ""
echo -e "${RED}$MSG_WARN_PASS${RESET}"
echo -e "${BOLD}============================================${RESET}"
