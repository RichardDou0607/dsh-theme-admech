-- macOS application-icon fixer for dsh-theme-admech.
-- Run this applet once (and allow it under 系统设置 → 隐私与安全性 → App 管理)
-- to replace DSH's bundle icns/png with the Forge-Cathedral icon in place.
--
-- If this checkout lives somewhere else, adjust src / appRes below.
on run
	set src to "/Users/richard_dou/Desktop/插件工厂/admech-theme/plugin/assets/app-icon"
	set appRes to "/Applications/DeepSeek Harness.app/Contents/Resources"
	set logPath to "/tmp/admech-iconfixer.log"
	try
		do shell script "cp " & quoted form of (src & "/AppIcon.icns") & " " & quoted form of (appRes & "/icon.icns")
		do shell script "cp " & quoted form of (src & "/icon-1024.png") & " " & quoted form of (appRes & "/icon.png")
		do shell script "/usr/bin/touch " & quoted form of "/Applications/DeepSeek Harness.app" & " && /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f " & quoted form of "/Applications/DeepSeek Harness.app" & " >/dev/null 2>&1; /usr/bin/killall Dock"
		do shell script "/bin/echo OK $(date '+%H:%M:%S') >> " & quoted form of logPath
		display notification "主题图标已替换，Dock 已刷新" with title "机械神教 · 图标修复"
	on error errMsg number errNum
		try
			do shell script "/bin/echo FAIL " & errNum & ": " & quoted form of errMsg & " >> " & quoted form of logPath
		end try
		display dialog "无法替换图标（错误 " & errNum & "）：" & errMsg & return & return & "如果系统询问是否允许修改其他 App，请点「允许」。也可以完全退出 DSH 后重试。" buttons {"好"} default button 1 with title "机械神教 · 图标修复"
	end try
end run
