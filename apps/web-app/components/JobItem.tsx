"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, Loader, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// 定义 MeetingJob 的类型，与 Prisma schema 对应
export type MeetingJob = {
  id: string;
  createdAt: string;
  fileName: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  fileKey?: string;
  fileUrl?: string;
};

const statusInfo = {
  PENDING: { icon: Clock, text: "排队中", color: "text-gray-500", bgColor: "bg-gray-100" },
  PROCESSING: { icon: Loader, text: "AI 分析中", color: "text-blue-500", bgColor: "bg-blue-100", animate: "animate-spin" },
  COMPLETED: { icon: CheckCircle, text: "已完成", color: "text-green-500", bgColor: "bg-green-100" },
  FAILED: { icon: XCircle, text: "失败", color: "text-red-500", bgColor: "bg-red-100" },
};

interface JobItemProps {
  job: MeetingJob;
  onDelete: (jobId: string) => void;
  isOptimistic?: boolean; // 新增属性
}

export default function JobItem({ job, onDelete, isOptimistic = false }: JobItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { icon: Icon, text, color, bgColor } = statusInfo[job.status];
  const animate = job.status === 'PROCESSING' ? "animate-spin" : "";

  // 判断任务是否可以删除（只有COMPLETED或FAILED状态的任务才可以删除）
  const canDelete = job.status === 'COMPLETED' || job.status === 'FAILED';

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // 调用删除 API
      const response = await fetch(`/api/job/${job.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // 通知父组件已删除
      onDelete(job.id);
      setIsDeleteDialogOpen(false);
    } catch {
      alert('删除任务失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`flex items-center justify-between rounded-lg bg-white p-4 shadow-sm relative ${isOptimistic ? 'opacity-75' : ''}`}>
      {/* 乐观更新状态的视觉指示 */}
      {isOptimistic && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      )}

      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{job.fileName || 'Untitled Meeting'}</span>
        <span className="text-sm text-gray-500">
          {new Date(job.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <div className={`flex items-center rounded-full text-sm font-medium ${bgColor} ${color} ${
          job.status === 'COMPLETED' 
            ? 'px-2 sm:px-3 py-1 space-x-0 sm:space-x-2' 
            : 'px-3 py-1 space-x-2'
        }`}>
          <Icon className={`h-4 w-4 ${animate}`} />
          <span className={job.status === 'COMPLETED' ? 'hidden sm:inline' : ''}>{text}</span>
        </div>

        {job.status === 'COMPLETED' && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/job/${job.id}`}>查看报告</Link>
          </Button>
        )}

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`${canDelete ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-gray-300 cursor-not-allowed'}`}
              disabled={!canDelete}
              title={!canDelete ? '只能删除已完成或失败的任务' : '删除任务'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除任务</DialogTitle>
              <DialogDescription>
                您确定要删除&ldquo;{job.fileName || 'Untitled Meeting'}&rdquo;任务吗？此操作将永久删除该任务及其相关数据，无法恢复。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? '删除中...' : '确认删除'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}