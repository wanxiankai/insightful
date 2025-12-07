// apps/web-app/proxy.ts
// Renamed from middleware.ts in Next.js 16

import { auth } from "./auth"; // 导入 auth 函数

// 导出的 proxy 函数（Next.js 16 中从 middleware 重命名为 proxy）
export const proxy = auth;

// `matcher` 配置项用于指定哪些路径需要经过这个 proxy
export const config = {
  // 匹配除了包含 api, _next/static, _next/image, favicon.ico 的所有请求路径
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

