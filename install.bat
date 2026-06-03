@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   IKI Antri ^- Queue Management System
echo   by iki.ae
echo ============================================
echo.

REM Must run as Administrator
net session >nul 2>&1
if errorlevel 1 (
  echo ERROR: Run this file as Administrator.
  echo ERROR: Jalankan file ini sebagai Administrator.
  pause & exit /b 1
)

REM --- Language selection ---
echo   Select language / Pilih bahasa:
echo   1^) English (default)
echo   2^) Indonesia
echo.
set /p LANG_CHOICE="  [1/2, Enter = English]: "
if "!LANG_CHOICE!"=="" set LANG_CHOICE=1

if "!LANG_CHOICE!"=="2" (
  set MSG_NO_WSL=GAGAL: WSL2 tidak ditemukan. Install WSL2 terlebih dahulu.
  set MSG_NO_WSL2=  Jalankan di PowerShell: wsl --install
  set MSG_NO_TAR=GAGAL: IKI-Antri.tar tidak ditemukan di folder yang sama dengan install.bat.
  set MSG_IMPORT=^[1/5^] Mengimpor IKI Antri ke WSL2...
  set MSG_IMPORT_FAIL=GAGAL: Import WSL gagal.
  set MSG_COPY=^[2/5^] Menyalin portproxy-refresh.bat...
  set MSG_COPY_FAIL=GAGAL: Tidak bisa menyalin portproxy-refresh.bat.
  set MSG_LAN=^[3/5^] Mengatur akses jaringan LAN...
  set MSG_IP_FAIL=GAGAL: Tidak bisa mendapatkan IP WSL.
  set MSG_SCHTASK=^[4/5^] Mendaftarkan portproxy-refresh saat startup Windows...
  set MSG_SCHTASK_WARN=PERINGATAN: Gagal mendaftarkan task scheduler. Port proxy perlu diperbarui manual setelah restart.
  set MSG_START=^[5/5^] Menonaktifkan sleep mode dan menjalankan IKI Antri...
  set MSG_DONE=Instalasi selesai^^!
  set MSG_LOCAL=  Buka di browser:
  set MSG_LAN_ACCESS=  Dari perangkat lain di jaringan yang sama:
  set MSG_LOGIN=  Login admin default:
  set MSG_WARN=  PENTING: Ganti password admin segera setelah login^^!
) else (
  set MSG_NO_WSL=ERROR: WSL2 not found. Install WSL2 first.
  set MSG_NO_WSL2=  Run in PowerShell: wsl --install
  set MSG_NO_TAR=ERROR: IKI-Antri.tar not found in the same folder as install.bat.
  set MSG_IMPORT=^[1/5^] Importing IKI Antri into WSL2...
  set MSG_IMPORT_FAIL=ERROR: WSL import failed.
  set MSG_COPY=^[2/5^] Copying portproxy-refresh.bat...
  set MSG_COPY_FAIL=ERROR: Could not copy portproxy-refresh.bat.
  set MSG_LAN=^[3/5^] Configuring LAN access...
  set MSG_IP_FAIL=ERROR: Could not get WSL IP address.
  set MSG_SCHTASK=^[4/5^] Registering portproxy-refresh at Windows startup...
  set MSG_SCHTASK_WARN=WARNING: Could not register startup task. Port proxy must be refreshed manually after restart.
  set MSG_START=^[5/5^] Disabling sleep mode and starting IKI Antri...
  set MSG_DONE=Installation complete^^!
  set MSG_LOCAL=  Open in browser:
  set MSG_LAN_ACCESS=  From other devices on the same network:
  set MSG_LOGIN=  Default admin login:
  set MSG_WARN=  IMPORTANT: Change the admin password immediately^^!
)

echo.

REM Check WSL2 is available
wsl --status >nul 2>&1
if errorlevel 1 (
  echo !MSG_NO_WSL!
  echo !MSG_NO_WSL2!
  pause & exit /b 1
)

REM Check tar file exists next to this bat
if not exist "%~dp0IKI-Antri.tar" (
  echo !MSG_NO_TAR!
  pause & exit /b 1
)

REM --- Step 1: Import WSL distro ---
echo !MSG_IMPORT!
wsl --import IKI-Antri C:\IKI-Antri "%~dp0IKI-Antri.tar" --version 2
if errorlevel 1 (
  echo !MSG_IMPORT_FAIL!
  pause & exit /b 1
)

REM --- Step 2: Copy portproxy-refresh.bat ---
echo !MSG_COPY!
copy /Y "%~dp0portproxy-refresh.bat" "C:\IKI-Antri\portproxy-refresh.bat" >nul
if errorlevel 1 (
  echo !MSG_COPY_FAIL!
  pause & exit /b 1
)

REM --- Step 3: Port proxy + firewall ---
echo !MSG_LAN!
for /f "tokens=*" %%i in ('wsl -d IKI-Antri hostname -I') do set WSL_IP=%%i
if "!WSL_IP!"=="" (
  echo !MSG_IP_FAIL!
  pause & exit /b 1
)
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=!WSL_IP!
netsh advfirewall firewall delete rule name="IKI-Antri" >nul 2>&1
netsh advfirewall firewall add rule name="IKI-Antri" dir=in action=allow protocol=TCP localport=3001

REM --- Step 4: Register portproxy-refresh at startup ---
echo !MSG_SCHTASK!
schtasks /delete /tn "AntriIkiAe-PortProxy" /f >nul 2>&1
schtasks /create /tn "AntriIkiAe-PortProxy" /tr "C:\IKI-Antri\portproxy-refresh.bat" /sc onlogon /rl highest /f
if errorlevel 1 (
  echo !MSG_SCHTASK_WARN!
)

REM --- Step 5: Disable sleep + start app ---
echo !MSG_START!
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0
wsl -d IKI-Antri -- bash -c "pm2 resurrect" >nul 2>&1

echo.
echo ============================================
echo   !MSG_DONE!
echo.
echo !MSG_LOCAL!
echo   http://localhost:3001
echo.
echo !MSG_LAN_ACCESS!
echo   http://[THIS-PC-IP]:3001
echo.
echo !MSG_LOGIN!
echo   Username : admin
echo   Password : antri123
echo.
echo !MSG_WARN!
echo ============================================
echo.
pause
cmd /k
