@echo off
REM PoS System Startup Script for Windows
REM This script launches Chrome with autoplay permissions for Point of Sale systems

echo Starting PoS System...

REM Kill any existing Chrome processes
taskkill /f /im chrome.exe 2>nul

REM Wait a moment for processes to close
timeout /t 2 /nobreak >nul

REM Launch Chrome with PoS-optimized flags
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --autoplay-policy=no-user-gesture-required ^
  --disable-features=PreloadMediaEngagementData ^
  --disable-background-timer-throttling ^
  --disable-backgrounding-occluded-windows ^
  --disable-renderer-backgrounding ^
  --disable-web-security ^
  --disable-features=VizDisplayCompositor ^
  --kiosk ^
  --start-fullscreen ^
  --no-first-run ^
  --no-default-browser-check ^
  --disable-default-apps ^
  --disable-extensions ^
  --disable-plugins ^
  --disable-translate ^
  --disable-background-networking ^
  --disable-sync ^
  --disable-background-downloads ^
  --disable-add-to-shelf ^
  --disable-client-side-phishing-detection ^
  --disable-component-update ^
  --disable-domain-reliability ^
  --disable-features=TranslateUI ^
  --disable-ipc-flooding-protection ^
  --disable-hang-monitor ^
  --disable-prompt-on-repost ^
  --force-device-scale-factor=1 ^
  --high-dpi-support=1 ^
  --user-data-dir=C:\temp\chrome-pos ^
  --app=http://localhost:8090

echo PoS System started successfully!
pause
