# Pixcall HTML Preview

> Pixcall 素材管理工具的 HTML 文件预览插件

Pixcall 插件，允许用户在 Pixcall 内直接预览 `.html` / `.htm` 文件，支持实时渲染、源码查看和脚本开关。

## ✨ 功能特性

- 📄 **实时预览** — 在 Pixcall 内直接渲染 HTML 文件，无需切换到外部浏览器
- 📝 **源码查看** — 一键切换到源码视图，对照查看
- 🛡️ **脚本控制** — 可开关 JavaScript 执行，确保安全预览
- 🔄 **快速刷新** — 一键重载当前页面
- 🌏 **多语言** — 支持简体中文、繁体中文和英文

## 📦 安装方式

### 方式一：手动安装

1. 从 [Releases 页面](https://github.com/gislat-zack/Pixcall-html-preview/releases) 下载最新版本的 `Pixcall-html-preview-vX.X.X.zip`
2. 解压到 Pixcall 的插件目录（通常为 `~/.pixcall/plugins/` 或 Pixcall 安装目录下的 `plugins/` 文件夹）
3. 重启 Pixcall，或在插件面板中手动加载
4. 打开任意 `.html` 文件即可触发预览

### 方式二：开发者模式

适合本地开发调试：

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 在 Pixcall 插件面板中选择"加载开发插件"，指向当前目录
```

## 🛠️ 构建发布

```bash
# 构建生产版本到 dist/ 目录
npm run build
```

构建完成后，`dist/` 目录即为可发布的插件包，包含：

```
dist/
├── index.html          # 插件入口页面
├── manifest.json       # 插件清单文件
├── manifest.dev.json   # 开发模式清单
├── icons/
│   └── icon.png
├── l10n/
│   ├── en.json
│   ├── zh-CN.json
│   └── zh-TW.json
└── assets/
    ├── index-*.js
    └── index-*.css
```

## 🗂️ 版本下载

所有正式版本均发布在 GitHub Releases，支持按版本下载：

| 版本 | 最低 Pixcall 版本 | 下载 |
|------|------------------|------|
| v0.1.0 | ≥ 0.9.7 | [下载](https://github.com/gislat-zack/Pixcall-html-preview/releases) |

> 访问 [Releases 页面](https://github.com/gislat-zack/Pixcall-html-preview/releases) 查看全部历史版本。

## 🧩 项目结构

```
Pixcall-html-preview/
├── dist/               # 构建产物（不提交）
├── icons/              # 插件图标
├── l10n/               # 多语言资源
├── src/                # 源代码
│   ├── hooks/          # React Hooks
│   ├── lib/            # 工具函数
│   ├── styles/         # 样式
│   ├── App.tsx         # 主组件
│   └── main.tsx        # 入口
├── manifest.json       # 插件清单
├── package.json
└── vite.config.mjs
```

## 💻 技术栈

- **框架**：React 19 + TypeScript
- **构建**：Vite 8
- **宿主 API**：Pixcall Plugin SDK (`pixcall`)
- **最低 Pixcall 版本**：0.9.7

## 📄 许可证

[MIT License](./LICENSE)
