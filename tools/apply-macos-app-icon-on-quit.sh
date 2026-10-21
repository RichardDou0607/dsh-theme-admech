#!/bin/bash
# Installs the themed macOS app icon after DSH quits (a running app bundle is
# protected by macOS App Management). Submitted as a launchd user job so it
# survives the DSH process exiting, then relaunches DSH.
LOG="/tmp/admech-app-icon-apply.log"
APP="/Applications/DeepSeek Harness.app"
SRC="/Users/richard_dou/Desktop/插件工厂/admech-theme/plugin/assets/app-icon"
BACKUP="$HOME/.dsh-theme-admech/app-icon-backup"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$LOG"; }

log "job started; waiting for DeepSeek Harness to quit"
# A running app bundle cannot be modified (macOS App Management); wait until gone.
while pgrep -f '/Contents/MacOS/DeepSeek Harness' >/dev/null 2>&1; do
  sleep 2
done
sleep 2
log "app quit detected; installing themed icon"

mkdir -p "$BACKUP" 2>/dev/null || true
if [ ! -f "$BACKUP/icon.icns" ] && [ -f "$APP/Contents/Resources/icon.icns" ]; then
  cp -p "$APP/Contents/Resources/icon.icns" "$BACKUP/icon.icns" 2>/dev/null || true
fi
if [ ! -f "$BACKUP/icon.png" ] && [ -f "$APP/Contents/Resources/icon.png" ]; then
  cp -p "$APP/Contents/Resources/icon.png" "$BACKUP/icon.png" 2>/dev/null || true
fi

if cp "$SRC/AppIcon.icns" "$APP/Contents/Resources/icon.icns" && cp "$SRC/icon-1024.png" "$APP/Contents/Resources/icon.png"; then
  chmod 644 "$APP/Contents/Resources/icon.icns" "$APP/Contents/Resources/icon.png" 2>/dev/null || true
  touch "$APP" 2>/dev/null || true
  /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP" >/dev/null 2>&1 || true
  log "icon replaced: $(md5 -q "$APP/Contents/Resources/icon.icns" 2>/dev/null)"
else
  log "ERROR: icon copy failed (App Management still blocking?)"
fi

killall Dock 2>/dev/null || true
sleep 2
log "reopening DeepSeek Harness"
open -a "$APP" 2>>"$LOG" || true
log "done"
