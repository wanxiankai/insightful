# Insightful - AI-Powered Meeting Summarizer

![Insightful UI Screenshot](./docs/insightful_intro_screen_en.png) <!-- Replace with your actual application screenshot URL -->

[**English**](./README.md) | [**中文**](./README.zh-CN.md)

**Insightful** is a full-stack web application that leverages the power of Large Language Models to automatically transcribe and summarize your meeting recordings. Upload an audio/video file or **record directly in your browser**, and our asynchronous AI pipeline will generate a concise summary and actionable items for you.

This project is built with a modern, type-safe, and scalable tech stack, designed to showcase advanced full-stack development, Monorepo architecture, and seamless deployment practices.

## 🆕 Latest Updates

### 🎙️ Live Recording Module (NEW)
- **Browser-based recording** with real-time audio capture
- **Instant processing** - recordings automatically uploaded and analyzed
- **Smart error recovery** and cross-browser compatibility
- **Visual recording controls** with duration tracking and status indicators

### 📱 Enhanced User Experience (UPDATED)
- **Fixed upload zone** - stays accessible while scrolling through job history
- **Optimized scrolling performance** - independent job list scrolling with smooth animations
- **Responsive design improvements** - better mobile and tablet experience
- **Touch-optimized interactions** for mobile devices

---

## 🎯 Core Features

### 1. User Authentication
- Secure GitHub OAuth login using NextAuth.js (Auth.js v5)
- Session management and user state persistence

### 2. File Upload & Storage
- Drag-and-drop file upload interface with click-to-select fallback
- Secure file storage using Cloudflare R2 with presigned URLs
- Support for audio and video file formats

### 3. 🎙️ Live Recording (NEW)
- **Real-time audio recording** directly in the browser
- **Instant processing** - recordings are automatically uploaded and analyzed
- **Smart recording controls** with visual feedback and duration tracking
- **Browser compatibility detection** with fallback options
- **Error recovery system** for handling recording interruptions
- **Optimized audio quality** with automatic format selection

### 4. Asynchronous AI Processing
- Queue-based background processing using Upstash QStash
- Google Gemini 1.5 Pro model for audio analysis
- Automatic generation of meeting summaries and action items

### 5. Real-time Status Updates
- WebSocket connections via Supabase Realtime
- Live task status synchronization (Uploading, Queued, Processing, Completed, Failed)
- Optimistic UI updates for enhanced user experience

### 6. 📱 Enhanced User Interface (UPDATED)
- **Fixed upload zone** - remains accessible while scrolling through job history
- **Independent job list scrolling** with smooth performance optimization
- **Responsive design** - seamless experience across desktop, tablet, and mobile
- **Touch-optimized interactions** for mobile devices

### 7. Analysis Results Display
- Structured meeting summaries
- Actionable item lists with assignees and due dates
- Comprehensive task history tracking

## 📱 Main Pages

1. **Dashboard (`/`)** - Main interface with dual-mode upload zone (file upload + live recording) and optimized task list
2. **Sign In (`/signin`)** - GitHub OAuth authentication
3. **Job Details (`/job/[jobId]`)** - Detailed analysis results for specific meetings

## 🎙️ Recording Features

### Live Recording Capabilities
- **Browser-based recording** using MediaRecorder API
- **Real-time duration tracking** with visual progress indicators
- **Automatic quality optimization** based on device capabilities
- **Smart error handling** with recovery mechanisms
- **Cross-browser compatibility** with fallback detection

### Recording Interface
- **Intuitive controls** - Start/Stop recording with visual feedback
- **Duration limits** - Configurable maximum recording time (default: 30 minutes)
- **Status indicators** - Clear visual states (Idle, Recording, Processing, Complete)
- **Error recovery** - Automatic retry mechanisms for failed recordings
- **Mobile optimization** - Touch-friendly controls and responsive design

## 🎬 How It Works

### File Upload Flow
1. **Upload** - Drag & drop or select audio/video files
2. **Process** - Files are securely stored and queued for AI analysis
3. **Analyze** - Google Gemini processes the audio and generates insights
4. **Results** - View structured summaries and actionable items

### Live Recording Flow
1. **Record** - Click to start browser-based recording
2. **Monitor** - Real-time duration tracking with visual feedback
3. **Complete** - Stop recording and automatic upload begins
4. **Process** - Instant AI analysis of your recording
5. **Results** - Get immediate insights from your live session

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Insightful                           │
│                   AI Meeting Summarizer                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│  • Dashboard (File Upload + Task List)                      │
│  • Job Details (Analysis Results Display)                   │
│  • User Authentication (GitHub OAuth)                       │
│  • Real-time Updates (Supabase Realtime)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Routes Layer (Next.js API)             │
├─────────────────────────────────────────────────────────────┤
│  • /api/upload - File upload presigned URLs                 │
│  • /api/jobs - Task list management                         │
│  • /api/worker - AI processing worker                       │
│  • /api/auth - NextAuth.js authentication                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Prisma ORM)                  │
├─────────────────────────────────────────────────────────────┤
│  • User - User information                                  │
│  • MeetingJob - Meeting tasks                               │
│  • AnalysisResult - Analysis results                        │
│  • Account/Session - Authentication sessions                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
├─────────────────────────────────────────────────────────────┤
│  • PostgreSQL (Supabase) - Data storage                     │
│  • Cloudflare R2 - File storage                            │
│  • Upstash QStash - Async task queue                       │
│  • Google Gemini 1.5 Pro - AI analysis                     │
│  • Supabase Realtime - Real-time communication             │
│  • GitHub OAuth - User authentication                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Monorepo Structure                       │
├─────────────────────────────────────────────────────────────┤
│  apps/                                                      │
│  └── web-app/          # Main application                   │
│                                                             │
│  packages/                                                  │
│  ├── database/         # Prisma database configuration      │
│  ├── eslint-config/    # ESLint configuration              │
│  └── typescript-config/ # TypeScript configuration         │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Workflow

1. **File Upload** → Store file in R2, create MeetingJob record
2. **Task Queuing** → QStash asynchronously calls worker API
3. **AI Processing** → Gemini analyzes audio, generates summary and action items
4. **Result Storage** → Analysis results saved to database
5. **Real-time Updates** → Supabase Realtime pushes status changes to frontend

## 🚀 Tech Stack

**Frontend:**
- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React](https://reactjs.org/) + [React DOM](https://reactjs.org/docs/react-dom.html)
- [Lucide React](https://lucide.dev/) (Icons)
- [React Dropzone](https://react-dropzone.js.org/) (File Upload)
- **MediaRecorder API** (Live Recording)

**Backend:**
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [NextAuth.js v5](https://authjs.dev/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))

**External Services:**
- [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (File Storage)
- [Upstash QStash](https://upstash.com/qstash) (Task Queue)
- [Google Gemini 1.5 Pro](https://deepmind.google/technologies/gemini/) (AI Analysis)
- [Supabase](https://supabase.com/) (Database + Real-time)
- [GitHub OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps) (Authentication)

**Development Tools:**
- [Turborepo](https://turbo.build/repo) (Monorepo Management)
- [pnpm](https://pnpm.io/) (Package Manager)
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io) (Code Standards)
- [Vitest](https://vitest.dev/) (Testing Framework)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (Component Testing)

## 🌟 Project Highlights

This project demonstrates modern full-stack development practices including:

- **Type-Safe Development**: End-to-end TypeScript implementation
- **Monorepo Architecture**: Organized codebase with shared packages
- **Real-time Features**: WebSocket-based live updates
- **Serverless Architecture**: Cloud-native deployment ready
- **AI Integration**: Advanced audio processing with LLM
- **Security Best Practices**: OAuth authentication and secure file handling
- **🎙️ Browser Media APIs**: Advanced MediaRecorder API integration with error handling
- **📱 Responsive UX**: Fixed upload zone with optimized scrolling performance
- **🔄 State Management**: Complex recording lifecycle management with React hooks
- **🧪 Comprehensive Testing**: Unit and integration tests with Vitest

## 🏁 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [pnpm](https://pnpm.io/installation)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/insightful.git](https://github.com/your-username/insightful.git)
    cd insightful
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    - Create a `.env` file in the root of the project by copying the example file:
      ```bash
      cp .env.example .env
      ```
    - Fill in the required values in the `.env` file. You will need keys from:
      - Supabase (for `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
      - GitHub OAuth App (for `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`)
      - Cloudflare R2 (for `R2_...` variables)
      - Upstash (for `QSTASH_...` variables)
      - Google AI Studio (for `GOOGLE_API_KEY`)
      - A secret for NextAuth (`AUTH_SECRET`)

4.  **Set up the database:**
    - Push the Prisma schema to your Supabase database:
      ```bash
      pnpm prisma db push --schema=./packages/database/prisma/schema.prisma
      ```

5.  **Run the development server:**
    ```bash
    pnpm run dev
    ```

The application should now be running at `http://localhost:3000`.

## 🚢 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/).

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  Vercel will automatically detect that this is a Next.js project within a Turborepo. Set the **Root Directory** to `apps/web-app`.
4.  Add all the environment variables from your `.env` file to the Vercel project settings.
5.  Deploy! Vercel will handle the rest.

Remember to update your GitHub OAuth App's callback URL to your new Vercel production domain.

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements, please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 🎯 What This Project Demonstrates

Insightful serves as a comprehensive showcase of modern web development practices:

- **Full-Stack TypeScript**: Consistent type safety from database to UI
- **Advanced React Patterns**: Server components, client components, and optimistic updates
- **Modern Authentication**: Secure OAuth implementation with session management
- **Real-time Architecture**: WebSocket integration for live status updates
- **AI/ML Integration**: Practical implementation of LLM services
- **Cloud Infrastructure**: Serverless deployment with external service integration
- **Developer Experience**: Monorepo setup with shared tooling and configurations
- **🎙️ Media API Mastery**: Complex MediaRecorder API usage with cross-browser compatibility
- **📱 Advanced UX Patterns**: Fixed positioning, smooth scrolling, and responsive design
- **🔄 State Management**: Complex async workflows with React hooks and context
- **🧪 Testing Excellence**: Comprehensive test coverage including UI interaction testing

This project is ideal for developers looking to understand how to build production-ready applications with cutting-edge technologies and architectural patterns, especially those involving real-time media processing and advanced user interactions.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
