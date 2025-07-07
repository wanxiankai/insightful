// apps/web-app/components/AuthProvider.tsx

"use client"; // 声明这是一个客户端组件

import { SessionProvider } from "next-auth/react";
import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}