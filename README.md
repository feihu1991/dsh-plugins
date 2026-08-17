# DSH Plugins

DeepSeek Harness (DSH) Web GUI 的自用插件集合 —— 主要面向「Termux + 手机浏览器」的使用场景，按插件分目录存放。

## 插件列表

- [mobile-sidebar-drawer](./mobile-sidebar-drawer) —— 手机端侧边栏抽屉：竖屏时左侧栏完全收起为离屏抽屉，点汉堡按钮滑出、点遮罩收回。
- [perler-pattern](./perler-pattern) —— 照片转拼豆图纸生成器：输入照片，输出编号网格 + 用料清单（MARD 色卡）。
- [dsh-mobile-hanui](./dsh-mobile-hanui) —— 修改版：修复点击 composer 卡片时软键盘焦点不稳定问题；支持侧边栏/抽屉滑动关闭。
- [dsh-opencode-go-quota](./dsh-opencode-go-quota) —— 修改版：适配移动端布局，额度环从右侧移到左侧。

## 修改版插件说明

### dsh-mobile-hanui (v0.2.3 修改版)
- 原：`Z-6354/dsh-mobile-hanui`
- 修改1：`src/client.js` 中 composer 点击检测额外匹配 `.INPUT.card` 和 `.INPUT.root`，修复点击输入区域时软键盘焦点不稳定的问题
- 修改2：**支持滑动关闭** —— 在侧边栏/抽屉上向右滑即可关闭面板（原来只能点 backdrop 或左滑 backdrop），手机随手一滑就能收回去

### dsh-opencode-go-quota (v0.3.2 修改版)
- 原：`GLFzr/dsh-opencode-go-quota`
- 修改：`lib/client.js` 中额度环从 `conversation.input.right` 改为 `conversation.input.left`（移动端右侧空间不足），tooltip 位置从 `right: 0` 改为 `left: 0`
