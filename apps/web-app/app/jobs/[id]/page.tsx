// apps/web-app/app/jobs/[id]/page.tsx

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@repo/database';
import Link from 'next/link';
import { ActionItem, KeyDecision, MeetingJob as JobType } from '@/app/types';

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/signin');
  }

  const job = await prisma.meetingJob.findUnique({
    where: {
      id: params.id,
    },
    include: {
      analysisResult: true,
    },
  });

  if (!job || job.userId !== session.user.id) {
    notFound();
  }

  // Format dates for display
  const createdAt = new Date(job.createdAt).toLocaleString();
  const updatedAt = new Date(job.updatedAt).toLocaleString();

  return (
    <div className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/"
            className="text-blue-500 hover:text-blue-700"
          >
            &larr; 返回控制台
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">会议详情</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="font-semibold text-lg mb-2">基本信息</h2>
              <div className="space-y-2">
                <p><span className="font-medium">ID:</span> {job.id}</p>
                <p><span className="font-medium">文件名:</span> {job.fileName || 'N/A'}</p>
                <p><span className="font-medium">状态:</span> 
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ml-2 ${
                    job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                    job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    job.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status === 'COMPLETED' ? '已完成' : 
                     job.status === 'FAILED' ? '失败' :
                     job.status === 'PROCESSING' ? '处理中' : '等待处理'}
                  </span>
                </p>
                <p><span className="font-medium">创建时间:</span> {createdAt}</p>
                <p><span className="font-medium">最后更新:</span> {updatedAt}</p>
              </div>
            </div>
            
            <div>
              <h2 className="font-semibold text-lg mb-2">操作</h2>
              <div className="space-y-4">
                {job.fileUrl && (
                  <Link 
                    href={job.fileUrl}
                    target="_blank"
                    className="block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center"
                  >
                    下载原始文件
                  </Link>
                )}
                
                {job.status === 'PENDING' && (
                  <button 
                    className="block w-full bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                      // Here you could implement a refresh function
                      // or an API call to manually start processing
                    }}
                  >
                    开始处理
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {job.analysisResult ? (
            <div>
              <h2 className="font-semibold text-xl mb-4">分析结果</h2>
              
              {job.analysisResult.summary && (
                <div className="mb-6">
                  <h3 className="font-medium text-lg mb-2">摘要</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p>{job.analysisResult.summary}</p>
                  </div>
                </div>
              )}
              
              {job.analysisResult.actionItems && (
                <div className="mb-6">
                  <h3 className="font-medium text-lg mb-2">行动项</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <ul className="list-disc pl-5">
                      {(JSON.parse(JSON.stringify(job.analysisResult.actionItems)) as ActionItem[]).map((item, index) => (
                        <li key={index}>{item.text}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {job.analysisResult.keyDecisions && (
                <div className="mb-6">
                  <h3 className="font-medium text-lg mb-2">关键决策</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <ul className="list-disc pl-5">
                      {(JSON.parse(JSON.stringify(job.analysisResult.keyDecisions)) as KeyDecision[]).map((decision, index) => (
                        <li key={index}>{decision.text}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {job.analysisResult.transcript && (
                <div>
                  <h3 className="font-medium text-lg mb-2">完整记录</h3>
                  <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                    <p className="whitespace-pre-line">{job.analysisResult.transcript}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p className="text-gray-500">
                {job.status === 'PENDING' ? '等待处理开始...' : 
                 job.status === 'PROCESSING' ? '正在处理您的文件...' :
                 job.status === 'FAILED' ? '处理失败，请重试。' :
                 '暂无分析结果。'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
