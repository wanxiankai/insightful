// apps/web-app/src/app/page.tsx

import { auth } from '@/auth'
import AuthButton from "./components/AuthButton";

export default async function Page() {
  try {
    // 确保正确处理异步操作
    const session = await auth();

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-4">Insightful</h1>
        <p className="mb-8">Your AI Meeting Summarizer</p>

        {session?.user ? (
          <div className="text-center">
            <p>Welcome back, {session.user.name || session.user.email}!</p>
            <p className="text-sm text-gray-500">Your User ID: {session.user.id}</p>
          </div>
        ) : (
          <p>Please sign in to continue.</p>
        )}

        <div className="mt-4">
          <AuthButton />
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error fetching session:", error);

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-4">Insightful</h1>
        <p className="mb-8">Your AI Meeting Summarizer</p>

        <p className="text-red-500">Failed to load session. Please try again later.</p>

        <div className="mt-4">
          <AuthButton />
        </div>
      </main>
    );
  }
}