// apps/web-app/src/components/AuthButton.tsx

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@repo/ui/button"; // 从共享UI库导入按钮

export default function AuthButton() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <Button disabled>
                Loading...
            </Button>
        );
    }

    if (session) {
        return (
            <Button 
                onClick={() => signOut({ callbackUrl: '/signin' })} 
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
                退出登录
            </Button>
        );
    }

    return (
        <Button 
            onClick={() => signIn("github")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
        >
            使用 GitHub 登录
        </Button>
    );
}