#!/bin/bash
# Double-click in Finder to install the themed macOS application icon.
# It asks for your administrator password once (Terminal / sudo), replaces
# /Applications/DeepSeek Harness.app's icon.icns + icon.png with the backup made
# first, then refreshes the Dock. Re-run after a DSH update.
cd "$(dirname "$0")" || exit 1
exec ./install-macos-app-icon.sh install
