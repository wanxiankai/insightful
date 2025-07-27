# Insightful - AI 会议纪要分析器

![Insightful UI Screenshot](./docs/insightful_intro_screen_zh.png) <!-- 建议替换为你自己应用的截图URL -->

[**English**](./README.md) | [**中文**](./README.zh-CN.md)

**Insightful** 是一个全栈 Web 应用，它利用大语言模型（LLM）的强大能力，自动转录和总结您的会议录音。您可以上传音频/视频文件或**直接在浏览器中录制**，我们设计的异步 AI 处理管道就会为您生成一份简洁的摘要和可执行的行动项列表。

本项目采用现代化、类型安全且可扩展的技术栈构建，旨在全面展示高级全栈开发能力、Monorepo 项目架构以及无缝的自动化部署实践。

## 🆕 最新更新

### 🎙️ 立即录制模块（全新功能）

- **浏览器内录音** - 实时音频捕获功能
- **即时处理** - 录音自动上传并进行AI分析
- **智能错误恢复** - 跨浏览器兼容性和错误处理
- **可视化录制控制** - 带有时长跟踪和状态指示器的录制界面

### 📱 增强用户体验（功能优化）

- **固定上传区域** - 在浏览任务历史时保持上传功能可访问
- **优化滚动性能** - 独立的任务列表滚动与流畅动画
- **响应式设计改进** - 更好的移动端和平板体验
- **触控优化交互** - 针对移动设备的触控友好设计

---

## 🎯 核心功能

### 1. 用户认证

- 使用 NextAuth.js (Auth.js v5) 实现安全的 GitHub OAuth 登录
- 会话管理和用户状态持久化

### 2. 文件上传与存储

- 支持拖拽和点击上传的用户友好界面
- 使用 Cloudflare R2 和预签名 URL 实现安全文件存储
- 支持音频和视频文件格式

### 3. 🎙️ 立即录制功能（全新）

- **浏览器内实时录音** - 直接在浏览器中进行音频录制
- **即时处理** - 录音自动上传并进行AI分析
- **智能录制控制** - 带有视觉反馈和时长跟踪的录制界面
- **浏览器兼容性检测** - 自动检测并提供备选方案
- **错误恢复系统** - 处理录制中断的智能恢复机制
- **音质优化** - 根据设备能力自动选择最佳音频格式

### 4. 异步 AI 处理

- 基于 Upstash QStash 的队列化后台处理
- Google Gemini 1.5 Pro 模型进行音频分析
- 自动生成会议摘要和行动项

### 5. 实时状态更新

- 通过 Supabase Realtime 提供 WebSocket 连接
- 实时任务状态同步（上传中、排队中、处理中、已完成、失败）
- 乐观更新机制提升用户体验

### 6. 📱 增强用户界面（已优化）

- **固定上传区域** - 在浏览任务历史时保持上传功能可访问
- **独立任务列表滚动** - 流畅的性能优化和滚动体验
- **响应式设计** - 在桌面、平板和移动设备上的无缝体验
- **触控优化交互** - 针对移动设备的触控友好设计

### 7. 分析结果展示

- 结构化的会议摘要
- 包含负责人和截止日期的可执行行动项列表
- 全面的任务历史记录跟踪

## 📱 主要页面

1. **仪表盘 (`/`)** - 主界面，包含双模式上传区域（文件上传 + 立即录制）和优化的任务列表
2. **登录页 (`/signin`)** - GitHub OAuth 认证
3. **任务详情 (`/job/[jobId]`)** - 显示特定会议的详细分析结果

## 🎙️ 录制功能特性

### 立即录制能力

- **浏览器录音** - 使用 MediaRecorder API 进行浏览器内录制
- **实时时长跟踪** - 带有可视化进度指示器的时长显示
- **自动质量优化** - 根据设备能力自动调整录音质量
- **智能错误处理** - 带有恢复机制的错误处理系统
- **跨浏览器兼容** - 自动检测浏览器能力并提供备选方案

### 录制界面

- **直观控制** - 带有视觉反馈的开始/停止录制按钮
- **时长限制** - 可配置的最大录制时间（默认：30分钟）
- **状态指示器** - 清晰的视觉状态显示（空闲、录制中、处理中、完成）
- **错误恢复** - 录制失败时的自动重试机制
- **移动端优化** - 触控友好的控制界面和响应式设计

## 🎬 工作原理

### 文件上传流程

1. **上传** - 拖拽或选择音频/视频文件
2. **处理** - 文件安全存储并排队等待AI分析
3. **分析** - Google Gemini 处理音频并生成洞察
4. **结果** - 查看结构化摘要和可执行行动项

### 立即录制流程

1. **录制** - 点击开始浏览器内录音
2. **监控** - 实时时长跟踪和视觉反馈
3. **完成** - 停止录制并自动开始上传
4. **处理** - 对录音进行即时AI分析
5. **结果** - 立即获得录制会话的洞察

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
- [React Dropzone](https://react-dropzone.js.org/) (文件上传)
- **MediaRecorder API** (立即录制)

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
- [Vitest](https://vitest.dev/) (测试框架)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (组件测试)

## 🌟 项目亮点

本项目展示了现代全栈开发的最佳实践，包括：

- **类型安全开发**: 端到端 TypeScript 实现
- **Monorepo 架构**: 有组织的代码库和共享包
- **实时功能**: 基于 WebSocket 的实时更新
- **Serverless 架构**: 云原生部署就绪
- **AI 集成**: 使用 LLM 进行高级音频处理
- **安全最佳实践**: OAuth 认证和安全文件处理
- **🎙️ 浏览器媒体API**: 高级 MediaRecorder API 集成与错误处理
- **📱 响应式用户体验**: 固定上传区域与优化的滚动性能
- **🔄 状态管理**: 使用 React Hooks 进行复杂录制生命周期管理
- **🧪 全面测试**: 使用 Vitest 进行单元和集成测试

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
- **🎙️ 媒体API精通**: 复杂的 MediaRecorder API 使用与跨浏览器兼容性
- **📱 高级UX模式**: 固定定位、流畅滚动和响应式设计
- **🔄 状态管理**: 使用 React Hooks 和 Context 进行复杂异步工作流
- **🧪 测试卓越**: 包括UI交互测试在内的全面测试覆盖

本项目非常适合希望了解如何使用前沿技术和架构模式构建生产就绪应用程序的开发者，特别是涉及实时媒体处理和高级用户交互的应用。

## 📄 许可证

本项目采用 MIT 许可证。详情请见 `LICENSE` 文件。
