#!/bin/bash

# PoS System Startup Script
# This script launches Chrome with autoplay permissions for Point of Sale systems

echo "Starting PoS System..."

# Kill any existing Chrome processes
pkill -f chrome

# Wait a moment for processes to close
sleep 2

# Launch Chrome with PoS-optimized flags
google-chrome \
  --autoplay-policy=no-user-gesture-required \
  --disable-features=PreloadMediaEngagementData \
  --disable-background-timer-throttling \
  --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  --disable-web-security \
  --disable-features=VizDisplayCompositor \
  --kiosk \
  --start-fullscreen \
  --no-first-run \
  --no-default-browser-check \
  --disable-default-apps \
  --disable-extensions \
  --disable-plugins \
  --disable-translate \
  --disable-background-networking \
  --disable-sync \
  --disable-background-downloads \
  --disable-add-to-shelf \
  --disable-client-side-phishing-detection \
  --disable-component-update \
  --disable-domain-reliability \
  --disable-features=TranslateUI \
  --disable-ipc-flooding-protection \
  --disable-hang-monitor \
  --disable-prompt-on-repost \
  --force-device-scale-factor=1 \
  --high-dpi-support=1 \
  --user-data-dir=/tmp/chrome-pos \
  --app=http://localhost:8090

echo "PoS System started successfully!"
