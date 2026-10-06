# Workbench 导航 v1.11.2

对话模型菜单和 `/model` 共用聊天用途目录。向量、重排及明确的生图/视频型号从这两个聊天入口筛除，保留文本聊天和支持图片输入的聊天型号；原生推理等级和当前选择保留。模型设置、资料库用途和创作画布继续读取完整 LLM 目录。

此兼容适配绑定官方 Host `0.1.7-rc.2` 的 `sessionController.modelCatalog` 方法。该版本没有输出模态/用途字段，筛选采用明确的专用协议和媒体型号命名，不以 `inputModalities: text` 判断聊天资格。卸载恢复原方法；不覆盖后来安装的适配，也不修改官方发行包。

适用于官方 DeepSeek Harness Web **0.1.7-rc.2**。提供 56px 应用导航、独立对话列表及展开/收起控制；返回对话保留原会话，进入应用保留侧栏宽度偏好。

导航可独立安装，复用官方语义颜色与控件。主题独立为 `dsh-workbench-theme`，外观设置只由主题负责。停用主题保留导航；停用导航保留主题。没有主题时品牌槽使用官方 FishLogo。旧外观配置 schema 仅为升级迁移保留，不注册外观行或应用配色。

`workbench.brand.mark` 是导航声明的可选 single/root 子槽，owner 为 `{size, className?}`。主题通过官方槽声明生命周期贡献品牌，支持任意安装顺序、启停和重装。导航不引用主题包，也不渲染人物门户。

需要 Node.js 24。停止目标 Profile 后安装：

```sh
dsh plugin --profile web add /path/to/dsh-workbench-shell-1.11.2.tgz --ignore-scripts
dsh web
```

使用 DSH_HOME 指定目标数据目录。卸载使用 `dsh plugin --profile web remove dsh-workbench-shell`，重启恢复官方导航。文档、会话与其他业务插件独立运行。原生桌面标题栏不应用此 Web 导航。

开发：`npm ci`、`npm run build`、`npm run check`、`npm test`、`npm pack`。导航测试覆盖路由、宽度偏好、原生品牌回退与清理。此前主题源码与测试保留为开发历史，不进入导航客户端；对应现行主题与迁移测试在独立主题目录运行。

rc.2 没有公开侧栏宽度 setter，本插件只投影原生 frame 的首轨宽度；不改原生布局偏好、业务数据或会话状态。停用释放自有样式、标记、观察器和子槽。升级宿主需复核有限 DOM 适配。

Client 样式在插入页面前标记官方 Loader 的插件归属；其他插件加载或热更新不能认领和移除本插件的 CSS，自身停用仍释放自己创建的节点。构建后可用 `DSH_RUNTIME_ROOT=/path/to/official-runtime npm run test:client` 运行真实 rc.2 Loader/Cordis 生命周期回归；配对导航／主题需要已有构建产物，可通过 `DSH_PEER_PACKAGE_ROOT` 指定另一独立目录。测试覆盖其他插件热更新、自身启停恢复、旧实例释放及两种加载顺序，使用内存 DOM，不代替浏览器界面验收。
