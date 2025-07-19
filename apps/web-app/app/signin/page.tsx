'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { FileText, Clock, Users, Zap, CheckCircle, ArrowRight } from 'lucide-react';

export default function SignIn() {
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      icon: <FileText className="w-8 h-8 text-[#61d0de]" />,
      title: "智能转录",
      description: "自动将音频转换为文字，准确率高达98%"
    },
    {
      icon: <Clock className="w-8 h-8 text-[#4fb3c1]" />,
      title: "节省时间",
      description: "将2小时会议压缩为5分钟精华总结"
    },
    {
      icon: <Users className="w-8 h-8 text-[#7dd8e3]" />,
      title: "行动跟踪",
      description: "自动提取任务分配和截止日期"
    },
    {
      icon: <Zap className="w-8 h-8 text-[#3da6b5]" />,
      title: "即时洞察",
      description: "AI分析会议重点，生成关键决策"
    }
  ];

  const stats = [
    { number: "10K+", label: "会议处理" },
    { number: "2小时", label: "平均节省时间" },
    { number: "98%", label: "准确率" }
  ];

  const handleSignIn = async () => {
    setLoginLoading(true);
    try {
      await signIn('github', { callbackUrl: '/' });
    } catch {
      setLoginLoading(false);
    }
  };

  // 自动轮播功能特点
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#61d0de]/5 relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#61d0de] rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#4fb3c1] rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-[#7dd8e3] rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* 左侧 - 产品展示区 */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative">
          {/* Logo区域 */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-[#61d0de] to-[#4fb3c1] rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Insightful</h1>
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
              AI 驱动的
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#61d0de] to-[#7dd8e3]">
                会议智能分析
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              告别繁琐的会议记录，让AI帮你提取关键信息，专注于重要决策
            </p>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-8 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-[#61d0de] mb-2">{stat.number}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 功能特点轮播 */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-6">核心功能</h3>
            <div className="grid grid-cols-1 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-500 ${
                    index === currentFeature
                      ? 'border-[#61d0de] bg-[#61d0de]/10 transform scale-105'
                      : 'border-slate-700 bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <div>
                      <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                      <p className="text-slate-300 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 装饰元素 */}
          <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10">
            <div className="w-full h-full bg-gradient-to-tl from-[#61d0de] to-[#7dd8e3] rounded-full"></div>
          </div>
        </div>

        {/* 右侧 - 登录区 */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* 移动端Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#61d0de] to-[#4fb3c1] rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-8 h-8 text-white" />

                </div>
                <h1 className="text-3xl font-bold">Insightful</h1>
              </div>
              <p className="text-slate-600">AI 驱动的会议智能分析</p>
            </div>

            {/* 登录卡片 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 relative overflow-hidden">
              {/* 卡片装饰元素 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#61d0de]/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">欢迎回来</h2>
                <p className="text-slate-600">开始你的智能会议分析之旅</p>
              </div>

              {/* 功能预览 - 移动端 */}
              <div className="lg:hidden mb-6">
                <div className="bg-gradient-to-r from-[#61d0de]/5 to-[#7dd8e3]/5 rounded-xl p-4 mb-4 border border-[#61d0de]/10">
                  <h3 className="font-semibold text-slate-800 mb-3">立即体验</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-[#61d0de] mr-2" />
                      <span>智能转录 & 摘要生成</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-[#61d0de] mr-2" />
                      <span>自动任务提取</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-[#61d0de] mr-2" />
                      <span>关键决策洞察</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 登录按钮 */}
              <div className="space-y-4">
                {loginLoading ? (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <LoadingSpinner />
                    <span className="text-slate-600">正在登录...</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleSignIn}
                    disabled={loginLoading}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#4fb3c1] to-[#61d0de] hover:from-[#3da6b5] hover:to-[#4fb3c1] text-white py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-[#61d0de]/25"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    使用 GitHub 登录
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* 底部信息 */}
              <div className="text-center mt-6">
                <p className="text-xs text-slate-500">
                  登录即表示你同意我们的
                  <a href="#" className="text-[#61d0de] hover:text-[#4fb3c1] hover:underline transition-colors">服务条款</a>
                  和
                  <a href="#" className="text-[#61d0de] hover:text-[#4fb3c1] hover:underline transition-colors">隐私政策</a>
                </p>
              </div>
            </div>

            {/* 额外信息 */}
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                还没有账户？登录后自动创建
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
