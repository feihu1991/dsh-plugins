# DSH Mobile Sidebar Drawer

一个 DeepSeek Harness Web GUI 的手机端适配插件：**竖屏时把左侧栏完全收成离屏抽屉**，点汉堡按钮滑出、点遮罩收回。

## 效果

- **竖屏（高 ≥ 宽）**：侧边栏（连同原来 56px 的图标栏）完全收起，内容占满全宽；左上角出现 ☰ 按钮。
- **点 ☰**：侧边栏从左侧滑出，覆盖在内容上、带阴影。
- **点遮罩 / 侧边栏顶部折叠按钮**：收回。
- **横屏**：完全不生效，恢复桌面布局。

## 原理

- 触发条件：CSS `@media (orientation: portrait)`（即「竖向大于横向」）。
- 状态复用框架自带的 `data-sidebar-collapsed` 标记 + `layout.toggleSidebar()`，因此汉堡按钮、遮罩、侧边栏自带折叠按钮三种开关天然同步，不会状态错位。
- 用 `:has()` 选择器和 data 属性定位框架元素，不依赖会被 hash 打乱的 CSS Module 类名。
- 依赖 CSS `:has()`（Chrome 105+ / Safari 15.4+ / Firefox 121+）；不支持的老浏览器会优雅降级为框架默认的 56px 图标栏。

## 文件

- `mobile-sidebar-drawer.js` —— 插件源码，即动态插件的 `code.client`（Client half，无 Host half）。

## 如何应用（动态插件方式）

在 DSH Web GUI 里，让 agent 用 `cordis_define` 把 `mobile-sidebar-drawer.js` 的内容作为 `code.client` 定义，然后 `cordis_run`（首次会要求授权）。

> 注意：动态插件是**进程级的临时扩展**，重启 harness 进程后需要重新应用。要永久内置，需要把它打包进 web shell 源码并重新构建（DSH 的 client-plugin 机制）。

## 在你的 Termux 场景下

1. 在安卓的 Termux 里运行 DSH（Node 服务）。
2. 手机浏览器打开 DSH Web GUI（通常是 `http://127.0.0.1:<端口>`）。
3. 在会话里让 agent 应用本插件（见上），竖屏下侧边栏就会收成抽屉。
