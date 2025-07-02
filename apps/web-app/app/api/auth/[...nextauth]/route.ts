// apps/web-app/src/app/api/auth/[...nextauth]/route.ts

// 从我们的中央配置文件中导入 handlers
import { handlers } from '@/auth'
export const { GET, POST } = handlers;