@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   IKI Antri - Queue Management System
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

REM Check portproxy-refresh.bat exists next to this bat
if not exist "%~dp0portproxy-refresh.bat" (
  echo ERROR: portproxy-refresh.bat not found in the same folder as update.bat.
  echo ERROR: portproxy-refresh.bat tidak ditemukan di folder yang sama dengan update.bat.
  pause & exit /b 1
)

echo [1/3] Copying portproxy-refresh.bat...
copy /Y "%~dp0portproxy-refresh.bat" "C:\IKI-Antri\portproxy-refresh.bat" >nul
if errorlevel 1 (
  echo ERROR: Could not copy portproxy-refresh.bat. Is IKI Antri installed?
  echo ERROR: Gagal menyalin. Apakah IKI Antri sudah terinstal?
  pause & exit /b 1
)

echo [2/3] Re-registering startup task...
schtasks /delete /tn "AntriIkiAe-PortProxy" /f >nul 2>&1
schtasks /create /tn "AntriIkiAe-PortProxy" /tr "C:\IKI-Antri\portproxy-refresh.bat" /sc onlogon /rl highest /f
if errorlevel 1 (
  echo WARNING: Could not register startup task.
  echo PERINGATAN: Gagal mendaftarkan task startup.
)

echo [3/3] Running portproxy-refresh now...
call "C:\IKI-Antri\portproxy-refresh.bat"

echo.
echo ============================================
echo   Update complete! / Pembaruan selesai!
echo ============================================
echo.
pause
cmd /k
