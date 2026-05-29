# Task Brief: Installer & Deployment Scripts

> Read this before building install.bat, install.sh, update.bat, update.sh, or portproxy scripts.

---

## DEPLOYMENT TARGETS

- **`install.bat`** — WSL2 on Windows (primary distribution)
- **`install.sh`** — everything else: bare Debian/Ubuntu, Proxmox LXC/VM, VirtualBox, Hyper-V, cloud VPS
- Minimum: Debian 12 / Ubuntu 22.04

---

## install.bat — WSL2 FIRST INSTALL

```batch
wsl --import antri-iki-ae C:\antri-iki-ae antri-iki-ae.tar --version 2
for /f "tokens=*" %%i in ('wsl -d antri-iki-ae hostname -I') do set WSL_IP=%%i
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=%WSL_IP%
powercfg /change standby-timeout-ac 0
```

**Critical:** WSL2 IP changes on every Windows restart. Must also generate `portproxy-refresh.bat` and register it as a Windows startup task via Task Scheduler (`schtasks`):

```batch
schtasks /create /tn "AntriIkiAe-PortProxy" /tr "C:\antri-iki-ae\portproxy-refresh.bat" /sc onlogon /rl highest /f
```

```batch
:: portproxy-refresh.bat — run at Windows startup
for /f "tokens=*" %%i in ('wsl -d antri-iki-ae hostname -I') do set WSL_IP=%%i
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=%WSL_IP%
```

LAN access: `http://[PC-IP]:3001`

---

## update.bat — WSL2 UPDATE

```batch
echo Step 1: Export your data from Admin > Backup, save the .zip
pause
wsl --shutdown
wsl --unregister antri-iki-ae
wsl --import antri-iki-ae C:\antri-iki-ae antri-iki-ae-NEW.tar --version 2
for /f "tokens=*" %%i in ('wsl -d antri-iki-ae hostname -I') do set WSL_IP=%%i
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=%WSL_IP%
echo Step 2: Open http://[PC-IP]:3001, go to Admin > Backup, import your .zip
pause
```

Backup is intentionally manual — user holds the data. Script handles WSL re-import + portproxy refresh.

---

## install.sh — LINUX / ALL OTHER TARGETS

Installs on any fresh Debian 12+ / Ubuntu 22.04+ system:
- Node.js (LTS via NodeSource)
- PM2 (global)
- Nginx
- App files to `/var/www/antri-iki-ae/`
- PM2 process: `antri-iki-ae-api`
- Nginx config proxying port 3001
- PM2 startup on boot

---

## CLOUDPANEL (VPS) — SPECIAL CASE

CloudPanel manages Nginx through its own UI. Do NOT generate or place raw Nginx config files when deploying to a CloudPanel instance.

Instead:
1. User creates a Node.js site in CloudPanel (domain/subdomain)
2. CloudPanel generates the Nginx vhost — user adds SSE directives via CloudPanel's vhost editor:
   ```nginx
   proxy_read_timeout 3600s;
   proxy_buffering off;
   ```
3. `install.sh` runs **without Nginx setup** — install Node, PM2, and app files only
4. CloudPanel reverse proxies to `127.0.0.1:3001`

When targeting CloudPanel, `install.sh` must support a `--skip-nginx` flag (or detect CloudPanel and skip automatically).

---

## update.sh — LINUX UPDATE

Guided equivalent of update.bat for non-Windows:
1. Prompt user to export backup first
2. Pull new app files
3. Run migrations
4. Restart PM2
5. Prompt user to import backup if needed
