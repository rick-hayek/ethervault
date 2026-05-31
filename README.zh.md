# EtherVault

EtherVault 是一款现代化的跨平台密码管理器，专为工业级安全和无缝用户体验而设计。它支持 Web、桌面端 (Electron) 以及移动端 (Android/iOS) 平台，帮助您安全地存储、管理和同步敏感凭证。

[English](./README.md) | 中文

![preview](./screenshots/EtherVault-Showcase-1024x500.png)

## 📖 项目概述

EtherVault 采用 Monorepo（单仓）架构构建，将核心业务逻辑与 UI 层分离，以确保跨平台的高度代码复用性与一致性。该项目内置了强大的本地加密（AES-256），支持与主流云存储服务（如 Google Drive）进行端到端加密同步，并集成了生物识别解锁、密码健康度分析等高级功能。它致力于为用户打造最安全的数字保险库。

## 🚀 功能特性

### 🔐 核心保险库
- **凭证管理**：安全地存储用户名、密码、URL 链接和备注。
- **高效检索**：支持模糊搜索、分类过滤（全部、个人、工作、其他）以及多维度标签管理。
- **智能图标**：自动获取并显示网站图标，提供更好的视觉体验。

### 🛡️ 安全仪表盘
- **安全评分**：基于密码复杂度算法，实时评估保险库健康状况。
- **风险检测**：自动扫描弱密码或重复使用的密码，并提供优化建议。
- **数据可视化**：通过直观的图表对密码安全分布进行可视化展示。

### 🎲 密码生成器
- **高熵值**：生成强壮且不可破解的密码。
- **高度可定制**：支持自定义长度（最高 128 位）和字符集（大写字母、小写字母、数字、符号）。
- **一键复制**：自动计算熵值，生成后支持一键复制。

### ⚙️ 设置与生态
- **云端同步**：支持与 Google Drive 等云存储服务商进行加密数据同步，确保多设备间的数据一致性。
- **外观设置**：支持深色模式、浅色模式和系统默认。
- **国际化**：内置多语言支持（英文/中文）。
- **数据流动性**：支持标准的 CSV/JSON 导入导出，方便进行数据迁移。
- **安全防护**：支持生物识别解锁（FaceID/TouchID）、自动锁定及本地操作日志审计。

## 🛠️ 技术栈

本项目构建于现代化的前端技术栈之上：

- **核心语言**：[TypeScript](https://www.typescriptlang.org/)
- **UI 框架**：[React 19](https://react.dev/)
- **构建工具**：[Vite](https://vitejs.dev/)
- **样式处理**：[Tailwind CSS](https://tailwindcss.com/)
- **跨平台运行环境**：
  - **桌面端**：[Electron](https://www.electronjs.org/)
  - **移动端**：[Capacitor 8](https://capacitorjs.com/)
- **动画库**：[Framer Motion](https://www.framer.com/motion/)
- **图表库**：[Recharts](https://recharts.org/)
- **状态管理**：自定义 Hooks & Context API
- **包管理器**：NPM Workspaces

## 💻 开发指南

### 前置准备
- Node.js (推荐 v18 或更高版本)
- NPM

### 1. Google Console 配置 (用于云同步)
在运行应用程序之前，您需要在 Google Cloud Console 中设置一个项目以启用 Google Drive 同步：

1.  访问 [Google Cloud Console](https://console.cloud.google.com/)。
2.  创建一个新项目 (例如 `ethervault-dev`)。
3.  **启用 API**：
    *   前往 **APIs & Services > Library**。
    *   搜索 **Google Drive API** 并启用它。
4.  **配置 OAuth 同意屏幕**：
    *   前往 **APIs & Services > OAuth consent screen**。
    *   选择 **External** (除非您是 G-Suite 用户)。
    *   填写所需的应用程序信息。
    *   添加您的电子邮件作为 **测试用户**。
5.  **创建凭证 (Web 客户端)**：
    *   前往 **APIs & Services > Credentials**。
    *   点击 **Create Credentials > OAuth Client ID**。
    *   应用程序类型选择：**Web application**。
    *   添加授权的 JavaScript 来源：`http://localhost:3000`（如果需要，也可添加 `http://localhost:5173`）。
    *   添加授权的重定向 URI：`http://localhost:3000`（如果需要，也可添加 `http://localhost:5173`）。
    *   复制 **Client ID**。
6.  **创建凭证 (iOS 客户端)**：
    *   前往 **APIs & Services > Credentials**。
    *   点击 **Create Credentials > OAuth Client ID**。
    *   应用程序类型选择：**iOS**。
    *   添加 Bundle ID：`com.ethervault.app`。
    *   复制 **Client ID**。
7.  **配置环境变量**：
    *   在 `packages/app/.env` 中创建一个 `.env` file 文件（如果存在 `.env.example`，可以从中复制）。
    *   添加您的凭证信息：
        ```bash
        # 用于本地开发
        VITE_GOOGLE_CLIENT_ID=your_client_id_here
        # 用于 iOS, Android 和桌面端的原生应用
        VITE_GOOGLE_CLIENT_ID_IOS=your_client_id_here
        ```

### 2. 安装依赖
在项目根目录下运行：
```bash
npm install
```

### 3. 启动开发环境

**Web 模式 (浏览器):**
```bash
npm run dev
```

**桌面端模式 (Electron):**
```bash
npm run dev:desktop
```

**移动端同步 (Capacitor):**
```bash
npm run mobile:sync
```

### 4. 构建与打包

**构建 Web 资源：**
```bash
npm run build
```

**构建桌面端应用：**
```bash
npm run dist:desktop
```

**构建 iOS/Android：**
```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

### 5. 其他命令

**清理项目：**
```bash
npm run clean
```

**类型检查：**
```bash
npm run type-check
```

## 📄 开源协议

本项目采用 [MIT 许可证](LICENSE) 开源。除非另有说明，您可以自由地使用、修改和分发此项目的代码。

## 🤝 参与贡献

欢迎大家贡献代码！如果您有任何建议或发现了 Bug，请按照以下步骤操作：

1. Fork 本仓库。
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)。
3. 提交您的修改 (`git commit -m 'Add some AmazingFeature'`)。
4. 将修改推送到该分支 (`git push origin feature/AmazingFeature`)。
5. 提交 Pull Request。

---
**EtherVault** — 本地安全，全球同步。
