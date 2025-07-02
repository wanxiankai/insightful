// apps/web-app/middleware.ts

import { auth } from "./auth"; // 导入 auth 函数

// 导出的默认函数就是中间件本身
export default auth;

// `matcher` 配置项用于指定哪些路径需要经过这个中间件
export const config = {
  // 匹配除了包含 api, _next/static, _next/image, favicon.ico 的所有请求路径
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};