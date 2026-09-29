# Workbench 导航 v1.8.3

适用于官方 DeepSeek Harness Web 0.1.7-rc.2。保留官方侧栏插槽和会话状态，在外侧提供 56px 应用导航。

- 顶部鲸鱼为“对话”入口，返回已有会话，不新建会话。
- 对话列表展开/收起按钮放在对话页头左侧，与右侧面板按钮对齐。
- 工作室和其他插件页面完全隐藏会话栏。返回对话时保留原生展开状态及自定义宽度。
- 会话折叠按钮与官方快捷键均使用 `layout.toggleSidebar()`；手动关闭后再打开采用官方默认宽度。
- 图标、Tooltip、React 使用官方共享模块。

通过官方 `shell.overlay` 和 `conversation.header.leading` 插槽注册控件。该版本没有公开的侧栏宽度 setter，因此仅在插件页用限定于原生 frame 的 CSS 投影首列为 56px；不修改官方 inline template、原生宽度偏好、会话数据或右侧轨道。卸载会清除 CSS、DOM 标记、订阅和观察器。原生桌面标题栏不应用此 Web 皮肤。

构建与验证：`npm run build && npm run check && npm test`。
安装：`dsh plugin --profile web add /绝对路径/dsh-workbench-shell-1.8.3.tgz --ignore-scripts --offline`。
