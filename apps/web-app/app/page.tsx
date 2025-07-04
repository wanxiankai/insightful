// apps/web-app/app/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import UploadForm from './components/UploadForm';
import { JobList } from './components/JobList';
import AuthButton from "./components/AuthButton";

export default async function Page() {
  try {
    const session = await auth();

    // 如果用户未登录，重定向到登录页面
    if (!session?.user) {
      redirect('/signin');
    }
    
    return (
      <main className="flex min-h-screen flex-col items-center p-8">
        <div className="w-full max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Insightful 控制台</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">欢迎, {session.user.name || session.user.email}</span>
              <AuthButton />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <UploadForm />
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">我的会议记录</h2>
                <JobList />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">用户信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">用户ID</p>
                <p className="font-medium">{session.user.id}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium">{session.user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error fetching session:", error);
    
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Insightful</h1>
          <p className="text-red-500 mb-4">加载会话失败，请稍后再试</p>
          <AuthButton />
        </div>
      </main>
    );
  }
}