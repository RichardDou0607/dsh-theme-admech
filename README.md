# dsh-theme-admech — 机械神教 · 铸炉圣殿（纯 A / v0.4.1）

> **状态：v0.4.1 已实现，真实 DSH 0.2.1-rc.2 渲染与 layout_audit 验收通过。**
> 尚未安装到你的日常桌面 profile（桌面 profile 由 Electron 独占写入，需你在「插件」页点一次安装）。
> 图标标准 = 你提供的齿轮-骷髅：只改颜色、等比缩放，不重绘。

![hero](shots/hero-desktop.png)

## v0.4 重点

### 1. 输入框：去掉大弧线，改成尖顶神殿 crest

- 原先的宽弧形顶饰已删除；改为**陡峭尖顶 + 双塔 + 尖拱窗 + 卷叶饰 + 你提供的齿轮-骷髅徽记**；
- 装饰主体上移，只让底部山花压在上边框；**不进入文字区域**，不遮挡 placeholder / 输入内容；
- 保留黄铜双线框、四角花窗、圆形火星红发送键，输入区保持清晰；
- 顶部小铭文 “EX FERRO · EX IGNE” 只在卡片上沿，不压正文。

### 2. 背景：面式尖拱 portal，替代纯弧线

- 中央改为**由直线段构成的尖拱大门**（faceted pointed arch）：多层 archivolt 石带、锯齿/菱形雕饰、尖顶山花（gable）、卷叶饰（crockets）、两侧尖塔与扶壁、侧柱、雕像龛；
- 门内保留彩窗，但不再用大圆形玫瑰窗，也不用单一圆滑曲线；
- 两侧加入尖拱 arcade / triforium 小拱 / 束柱；
- 旗帜与背景多处使用你提供的齿轮-骷髅，并加入复杂祷文：OMNISSIAH / DEUS MACHINA / EX FERRO / EX IGNE / IN TENEBRIS / LUX AETERNA / SURGE MACHINA / MARS INVICTA；
- 地面、柱身、山花、门楣都有祷文铭刻；烛光、锻炉、光柱、尘埃、苔藓、裂缝、锈迹强化“黑暗中辉煌、腐朽中不屈”。

### 3. 小鲸鱼 → 齿轮-骷髅

- hero 标题前的 DeepSeek 小鲸鱼已替换为你提供的齿轮-骷髅；
- 品牌标识、旗帜、对话框徽章、输入框 crest、插件卡片统一使用同一标准徽记。

### 4. 对话框 / 会话框

- 设置等模态框使用尖顶徽章 + 四角花窗 + 标题装饰线 + 黄铜双框；
- 会话区四周使用**尖顶式 conversation crest**（不再是纯弧），两侧束柱轨、底部 arcade 饰带与纵向祷文；
- 聊天内容保持可读，装饰都带 pointer-events: none。

## 验证

- 隔离 DSH Home 的 **DSH 0.2.1-rc.2** profile 安装并启用；
- layout_audit **PASS**：1440×900 + 390×844，**0 errors**；
- 报告：.layout-guard/runs/20261018-192206-1t7v-audit/report.json；
- 控制台无插件报错；
- 图标替换：hero 页 24/33 个可见 SVG、插件页 28/35 个。

## 安装

1. 左侧栏 **插件** → **添加插件**（或箭头 → 安装第三方插件）
2. 路径：

    /Users/richard_dou/Desktop/插件工厂/admech-theme/plugin

3. 安装 → **立即启用**；提示重启就重启 DSH。

## 构建与源码

    src/icons.json            # 32 枚 UI 图标，emblem 使用你提供的图标
    src/styles.css            # token / 输入框 shrine / 会话框 crest / 图标
    src/client-template.js    # 主题、图标替换、徽记与装饰
    src/build-client.mjs      # 生成 lib/client.js
    assets/gear-skull-gold-*.png
    assets/forge-cathedral.svg / .png

    cd admech-theme/plugin
    node src/build-client.mjs
    node --check lib/client.js

## 边界

- 背景仍是矢量 SVG 插画，不是照片级 / 手绘原画；可以继续细化；
- 深色 only；设置页 / 仪式动画 / 音效未做；
- tool 卡 / 审批卡尚未逐组件精修；
- 桌面版尚未安装到你的日常 profile。

## IP

粉丝向原创演绎；背景为原创 SVG；齿轮-骷髅来自你提供的素材，仅按你的要求用于自用主题。


## 从 GitHub 安装（公开仓库）

仓库地址：

    https://github.com/RichardDou0607/dsh-theme-admech

### DSH Desktop

1. 左侧栏 **插件** → **添加插件**（或箭头 → 安装第三方插件）；
2. 输入 Git 地址：

       github:RichardDou0607/dsh-theme-admech

   或：

       https://github.com/RichardDou0607/dsh-theme-admech

3. 安装 → **立即启用**；提示重启就重启 DSH。

也可以直接下载仓库 ZIP，解压后以本地目录安装。

### DSH Web / CLI

    dsh plugin --profile web add "github:RichardDou0607/dsh-theme-admech"

## 许可 / IP（重要）

本仓库是**混合许可**，不是单一 OSI 开源许可：

- **代码**（src、lib、构建脚本、cordis.patch.yml）：MIT，见 LICENSE；
- **原创主题素材**（forge-cathedral.svg/png、手绘图标、输入/会话框 ornament、截图）：CC BY-NC-SA 4.0，仅限非商业使用，需署名并以相同方式共享；
- **你提供的齿轮-骷髅徽记**：由仓库所有者提供，未纳入 MIT / CC 授权，权利状态请见 ASSETS-LICENSE.md；
- **非官方粉丝作品**：与 Games Workshop 无关联，不含官方 logo / 官方插画；详见 DISCLAIMER.md；
- **非商业使用不等于没有版权/商标风险**。公开分发前请确认素材授权；商业使用前建议替换掉一切 GW 风格名称/符号，并咨询知识产权律师。




## Windows 适配状况（v0.4.1）

- **代码层面**：主题是纯 Web client 插件，没有 macOS 专用 API；Windows 版 DSH Desktop 使用同一套 Chromium/Node Web UI，理论兼容。
- **字体**：v0.4.1 已加入 Windows 回退：Palatino Linotype / SimSun / NSimSun / Microsoft YaHei / Cascadia Mono / Consolas。即使没有 Noto Serif CJK 或 Songti SC，也会落到 Windows 自带字体。
- **安装**：
  - 推荐在「插件」页输入 Git 地址安装；Windows 需要系统已安装 **Git for Windows**（pnpm 通过 git 拉取 github: 依赖）；
  - 如果没有 Git，或 Git 安装失败：下载 GitHub 仓库 ZIP → 解压 → 在插件页选择本地目录安装；
  - Windows 路径示例：C:\Users\<你的用户名>\Downloads\dsh-theme-admech-main
- **已知差异**：
  - Windows 125% / 150% 缩放、以及缺少 Palatino/Noto 时，字体行高和字距可能与 macOS 截图略有差异；
  - 背景 / 徽记 / 装饰均为内嵌 data URI，不依赖 macOS 路径；
  - 构建脚本使用 Node path API，可在 Windows 下运行 node src/build-client.mjs。
- **未验证**：当前实际渲染与 layout_audit 是在 macOS 的 DSH 0.2.1-rc.2 上完成的；尚未在 Windows 真机跑过。Windows 上如果出现字体重叠或装饰错位，请把截图/分辨率发我，我可以按 Windows 字体度量再调一版。
