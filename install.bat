@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Antri-Iki-Ae - Instalasi Sistem Antrian
echo   Powered by iki.ae
echo ============================================
echo.

REM Must run as Administrator
net session >nul 2>&1
if errorlevel 1 (
  echo GAGAL: Jalankan file ini sebagai Administrator.
  pause & exit /b 1
)

REM Check WSL2 is available
wsl --status >nul 2>&1
if errorlevel 1 (
  echo GAGAL: WSL2 tidak ditemukan. Install WSL2 terlebih dahulu.
  echo   Jalankan di PowerShell: wsl --install
  pause & exit /b 1
)

REM Check tar file exists next to this bat
if not exist "%~dp0antri-iki-ae.tar" (
  echo GAGAL: File antri-iki-ae.tar tidak ditemukan di folder yang sama dengan install.bat.
  pause & exit /b 1
)

REM --- Step 1: Import WSL distro ---
echo [1/5] Mengimpor sistem Antri-Iki-Ae ke WSL2...
wsl --import antri-iki-ae C:\antri-iki-ae "%~dp0antri-iki-ae.tar" --version 2
if errorlevel 1 (
  echo GAGAL: Import WSL gagal.
  pause & exit /b 1
)

REM --- Step 2: Copy portproxy-refresh.bat ---
echo [2/5] Menyalin portproxy-refresh.bat...
copy /Y "%~dp0portproxy-refresh.bat" "C:\antri-iki-ae\portproxy-refresh.bat" >nul
if errorlevel 1 (
  echo GAGAL: Tidak bisa menyalin portproxy-refresh.bat.
  pause & exit /b 1
)

REM --- Step 3: Port proxy + firewall ---
echo [3/5] Mengatur akses jaringan LAN...
for /f "tokens=*" %%i in ('wsl -d antri-iki-ae hostname -I') do set WSL_IP=%%i
if "!WSL_IP!"=="" (
  echo GAGAL: Tidak bisa mendapatkan IP WSL.
  pause & exit /b 1
)
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=!WSL_IP!
netsh advfirewall firewall delete rule name="Antri-Iki-Ae" >nul 2>&1
netsh advfirewall firewall add rule name="Antri-Iki-Ae" dir=in action=allow protocol=TCP localport=3001

REM --- Step 4: Register portproxy-refresh at startup ---
echo [4/5] Mendaftarkan portproxy-refresh saat startup Windows...
schtasks /delete /tn "AntriIkiAe-PortProxy" /f >nul 2>&1
schtasks /create /tn "AntriIkiAe-PortProxy" /tr "C:\antri-iki-ae\portproxy-refresh.bat" /sc onlogon /rl highest /f
if errorlevel 1 (
  echo PERINGATAN: Gagal mendaftarkan task scheduler. Port proxy perlu diperbarui manual setelah restart.
)

REM --- Step 5: Disable sleep + start app ---
echo [5/5] Menonaktifkan sleep mode dan menjalankan Antri-Iki-Ae...
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0
wsl -d antri-iki-ae -- bash -c "cd /var/www/antri.iki.ae/backend && pm2 start ecosystem.config.cjs && pm2 save && pm2 startup systemd -u root --hp /root" >nul

echo.
echo ============================================
echo   Instalasi selesai!
echo.
echo   Buka browser dan akses:
echo   http://localhost:3001
echo.
echo   Dari perangkat lain di jaringan yang sama:
echo   http://[IP-KOMPUTER-INI]:3001
echo.
echo   Login admin default:
echo   Username : admin
echo   Password : admin123
echo.
echo   PENTING: Ganti password admin segera setelah login!
echo ============================================
pause
