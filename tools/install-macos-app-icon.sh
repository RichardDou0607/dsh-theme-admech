#!/bin/bash
# dsh-theme-admech — macOS 应用图标安装 / 还原
#
# 把 DSH 桌面应用 (Dock / Finder / Cmd-Tab) 的图标换成机械神教齿轮-骷髅主题图标。
#
# 用法：
#   tools/install-macos-app-icon.sh install   # 替换图标（需要管理员密码）
#   tools/install-macos-app-icon.sh restore   # 还原原始图标
#   tools/install-macos-app-icon.sh status    # 查看当前状态
#
# 可选环境变量：
#   DSH_APP_PATH=/path/to/DeepSeek Harness.app
#
# 注意：
# - 这是对已安装应用包的资源替换，不是插件运行时行为；DSH 更新后会被覆盖，重新执行 install 即可。
# - 修改已签名应用包内的资源会让 codesign 校验失效（macOS 一般仍在本地正常启动，
#   若启动异常，执行 restore 还原即可）。原始图标会备份在
#   ~/.dsh-theme-admech/app-icon-backup/。
set -euo pipefail

APP="${DSH_APP_PATH:-/Applications/DeepSeek Harness.app}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$HERE/../assets/app-icon"
BACKUP="${HOME}/.dsh-theme-admech/app-icon-backup"
ICNS="$APP/Contents/Resources/icon.icns"
PNG="$APP/Contents/Resources/icon.png"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

usage() {
  sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'
}

need_app() {
  [ -d "$APP" ] || { echo "找不到应用：${APP}（可用 DSH_APP_PATH 指定）" >&2; exit 1; }
}

refresh_icon_cache() {
  # Touch the bundle so LaunchServices notices the changed icon, then let the
  # Dock reload it. A running app may keep its old Dock tile until relaunched.
  sudo touch "$APP" "$ICNS" "$PNG" 2>/dev/null || true
  if [ -x "$LSREGISTER" ]; then
    "$LSREGISTER" -f "$APP" >/dev/null 2>&1 || true
  fi
  sudo killall Dock 2>/dev/null || true
  echo "已刷新 Dock。若 Dock 中的图标没有变化，请退出并重新打开 DSH。"
}

current_md5() { md5 -q "$1" 2>/dev/null || true; }

case "${1:-}" in
  install)
    need_app
    [ -f "$ASSETS/AppIcon.icns" ] || { echo "缺少 $ASSETS/AppIcon.icns" >&2; exit 1; }
    [ -f "$ASSETS/icon-1024.png" ] || { echo "缺少 $ASSETS/icon-1024.png" >&2; exit 1; }
    echo "即将替换：$APP"
    echo "  icon.icns ← assets/app-icon/AppIcon.icns"
    echo "  icon.png  ← assets/app-icon/icon-1024.png"
    echo "原始图标备份到：$BACKUP"
    sudo -v
    mkdir -p "$BACKUP"
    [ -f "$BACKUP/icon.icns" ] || sudo cp -p "$ICNS" "$BACKUP/icon.icns"
    [ -f "$BACKUP/icon.png" ] || sudo cp -p "$PNG" "$BACKUP/icon.png"
    sudo cp "$ASSETS/AppIcon.icns" "$ICNS"
    sudo cp "$ASSETS/icon-1024.png" "$PNG"
    sudo chmod 644 "$ICNS" "$PNG"
    echo "已写入主题图标（$(current_md5 "$ICNS")）。"
    refresh_icon_cache
    echo "完成。提示：DSH 更新会恢复官方图标，更新后重新运行 install 即可。"
    ;;
  restore)
    need_app
    [ -f "$BACKUP/icon.icns" ] || { echo "没有找到备份：$BACKUP/icon.icns" >&2; exit 1; }
    [ -f "$BACKUP/icon.png" ] || { echo "没有找到备份：$BACKUP/icon.png" >&2; exit 1; }
    sudo -v
    sudo cp "$BACKUP/icon.icns" "$ICNS"
    sudo cp "$BACKUP/icon.png" "$PNG"
    sudo chmod 644 "$ICNS" "$PNG"
    echo "已还原官方图标。"
    refresh_icon_cache
    ;;
  status)
    need_app
    cur="$(current_md5 "$ICNS")"
    want=""
    [ -f "$ASSETS/AppIcon.icns" ] && want="$(current_md5 "$ASSETS/AppIcon.icns")"
    if [ -n "$want" ] && [ "$cur" = "$want" ]; then
      echo "主题应用图标：已安装（${cur}）"
    else
      echo "主题应用图标：未安装（当前 ${cur}）"
      if [ -f "$BACKUP/icon.icns" ]; then
        echo "官方图标备份：$(current_md5 "$BACKUP/icon.icns")"
      fi
    fi
    ;;
  ""|-h|--help|help)
    usage
    ;;
  *)
    echo "未知命令：${1}" >&2
    usage >&2
    exit 2
    ;;
esac
