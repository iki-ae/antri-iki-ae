@echo off
:: Runs at Windows logon via Task Scheduler.
:: 1. Starts WSL distro and resurrects PM2 (WSL does not autostart on Windows boot)
:: 2. Refreshes portproxy because WSL2 IP changes on every restart

setlocal enabledelayedexpansion

:: Start WSL and resurrect PM2
wsl -d IKI-Antri -- bash -c "PATH=/usr/bin:/usr/local/bin pm2 resurrect" >/dev/null 2>&1

:: Give WSL a moment to assign its IP
timeout /t 3 /nobreak >nul

:: Get the new WSL IP
for /f "tokens=1" %%i in ('wsl -d IKI-Antri hostname -I') do set WSL_IP=%%i

if "!WSL_IP!"=="" (
  exit /b 1
)

netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >/dev/null 2>&1
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=!WSL_IP! >nul
