<p align="center">
  <img src="./public/favicon.svg" width="96" height="96" alt="JSONF Logo" />
</p>

<h1 align="center">JSONF</h1>

<p align="center">
  本地优先、打开即用的开发者工具平台
</p>

JSONF 基于 Vue 3、Vue Router、TypeScript 和 Vite 构建。目前提供 JSON 工作台与时间戳工具，并通过统一主页和独立路由组织功能。它适合日常排查接口日志、整理配置文件、转换时间数据以及快速校对跨时区结果。

> 所有处理都在浏览器本地完成，项目不会把输入内容发送到任何服务端。

## 当前工具

### JSON 工作台

- **格式化与压缩**：支持 2 空格、4 空格、Tab 缩进，快速在可读 JSON 和最小化 JSON 之间切换。
- **JSON 校验**：实时识别有效、无效和空闲状态，并尽可能标出错误行列。
- **JSON 修复**：集成 `jsonrepair`，可尝试修复常见的非标准 JSON 输入。
- **保留转义模式**：面向接口日志、嵌套字符串、转义换行等场景，减少格式化时不必要的转义变化。
- **输入与输出双栏工作区**：支持 Input、Output 双向发送、交换内容和独立编辑。
- **树形结构查看**：将 JSON 渲染为树节点，支持复制值、复制路径、提取节点、添加节点、删除节点和内联编辑。
- **搜索与定位**：支持输出文本搜索、树节点搜索，并在状态栏显示当前推断的 JSONPath。
- **折叠与展开**：编辑器支持轻量 JSON 块折叠，树视图支持整体展开和折叠。
- **文件导入导出**：支持上传 `.json` 文件、拖拽文件到输入区、下载格式化结果。

### 时间戳工具

- **实时当前时间戳**：支持秒、毫秒显示，可暂停、继续和复制。
- **智能转换**：识别 10 位秒、13 位毫秒、16 位微秒、19 位纳秒时间戳，以及日期时间和 ISO 8601。
- **多时区对照**：支持 `Asia/Shanghai`、UTC、伦敦和纽约等时区结果对照。
- **时间计算**：按分钟、小时或天数增加、减少时间偏移。
- **批量转换**：逐行转换多条时间戳或日期时间。
- **代码片段**：提供 JavaScript、Java、Python、Go、Shell 等常用语言的时间戳代码。
- **本地历史**：保存最近转换记录，支持回填、删除和清空。

### 平台能力

- **工具主页**：集中展示可用工具，点击 Logo 可随时返回主页。
- **独立路由**：每个工具拥有可直接访问的 URL。
- **多语言界面**：内置简体中文、繁体中文和英文。
- **主题与偏好设置**：支持明暗主题、字号、自动换行、行号等本地偏好。
- **本地持久化**：工作台内容、时间戳历史、布局宽度和偏好保存在浏览器 `localStorage` 中。

## 在线使用方式

当前项目是一个前端单页应用，可以通过本地开发服务器或构建后的静态文件运行，也可以部署到 Netlify、Vercel、Nginx 或其他静态托管服务。由于项目使用 History 路由模式，生产环境需要把未知路径回退到 `index.html`，才能直接访问 `/json` 和 `/timestamp`。

## 快速开始

### 环境要求

- Node.js `20.19+` 或 `22.12+`
- npm

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

启动后根据终端提示打开本地地址，通常是：

```text
http://localhost:5173
```

当前路由：

- `/`（工具主页）
- `/json`
- `/timestamp`

### 构建生产版本

```bash
npm run build
```

构建产物会输出到 `dist/` 目录。

### 本地预览生产版本

```bash
npm run preview
```

## 使用指南

### JSON 格式化

1. 将 JSON 粘贴到左侧 Input 区，或拖入 `.json` 文件。
2. 点击「格式化」「压缩」「校验」「修复」等命令处理内容。
3. 在 Output 区查看格式化结果，或切换到「树」模式查看结构。
4. 在树节点上复制值、复制路径、提取节点，或直接添加、删除、重命名和编辑叶子节点。
5. 使用中间的传输按钮将 Input 发送到 Output、交换两侧内容，或把 Output 回填到 Input。
6. 根据场景开启「保留转义」「自动格式化」、Key 排序、自动换行和行号。

### 时间戳转换

1. 在主页选择「时间戳转换」，或直接访问 `/timestamp`。
2. 输入时间戳、日期时间或 ISO 8601 内容。
3. 选择输入类型与解析时区；保留「自动识别」可覆盖常见输入。
4. 查看本地时间、UTC、ISO 8601、Unix 秒和 Unix 毫秒结果。
5. 根据需要切换到时间计算或批量转换，并使用历史记录快速回填。

## 项目结构

```text
jsonf/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── app/
│   │   ├── router.ts
│   │   └── tools.ts
│   ├── components/
│   │   ├── IconButton.vue
│   │   └── SettingsPanel.vue
│   ├── features/
│   │   ├── home/
│   │   │   └── HomeView.vue
│   │   ├── json/
│   │   │   ├── components/
│   │   │   ├── composables/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── timestamp/
│   │       ├── components/
│   │       └── services/
│   ├── composables/
│   │   └── usePreferences.js
│   ├── config/
│   │   └── i18n.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── storage.js
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

## 核心模块说明

### `src/app/router.ts` 与 `src/app/tools.ts`

维护平台路由和顶部工具入口。当前主页位于 `/`，JSON 工作台位于 `/json`，时间戳工具位于 `/timestamp`。

### `src/features/home/HomeView.vue`

工具平台主页，负责展示当前可用工具并提供直接入口。

### `src/features/json/composables/useJsonWorkbench.js`

JSONF 的主要状态中心，负责输入、输出、视图模式、校验状态、树节点选择、本地存储和用户命令。组件层的大多数按钮行为都会委托到这里执行。

### `src/features/json/services/jsonService.ts`

集中处理 JSON 解析、格式化、压缩、修复、Key 排序、统计信息和错误位置归一化。这样组件只需要关心展示，不需要散落 JSON 处理细节。

### `src/features/json/services/treeService.ts`

将普通 JSON 值转换成树视图可渲染的节点模型，并生成稳定的 JSONPath 风格路径，例如 `$.user.name`、`$.items[0]`、`$["odd-key"]`。

### `src/features/json/components/JsonEditor.vue`

轻量代码编辑器组件。它使用透明 `textarea` 作为真实输入层，并用背后的 `pre` 渲染语法高亮、搜索高亮、当前行和折叠状态。

### `src/features/json/components/JsonTreeNode.vue`

递归树节点组件，支持节点选择、上下文菜单、节点搜索高亮、内联修改 key 和修改叶子节点 value。

### `src/features/timestamp/services/timestampService.ts`

时间戳工具的纯逻辑服务，负责多精度时间戳识别、日期时间解析、时区偏移和格式化，并由 Vitest 覆盖核心边界。

### `src/features/timestamp/components/TimestampTool.vue`

时间戳交互界面，包含实时计时、智能转换、时间计算、批量转换、历史记录和多语言代码片段。

## 隐私与数据安全

- JSON 内容与时间数据只在当前浏览器中解析和处理。
- 项目没有后端服务，也没有内置远程上传逻辑。
- 工作台内容、时间戳历史和偏好设置会写入浏览器 `localStorage`，用于刷新后恢复状态。
- 如果处理敏感数据，建议在使用完成后点击「清空」，或清理浏览器站点数据。

## 技术栈

- [Vue 3](https://vuejs.org/)：界面和响应式状态管理。
- [Vue Router](https://router.vuejs.org/)：为每个工具提供独立 URL。
- [TypeScript](https://www.typescriptlang.org/)：约束核心服务与平台配置。
- [Vitest](https://vitest.dev/)：覆盖 JSON 与时间戳核心逻辑。
- [Vite](https://vite.dev/)：开发服务器和构建工具。
- [jsonrepair](https://github.com/josdejong/jsonrepair)：JSON 修复能力。
- [Lucide Vue](https://lucide.dev/)：图标库。

## 可用脚本

| 命令                   | 说明                               |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | 启动 Vite 开发服务器               |
| `npm run build`        | 构建生产版本                       |
| `npm run preview`      | 本地预览生产构建                   |
| `npm run typecheck`    | 执行 TypeScript 类型检查           |
| `npm run test`         | 运行 Vitest 单元测试               |
| `npm run test:watch`   | 以监听模式运行单元测试             |
| `npm run lint`         | 执行 ESLint 检查                   |
| `npm run format`       | 格式化 TypeScript 与工程配置       |
| `npm run format:check` | 检查 TypeScript 与工程配置格式     |
| `npm run check`        | 依次执行类型、规范、测试与构建检查 |

## 质量保障

- JSON 解析、修复、错误位置与时间戳解析等核心逻辑由 Vitest 覆盖。
- `npm run check` 串联类型检查、ESLint、Prettier、单元测试和生产构建。
- GitHub Actions 会在 `main` 推送和 Pull Request 时执行同一套检查。
- 当前架构采用渐进式 TypeScript：平台配置和核心服务优先使用 TypeScript，存量 Vue 组件按工具领域持续演进。

## 开发建议

- JSON 解析、格式化和转换逻辑优先放到 `src/features/json/services/`。
- 工具私有状态与组件放到对应的 `src/features/<tool>/` 领域目录。
- 纯展示组件尽量保持无业务逻辑，只通过 props 和 emits 与外部交互。
- 新增界面文案时，请同步更新 `src/config/i18n.js` 中的三种语言。
- 新增工具入口时，优先扩展 `src/app/tools.ts` 和 `src/app/router.ts`，再实现对应领域视图。
- 提交前运行 `npm run check`，确保本地检查与 CI 一致。

## 常见问题

### JSONF 会上传我的 JSON 吗？

不会。JSON 和时间戳工具都在浏览器本地运行，没有服务端接口调用。

### 为什么直接访问工具路由时出现 404？

项目使用 Vue Router History 模式。部署静态文件时，需要把 `/json`、`/timestamp` 等未知服务器路径统一回退到 `index.html`。

### 为什么有些错误位置不够精确？

不同浏览器的 `JSON.parse` 错误信息格式不完全一致。JSONF 会优先读取错误中的字符位置，再换算为行列；如果运行时没有提供位置，只能做有限的 token 回退定位。

### 树节点编辑支持所有 JSONPath 吗？

不支持完整 JSONPath 语法。项目内部使用的是一个稳定子集：`$.key`、`$["complex-key"]` 和 `$[0]`，用于定位当前树模型中的节点。

### 修复 JSON 一定成功吗？

不一定。`jsonrepair` 可以处理很多常见问题，例如多余逗号、缺失引号、JavaScript 风格对象等，但无法保证修复所有损坏输入。修复后仍建议再次校验。

## 路线图

- JSON 对比视图
- JSON 转换工具
- Base64、URL、Unicode 等编码工具
- 导入导出用户偏好
- 更完整的键盘快捷键

## 贡献

欢迎提交 Issue 或 Pull Request。建议在提交前确认：

1. 变更范围清晰，避免混入无关格式化。
2. `npm run check` 可以通过。
3. 新增功能有对应的界面文案和必要说明。
4. 涉及 JSON 处理逻辑时，尽量覆盖有效、无效、空输入和大对象场景。

## License

当前仓库还没有声明许可证。如果要作为正式开源项目发布，建议补充 `LICENSE` 文件，例如 MIT、Apache-2.0 或其他适合项目目标的许可证。
