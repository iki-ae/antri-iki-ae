@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Antri-Iki-Ae ^- Queue Management System
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
  set MSG_NO_TAR=GAGAL: antri-iki-ae.tar tidak ditemukan di folder yang sama dengan update.bat.
  set MSG_STEP1=LANGKAH 1 dari 3: Ekspor data Anda sebelum melanjutkan.
  set MSG_STEP1_1=  1. Buka http://localhost:3001 di browser
  set MSG_STEP1_2=  2. Masuk sebagai admin
  set MSG_STEP1_3=  3. Buka menu Admin ^> Backup
  set MSG_STEP1_4=  4. Klik "Export" dan simpan file .zip di tempat yang aman
  set MSG_STEP1_PAUSE=Tekan sembarang tombol setelah backup selesai...
  set MSG_STEP2=LANGKAH 2 dari 3: Memperbarui sistem...
  set MSG_SHUTDOWN=Mematikan WSL...
  set MSG_UNREGISTER=Menghapus instalasi lama...
  set MSG_UNREGISTER_FAIL=GAGAL: Tidak bisa menghapus instalasi lama.
  set MSG_IMPORT=Mengimpor versi baru...
  set MSG_IMPORT_FAIL=GAGAL: Import WSL gagal.
  set MSG_PROXY=Memperbarui port proxy...
  set MSG_IP_FAIL=GAGAL: Tidak bisa mendapatkan IP WSL baru.
  set MSG_STARTING=Menjalankan Antri-Iki-Ae...
  set MSG_STEP3=LANGKAH 3 dari 3: Pulihkan data Anda.
  set MSG_STEP3_1=  1. Buka http://localhost:3001 di browser
  set MSG_STEP3_2=  2. Masuk sebagai admin
  set MSG_STEP3_3=  3. Buka menu Admin ^> Backup
  set MSG_STEP3_4=  4. Klik "Import" dan pilih file .zip backup Anda
  set MSG_DONE=Update selesai^^!
) else (
  set MSG_NO_TAR=ERROR: antri-iki-ae.tar not found in the same folder as update.bat.
  set MSG_STEP1=STEP 1 of 3: Export your data before continuing.
  set MSG_STEP1_1=  1. Open http://localhost:3001 in a browser
  set MSG_STEP1_2=  2. Log in as admin
  set MSG_STEP1_3=  3. Go to Admin ^> Backup
  set MSG_STEP1_4=  4. Click "Export" and save the .zip file somewhere safe
  set MSG_STEP1_PAUSE=Press any key when backup is done...
  set MSG_STEP2=STEP 2 of 3: Updating system...
  set MSG_SHUTDOWN=Shutting down WSL...
  set MSG_UNREGISTER=Removing old installation...
  set MSG_UNREGISTER_FAIL=ERROR: Could not remove old installation.
  set MSG_IMPORT=Importing new version...
  set MSG_IMPORT_FAIL=ERROR: WSL import failed.
  set MSG_PROXY=Refreshing port proxy...
  set MSG_IP_FAIL=ERROR: Could not get new WSL IP address.
  set MSG_STARTING=Starting Antri-Iki-Ae...
  set MSG_STEP3=STEP 3 of 3: Restore your data.
  set MSG_STEP3_1=  1. Open http://localhost:3001 in a browser
  set MSG_STEP3_2=  2. Log in as admin
  set MSG_STEP3_3=  3. Go to Admin ^> Backup
  set MSG_STEP3_4=  4. Click "Import" and select your backup .zip file
  set MSG_DONE=Update complete^^!
)

echo.

REM --- Step 1: Backup prompt ---
echo !MSG_STEP1!
echo.
echo !MSG_STEP1_1!
echo !MSG_STEP1_2!
echo !MSG_STEP1_3!
echo !MSG_STEP1_4!
echo.
echo !MSG_STEP1_PAUSE!
pause >nul

REM Check new tar exists
if not exist "%~dp0antri-iki-ae.tar" (
  echo !MSG_NO_TAR!
  pause & exit /b 1
)

echo.
echo !MSG_STEP2!
echo.

echo !MSG_SHUTDOWN!
wsl --shutdown

echo !MSG_UNREGISTER!
wsl --unregister antri-iki-ae
if errorlevel 1 (
  echo !MSG_UNREGISTER_FAIL!
  pause & exit /b 1
)

echo !MSG_IMPORT!
wsl --import antri-iki-ae C:\antri-iki-ae "%~dp0antri-iki-ae.tar" --version 2
if errorlevel 1 (
  echo !MSG_IMPORT_FAIL!
  pause & exit /b 1
)

echo !MSG_PROXY!
copy /Y "%~dp0portproxy-refresh.bat" "C:\antri-iki-ae\portproxy-refresh.bat" >nul 2>&1

for /f "tokens=*" %%i in ('wsl -d antri-iki-ae hostname -I') do set WSL_IP=%%i
if "!WSL_IP!"=="" (
  echo !MSG_IP_FAIL!
  pause & exit /b 1
)
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=!WSL_IP!

echo !MSG_STARTING!
wsl -d antri-iki-ae -- bash -c "cd /var/www/antri.iki.ae/backend && pm2 start ecosystem.config.cjs && pm2 save" >nul

echo.
echo !MSG_STEP3!
echo.
echo !MSG_STEP3_1!
echo !MSG_STEP3_2!
echo !MSG_STEP3_3!
echo !MSG_STEP3_4!
echo.
echo ============================================
echo   !MSG_DONE!
echo   Access: http://localhost:3001
echo ============================================
pause
