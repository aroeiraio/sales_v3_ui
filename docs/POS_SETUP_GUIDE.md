# PoS System Setup Guide

This guide explains how to configure Chrome for Point of Sale systems to allow autoplay without user interaction.

## 🚀 Quick Start

### Linux/macOS
```bash
./start-pos.sh
```

### Windows
```cmd
start-pos.bat
```

## 🔧 Manual Chrome Launch

### Essential Flags for PoS
```bash
google-chrome \
  --autoplay-policy=no-user-gesture-required \
  --disable-features=PreloadMediaEngagementData \
  --kiosk \
  --start-fullscreen \
  --app=http://localhost:8090
```

### Complete PoS Configuration
```bash
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
```

## 🏢 Enterprise Deployment

### Chrome Policy Configuration

**Windows**: Place `chrome-policy.json` in:
```
C:\Program Files\Google\Chrome\Application\master_preferences
```

**Linux**: Place in:
```
/etc/opt/chrome/policies/managed/autoplay_policy.json
```

### Policy Settings
- `AutoplayAllowed`: true
- `AutoplayPolicy`: "no-user-gesture-required"
- `DefaultMediaStreamSetting`: 1

## 🎯 Key Flags Explained

| Flag | Purpose |
|------|---------|
| `--autoplay-policy=no-user-gesture-required` | **CRITICAL**: Allows autoplay without user interaction |
| `--disable-features=PreloadMediaEngagementData` | Disables autoplay engagement tracking |
| `--kiosk` | Full-screen kiosk mode |
| `--start-fullscreen` | Starts in fullscreen |
| `--app=http://localhost:8090` | Opens as app (no browser UI) |
| `--disable-background-timer-throttling` | Prevents video pausing when tab not active |
| `--disable-renderer-backgrounding` | Keeps video playing in background |
| `--user-data-dir=/tmp/chrome-pos` | Isolated profile for PoS |

## 🔍 Troubleshooting

### Still Getting Autoplay Errors?
1. **Check Chrome version**: Use Chrome 88+ for best autoplay support
2. **Verify flags**: Ensure `--autoplay-policy=no-user-gesture-required` is present
3. **Check video attributes**: Videos are automatically muted for autoplay
4. **Test in incognito**: `--incognito` flag can help isolate issues

### Video Not Playing?
1. **Check URL**: Ensure video loads from `http://localhost:8090`
2. **Check format**: MP4 with H.264 codec recommended
3. **Check network**: Ensure localhost:8090 is accessible
4. **Check console**: Look for 404 or CORS errors

## 🛡️ Security Considerations

For production PoS systems:
- Use `--disable-web-security` only in controlled environments
- Consider using `--user-data-dir` for isolated profiles
- Implement proper network security
- Regular Chrome updates for security patches

## 📱 Touch Screen Optimization

For touch-enabled PoS:
```bash
--touch-events=enabled \
--enable-pinch \
--overscroll-history-navigation=0
```

## 🔄 Auto-Restart on Crash

Create a watchdog script:
```bash
#!/bin/bash
while true; do
  ./start-pos.sh
  sleep 5
done
```

## 📊 Monitoring

Monitor video playback:
- Check browser console for errors
- Monitor network requests to localhost:8090
- Verify video element properties
- Test with different video formats
