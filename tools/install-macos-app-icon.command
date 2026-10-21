#!/bin/bash
# Double-click in Finder to install the themed macOS application icon.
# Logs to /tmp/admech-app-icon-install.log so the agent can report the result.
LOG="/tmp/admech-app-icon-install.log"
exec > >(tee "$LOG") 2>&1
echo "=============================================================="
echo " dsh-theme-admech · 机械神教 macOS 应用图标安装"
echo "=============================================================="
echo "需要一次管理员密码（sudo）。终端里输入密码时不会显示字符。"
echo
cd "$(dirname "$0")" || exit 1
./install-macos-app-icon.sh install
status=$?
echo
if [ "$status" -ne 0 ]; then
  echo "安装没有完成。如果看到 Operation not permitted："
  echo "  打开 系统设置 → 隐私与安全性 → App Management（App 管理）"
  echo "  允许 Terminal（或 DeepSeek Harness），然后重新双击本文件。"
fi
echo
echo "日志：$LOG"
read -n 1 -s -r -p "按任意键关闭此窗口…"
