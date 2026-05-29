@echo off
:: Runs at Windows logon via Task Scheduler.
:: Refreshes the WSL2 port proxy because WSL2 IP changes on every restart.

setlocal enabledelayedexpansion

for /f "tokens=*" %%i in ('wsl -d antri-iki-ae hostname -I') do set WSL_IP=%%i

if "!WSL_IP!"=="" (
  exit /b 1
)

netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=!WSL_IP! >nul
