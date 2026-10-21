#!/bin/bash
# Build and run a small AppleScript applet that replaces DSH's bundle icon with
# the Forge-Cathedral icon. macOS requires the modifying app to be allowed under
# 系统设置 → 隐私与安全性 → App 管理 (App Management); the applet triggers that
# prompt on first run.
set -e
cd "$(dirname "$0")"
APP="/tmp/AdmechIconFixer.app"
rm -rf "$APP"
osacompile -o "$APP" ./macos-app-icon-fixer.applescript
open "$APP"
echo "已打开替换器：$APP"
echo "如果出现「想要修改其他 App」的系统提示，请点「允许」；成功后 Dock 会自动刷新。"
