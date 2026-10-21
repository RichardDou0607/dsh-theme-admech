# 手动替换 DSH 应用图标（Finder）

macOS 的 App Management 保护阻止程序/安装包自动改应用包，需要你在 Finder 里授权一次。

1. 在打开的「图标替换包」Finder 窗口里，选中 icon.icns 和 icon.png（Cmd+A）。
2. 打开另一个 Finder 窗口：/Applications/DeepSeek Harness.app/Contents/Resources
   （或 Finder 里右键 DeepSeek Harness → 显示包内容 → Contents → Resources）
3. 把这两个文件拖进 Resources 文件夹，选择「替换」，出现系统密码框时输入管理员密码。
4. 替换完成后，在终端执行（或告诉我们）：
   killall Dock
5. Finder 图标会立即更新；Dock 里正在运行的 DSH 可能仍显示旧图标，退出并重新打开 DSH 后即为新图标。

还原官方图标：把 ~/.dsh-theme-admech/app-icon-backup/ 里的 icon.icns、icon.png 按同样方式拖回 Resources 覆盖即可。
