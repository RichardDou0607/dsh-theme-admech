#!/bin/bash
# Installs the themed macOS app icon after DSH fully quits.
# macOS protects a running app bundle (any process executing from the bundle,
# including crashpad/helper processes, keeps the protection active), so wait for
# the whole bundle to be idle, then retry the copy until App Management lets go.
LOG="/tmp/admech-app-icon-apply.log"
APP="/Applications/DeepSeek Harness.app"
SRC="/Users/richard_dou/Desktop/插件工厂/admech-theme/plugin/assets/app-icon"
BACKUP="$HOME/.dsh-theme-admech/app-icon-backup"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$LOG"; }

log "v3 job started; waiting for DeepSeek Harness bundle to be idle"
while pgrep -f '/Applications/DeepSeek Harness.app/' >/dev/null 2>&1; do
  sleep 1
done
# LaunchServices may still report the application for a moment after the last
# process exits; wait for that too.
for i in $(seq 1 30); do
  asn="$(lsappinfo find bundleID=com.deepseek.dsh 2>/dev/null)"
  [ -z "$asn" ] && break
  sleep 1
done
sleep 6

mkdir -p "$BACKUP" 2>/dev/null || true
if [ ! -f "$BACKUP/icon.icns" ] && [ -f "$APP/Contents/Resources/icon.icns" ]; then
  cp -p "$APP/Contents/Resources/icon.icns" "$BACKUP/icon.icns" 2>/dev/null || true
fi
if [ ! -f "$BACKUP/icon.png" ] && [ -f "$APP/Contents/Resources/icon.png" ]; then
  cp -p "$APP/Contents/Resources/icon.png" "$BACKUP/icon.png" 2>/dev/null || true
fi

ok=0
for attempt in $(seq 1 60); do
  if cp "$SRC/AppIcon.icns" "$APP/Contents/Resources/icon.icns" 2>>"$LOG" && \
     cp "$SRC/icon-1024.png" "$APP/Contents/Resources/icon.png" 2>>"$LOG"; then
    ok=1
    log "icon copied on attempt $attempt"
    break
  fi
  sleep 2
done

if [ "$ok" = "1" ]; then
  chmod 644 "$APP/Contents/Resources/icon.icns" "$APP/Contents/Resources/icon.png" 2>/dev/null || true
  touch "$APP" 2>/dev/null || true
  /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP" >/dev/null 2>&1 || true
  log "icon replaced: $(md5 -q "$APP/Contents/Resources/icon.icns" 2>/dev/null)"
else
  log "ERROR: icon copy failed after retries; reopening anyway"
fi

killall Dock 2>/dev/null || true
sleep 3
log "reopening DeepSeek Harness"
open -a "$APP" 2>>"$LOG" || true
log "done"
