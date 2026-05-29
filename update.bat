@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Antri-Iki-Ae - Update Sistem
echo   Powered by iki.ae
echo ============================================
echo.

REM Must run as Administrator
net session >nul 2>&1
if errorlevel 1 (
  echo GAGAL: Jalankan file ini sebagai Administrator.
  pause & exit /b 1
)

echo LANGKAH 1 dari 3: Ekspor data Anda sebelum melanjutkan.
echo.
echo   1. Buka http://localhost:3001 di browser
echo   2. Masuk sebagai admin
echo   3. Buka menu Admin ^> Backup
echo   4. Klik "Export" dan simpan file .zip di tempat yang aman
echo.
echo Tekan sembarang tombol setelah backup selesai...
pause >nul

REM Check new tar exists
if not exist "%~dp0antri-iki-ae.tar" (
  echo GAGAL: File antri-iki-ae.tar tidak ditemukan di folder yang sama dengan update.bat.
  pause & exit /b 1
)

echo.
echo LANGKAH 2 dari 3: Memperbarui sistem...
echo.

echo Mematikan WSL...
wsl --shutdown

echo Menghapus instalasi lama...
wsl --unregister antri-iki-ae
if errorlevel 1 (
  echo GAGAL: Tidak bisa menghapus instalasi lama.
  pause & exit /b 1
)

echo Mengimpor versi baru...
wsl --import antri-iki-ae C:\antri-iki-ae "%~dp0antri-iki-ae.tar" --version 2
if errorlevel 1 (
  echo GAGAL: Import WSL gagal.
  pause & exit /b 1
)

echo Memperbarui portproxy...
copy /Y "%~dp0portproxy-refresh.bat" "C:\antri-iki-ae\portproxy-refresh.bat" >nul 2>&1

for /f "tokens=*" %%i in ('wsl -d antri-iki-ae hostname -I') do set WSL_IP=%%i
if "!WSL_IP!"=="" (
  echo GAGAL: Tidak bisa mendapatkan IP WSL baru.
  pause & exit /b 1
)
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=!WSL_IP!

echo Menjalankan Antri-Iki-Ae...
wsl -d antri-iki-ae -- bash -c "cd /var/www/antri.iki.ae/backend && pm2 start ecosystem.config.cjs && pm2 save" >nul

echo.
echo LANGKAH 3 dari 3: Pulihkan data Anda.
echo.
echo   1. Buka http://localhost:3001 di browser
echo   2. Masuk sebagai admin
echo   3. Buka menu Admin ^> Backup
echo   4. Klik "Import" dan pilih file .zip backup Anda
echo.
echo ============================================
echo   Update selesai!
echo   Akses: http://localhost:3001
echo ============================================
pause
