# Workbench 导航（dsh-workbench-shell）

给官方 DeepSeek Harness Web 换上紧凑的应用导航：56px 的应用栏、独立的对话列表，以及侧栏展开/收起控制。可以单独安装，不依赖其他插件。

当前版本 1.11.2，适用于官方 DeepSeek Harness **0.1.7-rc.2**。

## 安装

需要 Node.js 24 和已安装的官方 `dsh` 0.1.7-rc.2。先停止目标 Profile，再安装并启动：

```sh
dsh plugin --profile web add dsh-workbench-shell
dsh web
```

用环境变量 `DSH_HOME` 指定要安装到的数据目录。也可以安装本地构建的包：`dsh plugin --profile web add /绝对路径/dsh-workbench-shell-1.11.2.tgz`。

卸载：

```sh
dsh plugin --profile web remove dsh-workbench-shell
```

重启后恢复官方导航。文档、会话和其他业务插件不受影响。

## 功能

- **应用导航**：56px 应用栏加独立对话列表。从应用返回对话时保留原会话，进入应用时保留侧栏宽度偏好。
- **对话模型菜单筛选**：对话模型菜单和 `/model` 只列出可用于聊天的型号，筛除向量、重排以及明确的生图/视频型号；保留文本聊天和支持图片输入的聊天型号、原生推理等级和当前选择。模型设置页等其他入口仍读取完整目录。
- **品牌槽**：声明可选子槽 `workbench.brand.mark`（owner 为 `{size, className?}`），供主题插件贡献品牌标志。没有主题时显示官方 FishLogo。

## 与主题插件的关系

外观设置由独立的 [dsh-workbench-theme](https://github.com/lucky01222/dsh-workbench-theme) 负责，本插件不注册外观设置或配色，也不引用主题包。两者可按任意顺序安装、启停和重装：停用主题保留导航，停用导航保留主题。旧版本遗留的外观配置 schema 只为升级迁移保留。

## 兼容性与限制

- 只适配官方 Web **0.1.7-rc.2**。升级宿主后需要重新核对下面两处适配。
- 模型筛选绑定该版本的 `sessionController.modelCatalog` 方法。rc.2 没有输出模态或用途字段，所以筛选依据明确的专用协议和媒体型号命名，不以 `inputModalities: text` 判断。卸载时恢复原方法，不覆盖之后安装的其他适配，也不修改官方发行包。
- rc.2 没有公开的侧栏宽度 setter，本插件只投影原生 frame 的首轨宽度，不改原生布局偏好、业务数据或会话状态。
- 原生桌面标题栏不应用此 Web 导航。
- 停用时释放自己创建的样式、标记、观察器和子槽。Client 样式在插入页面前标记所属插件，其他插件加载或热更新不会误移除本插件的 CSS。

## 开发

```sh
npm ci
npm run build
npm run check
npm test
npm pack
```

测试覆盖路由、宽度偏好、原生品牌回退与清理。构建后可用 `DSH_RUNTIME_ROOT=/path/to/official-runtime npm run test:client` 在真实 rc.2 Loader/Cordis 下跑生命周期回归；与主题配对的测试需要主题的构建产物，用 `DSH_PEER_PACKAGE_ROOT` 指向它的目录。这些测试使用内存 DOM，不代替浏览器界面验收。

仓库中保留的早期主题源码与测试属于开发历史，不进入导航客户端。

## 许可

代码以 MIT 许可发布。`src/assets` 中保留的图片不在 MIT 许可范围内，来源与权利说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
