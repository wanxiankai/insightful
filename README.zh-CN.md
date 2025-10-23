# Insightful - AI 会议纪要分析平台

![Insightful Platform](./resources/insightful_home_intro.png) <!-- 建议替换为你的平台概览截图 -->

[**English**](./README.md) | [**中文**](./README.zh-CN.md)

**Insightful** 是一个综合性的跨平台解决方案，利用大语言模型的强大能力自动转录和总结会议录音。作为现代化的 monorepo 项目构建，它在 Web 和移动平台上提供无缝体验，共享业务逻辑并保持一致的用户体验。

## 🌟 平台概览

Insightful 由多个协同工作的应用程序组成，提供统一的会议分析体验：

- **🌐 Web 应用程序** - 功能完整的 Web 界面，支持实时录制和文件上传
- **📱 移动应用程序** - 使用 React Native 构建的原生 iOS 和 Android 应用（即将推出）
- **🔧 共享包** - 通用数据库架构、配置和工具

## 🚀 当前状态

### ✅ 已完成
- **Web 应用程序** - 生产就绪，具有高级功能包括：
  - 使用 MediaRecorder API 的浏览器实时录制
  - 支持拖拽的文件上传界面
  - 使用 Google Gemini 1.5 Pro 的实时 AI 处理
  - 基于 WebSocket 的实时状态更新
  - 针对移动浏览器优化的响应式设计
  - GitHub OAuth 认证
  - 全面的测试套件

### 🔄 开发中
- **移动应用程序** - 计划使用 React Native 实现，包含：
  - 原生录制功能
  - 离线优先架构
  - 任务完成推送通知
  - 原生文件系统集成
  - 生物识别认证支持

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Insightful 平台                          │
│              AI 会议纪要分析器生态系统                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      客户端应用                              │
├─────────────────────────────────────────────────────────────┤
│  📱 移动应用 (React Native)    │  🌐 Web 应用 (Next.js)     │
│  • iOS 应用程序               │  • 浏览器界面               │
│  • Android 应用程序           │  • 实时录制                 │
│  • 原生录制                   │  • 文件上传                 │
│  • 离线支持                   │  • 实时更新                 │
│  • 推送通知                   │  • 响应式设计               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    共享后端服务                              │
├─────────────────────────────────────────────────────────────┤
│  • 身份认证 (NextAuth.js + OAuth)                           │
│  • 文件存储 (Cloudflare R2)                                │
│  • AI 处理 (Google Gemini 1.5 Pro)                         │
│  • 实时更新 (Supabase Realtime)                             │
│  • 任务队列 (Upstash QStash)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      共享包                                  │
├─────────────────────────────────────────────────────────────┤
│  📦 database/         # Prisma 架构和迁移                   │
│  📦 eslint-config/    # 共享代码规范                        │
│  📦 typescript-config/ # TypeScript 配置                   │
│  📦 ui-components/    # 共享 UI 组件 (计划中)               │
│  📦 api-client/       # API 客户端库 (计划中)               │
└─────────────────────────────────────────────────────────────┘
```

## 📱 应用程序

### 🌐 Web 应用程序 (`apps/web-app`)

功能完整的 Next.js 应用程序，提供全面的会议分析功能。

**核心功能：**
- 🎙️ **实时录制** - 浏览器录制与实时处理
- 📁 **文件上传** - 音频/视频文件的拖拽界面
- 🤖 **AI 分析** - 自动转录和摘要生成
- 🔄 **实时更新** - 基于 WebSocket 的状态同步
- 📱 **移动响应式** - 针对所有屏幕尺寸优化
- 🔐 **安全认证** - GitHub OAuth 集成

**技术栈：**
- Next.js 14 with App Router
- TypeScript & Tailwind CSS
- Prisma ORM with PostgreSQL
- Supabase 实时功能
- Google Gemini 1.5 Pro AI 处理

[📖 **详细 Web 应用文档**](./apps/web-app/README.zh-CN.md)

### 📱 移动应用程序 (`apps/mobile-app`) - 即将推出

使用 React Native 构建的原生移动应用程序，提供优化的移动体验。

**计划功能：**
- 📱 **原生录制** - 设备优化的高质量音频录制
- 🔄 **离线支持** - 在线时排队处理录制内容
- 🔔 **推送通知** - 任务完成的实时提醒
- 📂 **文件集成** - 原生文件系统访问和分享
- 🔒 **生物识别认证** - 指纹和 Face ID 支持
- 🎨 **原生 UI** - 平台特定的设计模式

**计划技术栈：**
- React Native with Expo
- TypeScript
- React Query 状态管理
- 录制原生模块
- 来自 Web 应用的共享 API 客户端

## 🛠️ 共享包

### 📦 `packages/database`
使用 Prisma ORM 的集中式数据库配置和架构。

**内容：**
- 数据库架构定义
- 迁移文件
- 种子数据脚本
- 类型安全的数据库客户端

### 📦 `packages/eslint-config`
所有应用程序一致代码质量的共享 ESLint 配置。

### 📦 `packages/typescript-config`
针对不同应用程序类型优化的通用 TypeScript 配置。

### 📦 `packages/ui-components` (计划中)
Web 和移动端一致 UI 的共享 React 组件库。

### 📦 `packages/api-client` (计划中)
与后端服务通信的类型安全 API 客户端库。

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) (v18 或更高版本)
- [pnpm](https://pnpm.io/installation)
- [Git](https://git-scm.com/)

### 快速启动

1. **克隆仓库：**
   ```bash
   git clone https://github.com/your-username/insightful.git
   cd insightful
   ```

2. **安装依赖：**
   ```bash
   pnpm install
   ```

3. **设置环境变量：**
   ```bash
   cp .env.example .env
   # 在 .env 文件中填入所需的值
   ```

4. **初始化数据库：**
   ```bash
   pnpm prisma db push --schema=./packages/database/prisma/schema.prisma
   ```

5. **启动开发服务器：**
   ```bash
   # 启动所有应用程序
   pnpm run dev
   
   # 或启动特定应用程序
   pnpm run dev --filter=web-app
   ```

### 开发命令

```bash
# 构建所有应用程序
pnpm run build

# 运行代码检查
pnpm run lint

# 格式化代码
pnpm run format

# 类型检查
pnpm run check-types
```

## 🚢 部署

### Web 应用程序
Web 应用程序已针对 [Vercel](https://vercel.com/) 部署进行优化。

1. 将 GitHub 仓库连接到 Vercel
2. 设置根目录为 `apps/web-app`
3. 配置环境变量
4. 推送到主分支时自动部署

### 移动应用程序（未来）
移动应用程序将通过以下方式分发：
- **iOS**: 通过 Expo Application Services (EAS) 发布到 App Store
- **Android**: 通过 EAS 发布到 Google Play Store
- **企业版**: 通过 Expo Updates 进行无线更新

## 🔮 发展路线图

### 第一阶段：Web 平台 (✅ 已完成)
- [x] 具有实时录制功能的核心 Web 应用程序
- [x] 文件上传和 AI 处理
- [x] 实时状态更新
- [x] 响应式移动 Web 界面
- [x] 生产环境部署

### 第二阶段：移动端开发 (🔄 进行中)
- [ ] React Native 项目设置
- [ ] 共享组件库
- [ ] 原生录制实现
- [ ] 离线优先架构
- [ ] 推送通知系统

### 第三阶段：增强功能 (📋 计划中)
- [ ] 多语言支持
- [ ] 高级 AI 功能（说话人识别、情感分析）
- [ ] 团队协作功能
- [ ] 日历应用集成
- [ ] 导出多种格式（PDF、Word 等）

### 第四阶段：企业功能 (🎯 未来)
- [ ] 单点登录 (SSO) 集成
- [ ] 高级分析和报告
- [ ] 自定义 AI 模型训练
- [ ] 白标解决方案
- [ ] 第三方集成 API

## 🤝 贡献代码

我们欢迎社区贡献！请查看我们的[贡献指南](./CONTRIBUTING.md)了解详情。

### 开发工作流程

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 进行更改
4. 为新功能添加测试
5. 确保所有测试通过 (`pnpm test`)
6. 提交更改 (`git commit -m 'Add amazing feature'`)
7. 推送到分支 (`git push origin feature/amazing-feature`)
8. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详情请见 [LICENSE](./LICENSE) 文件。

## 🙏 致谢

- [Next.js](https://nextjs.org/) 提供出色的 React 框架
- [React Native](https://reactnative.dev/) 提供跨平台移动开发
- [Turborepo](https://turbo.build/) 提供 monorepo 管理
- [Google Gemini](https://deepmind.google/technologies/gemini/) 提供 AI 能力
- [Supabase](https://supabase.com/) 提供实时数据库功能
- [Vercel](https://vercel.com/) 提供无缝部署

---

**由 Insightful 团队用 ❤️ 构建**