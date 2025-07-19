# Insightful - AI 会议纪要分析器

![Insightful UI Screenshot](./docs/insightful_intro_screen_zh.png) <!-- 建议替换为你自己应用的截图URL -->

[**English**](./README.md) | [**中文**](./README.zh-CN.md)

**Insightful** 是一个全栈 Web 应用，它利用大语言模型（LLM）的强大能力，自动转录和总结您的会议录音。您只需上传一个音频或视频文件，我们设计的异步 AI 处理管道就会为您生成一份简洁的摘要和可执行的行动项列表。

本项目采用现代化、类型安全且可扩展的技术栈构建，旨在全面展示高级全栈开发能力、Monorepo 项目架构以及无缝的自动化部署实践。

---

## 🎯 核心功能

### 1. 用户认证

- 使用 NextAuth.js (Auth.js v5) 实现安全的 GitHub OAuth 登录
- 会话管理和用户状态持久化

### 2. 文件上传与存储

- 支持拖拽和点击上传的用户友好界面
- 使用 Cloudflare R2 和预签名 URL 实现安全文件存储
- 支持音频和视频文件格式

### 3. 异步 AI 处理

- 基于 Upstash QStash 的队列化后台处理
- Google Gemini 1.5 Pro 模型进行音频分析
- 自动生成会议摘要和行动项

### 4. 实时状态更新

- 通过 Supabase Realtime 提供 WebSocket 连接
- 实时任务状态同步（上传中、排队中、处理中、已完成、失败）
- 乐观更新机制提升用户体验

### 5. 分析结果展示

- 结构化的会议摘要
- 包含负责人和截止日期的可执行行动项列表
- 全面的任务历史记录跟踪

## 📱 主要页面

1. **仪表盘 (`/`)** - 主界面，包含文件上传区域和任务列表
2. **登录页 (`/signin`)** - GitHub OAuth 认证
3. **任务详情 (`/job/[jobId]`)** - 显示特定会议的详细分析结果

## 🏗️ 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Insightful                           │
│                   AI 会议纪要分析器                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      前端层 (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  • 主页 (文件上传 + 任务列表)                                │
│  • 任务详情页 (分析结果展示)                                 │
│  • 用户认证 (GitHub OAuth)                                  │
│  • 实时状态更新 (Supabase Realtime)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API 路由层 (Next.js API)                 │
├─────────────────────────────────────────────────────────────┤
│  • /api/upload - 文件上传预签名URL                           │
│  • /api/jobs - 任务列表管理                                 │
│  • /api/worker - AI 处理工作器                              │
│  • /api/auth - NextAuth.js 认证                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层 (Prisma ORM)                    │
├─────────────────────────────────────────────────────────────┤
│  • User - 用户信息                                          │
│  • MeetingJob - 会议任务                                    │
│  • AnalysisResult - 分析结果                                │
│  • Account/Session - 认证会话                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      外部服务集成                            │
├─────────────────────────────────────────────────────────────┤
│  • PostgreSQL (Supabase) - 数据存储                         │
│  • Cloudflare R2 - 文件存储                                │
│  • Upstash QStash - 异步任务队列                            │
│  • Google Gemini 1.5 Pro - AI 分析                         │
│  • Supabase Realtime - 实时通信                             │
│  • GitHub OAuth - 用户认证                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Monorepo 结构                            │
├─────────────────────────────────────────────────────────────┤
│  apps/                                                      │
│  └── web-app/          # 主应用                             │
│                                                             │
│  packages/                                                  │
│  ├── database/         # Prisma 数据库配置                  │
│  ├── eslint-config/    # ESLint 配置                       │
│  └── typescript-config/ # TypeScript 配置                  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 工作流程

1. **文件上传** → 文件存储到 R2，创建 MeetingJob 记录
2. **任务入队** → QStash 异步调用 worker API
3. **AI 处理** → Gemini 分析音频，生成摘要和行动项
4. **结果存储** → 分析结果保存到数据库
5. **实时更新** → Supabase Realtime 推送状态变更到前端

## 🚀 技术栈

**前端:**

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React](https://reactjs.org/) + [React DOM](https://reactjs.org/docs/react-dom.html)
- [Lucide React](https://lucide.dev/) (图标)

**后端:**

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [NextAuth.js v5](https://authjs.dev/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/) (通过 [Supabase](https://supabase.com/))

**外部服务:**

- [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (文件存储)
- [Upstash QStash](https://upstash.com/qstash) (任务队列)
- [Google Gemini 1.5 Pro](https://deepmind.google/technologies/gemini/) (AI 分析)
- [Supabase](https://supabase.com/) (数据库 + 实时通信)
- [GitHub OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps) (用户认证)

**开发工具:**

- [Turborepo](https://turbo.build/repo) (Monorepo 管理)
- [pnpm](https://pnpm.io/) (包管理器)
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io) (代码规范)

## � 项目亮始点

本项目展示了现代全栈开发的最佳实践，包括：

- **类型安全开发**: 端到端 TypeScript 实现
- **Monorepo 架构**: 有组织的代码库和共享包
- **实时功能**: 基于 WebSocket 的实时更新
- **Serverless 架构**: 云原生部署就绪
- **AI 集成**: 使用 LLM 进行高级音频处理
- **安全最佳实践**: OAuth 认证和安全文件处理

## 🏁 快速开始

请按照以下说明在您的本地计算机上设置并运行此项目。

### 环境要求

- [Node.js](https://nodejs.org/en/) (v18 或更高版本)
- [pnpm](https://pnpm.io/installation)

### 安装步骤

1.  **克隆仓库:**

    ```bash
    git clone [https://github.com/your-username/insightful.git](https://github.com/your-username/insightful.git)
    cd insightful
    ```

2.  **安装依赖:**

    ```bash
    pnpm install
    ```

3.  **设置环境变量:**
    - 通过复制示例文件，在项目根目录创建一个 `.env` 文件：
      ```bash
      cp .env.example .env
      ```
    - 在 `.env` 文件中填入所有必需的值。您需要从以下服务获取密钥：
      - Supabase (用于 `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
      - GitHub OAuth App (用于 `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`)
      - Cloudflare R2 (用于 `R2_...` 相关变量)
      - Upstash (用于 `QSTASH_...` 相关变量)
      - Google AI Studio (用于 `GOOGLE_API_KEY`)
      - 一个用于 NextAuth 的密钥 (`AUTH_SECRET`)

4.  **设置数据库:**
    - 将 Prisma schema 推送到您的 Supabase 数据库：
      ```bash
      pnpm prisma db push --schema=./packages/database/prisma/schema.prisma
      ```

5.  **运行开发服务器:**
    ```bash
    pnpm run dev
    ```

现在，您的应用程序应该已经在 `http://localhost:3000` 上成功运行。

## 🚢 部署

本项目已针对在 [Vercel](https://vercel.com/) 上的部署进行了优化。

1.  将您的代码推送到一个 GitHub 仓库。
2.  将该项目导入到 Vercel。
3.  Vercel 会自动识别出这是一个 Turborepo 中的 Next.js 项目。请将 **Root Directory** (根目录) 设置为 `apps/web-app`。
4.  将您 `.env` 文件中的所有环境变量添加到 Vercel 项目的设置中。
5.  点击部署！Vercel 将处理剩下的一切。

请记得将您的 GitHub OAuth App 的回调 URL 更新为您新的 Vercel 生产域名。

## 🤝 贡献代码

欢迎任何形式的贡献！如果您有任何改进建议，请随时提交 Issue 或 Pull Request。

1.  Fork 本项目
2.  创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3.  提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4.  将分支推送到远程 (`git push origin feature/AmazingFeature`)
5.  创建一个 Pull Request

## 🎯 项目展示内容

Insightful 作为现代 Web 开发实践的综合展示：

- **全栈 TypeScript**: 从数据库到 UI 的一致类型安全
- **高级 React 模式**: 服务器组件、客户端组件和乐观更新
- **现代认证**: 安全的 OAuth 实现和会话管理
- **实时架构**: WebSocket 集成实现实时状态更新
- **AI/ML 集成**: LLM 服务的实际应用实现
- **云基础设施**: Serverless 部署和外部服务集成
- **开发者体验**: Monorepo 设置和共享工具配置

本项目非常适合希望了解如何使用前沿技术和架构模式构建生产就绪应用程序的开发者。

## 📄 许可证

本项目采用 MIT 许可证。详情请见 `LICENSE` 文件。
