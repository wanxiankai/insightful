// apps/web-app/auth.ts

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const nextAuthInstance = NextAuth(authConfig);

// 使用类型断言来解决类型问题
export const handlers = nextAuthInstance.handlers as any;
export const auth = nextAuthInstance.auth as any;
export const signIn = nextAuthInstance.signIn as any;
export const signOut = nextAuthInstance.signOut;