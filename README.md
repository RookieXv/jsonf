# JSONF

JSONF 是一个本地优先的 JSON 工作台，基于 Vue 3、Vite 和 Composition API 构建。它不只是一个简单的格式化按钮，而是把 JSON 格式化、校验、修复、搜索、树形查看和节点编辑放在同一个高效界面里，适合日常排查接口日志、整理配置文件、查看复杂响应体和准备可读的 JSON 片段。

> 所有处理都在浏览器本地完成，项目默认不会把 JSON 内容发送到任何服务端。

## 功能特性

- **格式化与压缩**：支持 2 空格、4 空格、Tab 缩进，快速在可读 JSON 和最小化 JSON 之间切换。
- **JSON 校验**：实时识别有效、无效和空闲状态，并尽可能标出错误行列。
- **JSON 修复**：集成 `jsonrepair`，可尝试修复常见的非标准 JSON 输入。
- **保留转义模式**：面向接口日志、嵌套字符串、转义换行等场景，减少格式化时不必要的转义变化。
- **输入与输出双栏工作区**：支持 Input、Output 双向发送、交换内容和独立编辑。
- **树形结构查看**：将 JSON 渲染为树节点，支持复制值、复制路径、提取节点、添加节点、删除节点和内联编辑。
- **搜索与定位**：支持输出文本搜索、树节点搜索，并在状态栏显示当前推断的 JSONPath。
- **折叠与展开**：编辑器支持轻量 JSON 块折叠，树视图支持整体展开和折叠。
- **文件导入导出**：支持上传 `.json` 文件、拖拽文件到输入区、下载格式化结果。
- **多语言界面**：内置简体中文、繁体中文和英文。
- **主题与偏好设置**：支持明暗主题、字号、自动换行、行号等本地偏好。
- **本地持久化**：工作台内容、布局宽度和偏好会保存在浏览器 `localStorage` 中。

## 在线使用方式

当前项目是一个前端单页应用，可以通过本地开发服务器或构建后的静态文件运行。部署到任意静态托管服务也可以工作，例如 GitHub Pages、Netlify、Vercel、Nginx 静态目录或对象存储静态站点。

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- npm 9 或更高版本

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

1. 将 JSON 粘贴到左侧 Input 区，或拖入 `.json` 文件。
2. 点击「格式化」「压缩」「校验」「修复」等命令处理内容。
3. 在 Output 区查看格式化结果，或切换到「树」模式查看结构。
4. 在树节点上复制值、复制路径、提取节点，或直接添加、删除、重命名和编辑叶子节点。
5. 使用中间的传输按钮将 Input 发送到 Output、交换两侧内容，或把 Output 回填到 Input。
6. 根据场景开启「保留转义」「自动格式化」、Key 排序、自动换行和行号。

## 项目结构

```text
jsonf/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── IconButton.vue
│   │   ├── JsonEditor.vue
│   │   ├── JsonTreeNode.vue
│   │   └── SettingsPanel.vue
│   ├── composables/
│   │   ├── useJsonWorkbench.js
│   │   ├── usePreferences.js
│   │   └── useResizablePanels.js
│   ├── config/
│   │   ├── i18n.js
│   │   └── tools.js
│   ├── services/
│   │   ├── jsonService.js
│   │   └── treeService.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── storage.js
│   │   └── treeSearch.js
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

## 核心模块说明

### `src/composables/useJsonWorkbench.js`

JSONF 的主要状态中心，负责输入、输出、视图模式、校验状态、树节点选择、本地存储和用户命令。组件层的大多数按钮行为都会委托到这里执行。

### `src/services/jsonService.js`

集中处理 JSON 解析、格式化、压缩、修复、Key 排序、统计信息和错误位置归一化。这样组件只需要关心展示，不需要散落 JSON 处理细节。

### `src/services/treeService.js`

将普通 JSON 值转换成树视图可渲染的节点模型，并生成稳定的 JSONPath 风格路径，例如 `$.user.name`、`$.items[0]`、`$["odd-key"]`。

### `src/components/JsonEditor.vue`

轻量代码编辑器组件。它使用透明 `textarea` 作为真实输入层，并用背后的 `pre` 渲染语法高亮、搜索高亮、当前行和折叠状态。

### `src/components/JsonTreeNode.vue`

递归树节点组件，支持节点选择、上下文菜单、节点搜索高亮、内联修改 key 和修改叶子节点 value。

## 隐私与数据安全

- JSON 内容只在当前浏览器中解析和处理。
- 项目没有后端服务，也没有内置远程上传逻辑。
- 工作台内容和偏好设置会写入浏览器 `localStorage`，用于刷新后恢复状态。
- 如果处理敏感数据，建议在使用完成后点击「清空」，或清理浏览器站点数据。

## 技术栈

- [Vue 3](https://vuejs.org/)：界面和响应式状态管理。
- [Vite](https://vite.dev/)：开发服务器和构建工具。
- [jsonrepair](https://github.com/josdejong/jsonrepair)：JSON 修复能力。
- [Lucide Vue](https://lucide.dev/)：图标库。

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 本地预览生产构建 |

## 开发建议

- JSON 解析、格式化和转换逻辑优先放到 `src/services/`。
- 跨组件状态优先放到 `src/composables/`。
- 纯展示组件尽量保持无业务逻辑，只通过 props 和 emits 与外部交互。
- 新增界面文案时，请同步更新 `src/config/i18n.js` 中的三种语言。
- 新增工具入口时，优先扩展 `src/config/tools.js`，再实现对应视图。

## 常见问题

### JSONF 会上传我的 JSON 吗？

不会。当前实现全部在浏览器本地完成，没有服务端接口调用。

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
- 历史记录面板
- 导入导出用户偏好
- 更完整的键盘快捷键

## 贡献

欢迎提交 Issue 或 Pull Request。建议在提交前确认：

1. 变更范围清晰，避免混入无关格式化。
2. `npm run build` 可以通过。
3. 新增功能有对应的界面文案和必要说明。
4. 涉及 JSON 处理逻辑时，尽量覆盖有效、无效、空输入和大对象场景。

## License

当前仓库还没有声明许可证。如果要作为正式开源项目发布，建议补充 `LICENSE` 文件，例如 MIT、Apache-2.0 或其他适合项目目标的许可证。
