// apps/web-app/src/components/AuthButton.tsx

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@repo/ui/button"; // 从共享UI库导入按钮

export default function AuthButton() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <p>Loading...</p>;
    }

    if (session) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <p>Signed in as {session.user?.email}</p>
                <Button onClick={() => signOut()}>Sign out</Button>
            </div>
        );
    }

    return <Button onClick={() => signIn("github")}>Sign in with GitHub</Button>;
}