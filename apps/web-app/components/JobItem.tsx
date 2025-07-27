"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, Loader, Trash2, XCircle, MoreHorizontal, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

// 定义 MeetingJob 的类型，与 Prisma schema 对应
export type MeetingJob = {
  id: string;
  createdAt: string;
  fileName: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  fileKey?: string;
  fileUrl?: string;
};

// 将状态信息移到组件内部，以便使用翻译

interface JobItemProps {
  job: MeetingJob;
  onDelete: (jobId: string) => void;
  onRename?: (jobId: string, newName: string) => void; // 新增重命名回调
  isOptimistic?: boolean;
}

export default function JobItem({ job, onDelete, onRename, isOptimistic = false }: JobItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState(job.fileName || '');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string>('');
  const { t, locale } = useLanguage();

  const statusInfo = {
    PENDING: { icon: Clock, text: t.status.pending, color: "text-gray-500", bgColor: "bg-gray-100" },
    PROCESSING: { icon: Loader, text: t.status.processing, color: "text-[#61d0de]", bgColor: "bg-[#61d0de]/10", animate: "animate-spin" },
    COMPLETED: { icon: CheckCircle, text: t.status.completed, color: "text-[#4fb3c1]", bgColor: "bg-[#4fb3c1]/10" },
    FAILED: { icon: XCircle, text: t.status.failed, color: "text-red-500", bgColor: "bg-red-100" },
  };

  const { icon: Icon, text, color, bgColor } = statusInfo[job.status];
  const animate = job.status === 'PROCESSING' ? "animate-spin" : "";

  // 判断任务是否可以操作（只有COMPLETED或FAILED状态的任务才可以操作）
  const canOperate = job.status === 'COMPLETED' || job.status === 'FAILED';
  
  // 判断任务是否可以重命名（只有COMPLETED状态的任务才可以重命名）
  const canRename = job.status === 'COMPLETED';

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
      alert(t.errors.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async () => {
    const trimmedFileName = newFileName.trim();
    
    // 验证输入
    if (!trimmedFileName) {
      setRenameError(locale === 'zh' ? '文件名不能为空' : 'File name cannot be empty');
      return;
    }
    
    if (trimmedFileName === job.fileName) {
      setIsRenameDialogOpen(false);
      return;
    }

    if (trimmedFileName.length > 100) {
      setRenameError(locale === 'zh' ? '文件名不能超过100个字符' : 'File name cannot exceed 100 characters');
      return;
    }

    try {
      setIsRenaming(true);
      setRenameError('');

      // 调用重命名 API
      const response = await fetch(`/api/job/${job.id}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: trimmedFileName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rename job');
      }

      // 通知父组件更新
      if (onRename) {
        onRename(job.id, trimmedFileName);
      }

      // 显示成功提示
      toast.success(
        locale === 'zh' ? '重命名成功' : 'Renamed successfully',
        {
          description: locale === 'zh' ? `任务已重命名为 "${trimmedFileName}"` : `Task renamed to "${trimmedFileName}"`,
        }
      );

      setIsRenameDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setRenameError(
        locale === 'zh' 
          ? `重命名失败: ${errorMessage}` 
          : `Rename failed: ${errorMessage}`
      );
      
      // 也显示toast错误提示
      toast.error(
        locale === 'zh' ? '重命名失败' : 'Rename failed',
        {
          description: errorMessage,
        }
      );
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRenameDialogOpen = () => {
    setNewFileName(job.fileName || '');
    setRenameError('');
    setIsRenameDialogOpen(true);
  };

  return (
    <div className={`flex items-center justify-between rounded-lg bg-white p-3 sm:p-4 shadow-sm relative ${isOptimistic ? 'opacity-75' : ''}`}>
      {/* 乐观更新状态的视觉指示 */}
      {isOptimistic && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-[#61d0de] rounded-full animate-pulse"></div>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0 mr-2 sm:mr-3">
        <span className="font-medium text-gray-900 truncate text-sm sm:text-base">{job.fileName || 'Untitled Meeting'}</span>
        <span className="text-xs sm:text-sm text-gray-500">
          {new Date(job.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
        <div className={`flex items-center rounded-full text-xs sm:text-sm font-medium ${bgColor} ${color} ${job.status === 'COMPLETED'
          ? 'px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 space-x-0 sm:space-x-1 md:space-x-2'
          : 'px-2 sm:px-3 py-0.5 sm:py-1 space-x-1 sm:space-x-2'
          }`}>
          <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${animate}`} />
          <span className={job.status === 'COMPLETED' ? 'hidden sm:inline' : 'hidden xs:inline sm:inline'}>{text}</span>
        </div>

        {job.status === 'COMPLETED' && (
          <Button asChild variant="outline" size="sm" className="border-[#61d0de] text-[#61d0de] hover:bg-[#61d0de]/5 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">
            <Link href={`/job/${job.id}`}>
              <span className="hidden sm:inline">{t.common.viewReport}</span>
              <span className="sm:hidden">View</span>
            </Link>
          </Button>
        )}

        {/* 操作菜单 */}
        {canOperate ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                title={t.common.moreActions}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 border-none outline-none" align="end">
              {canRename && (
                <DropdownMenuItem
                  onClick={handleRenameDialogOpen}
                  className="cursor-pointer p-2"
                >
                  <div className="w-full flex items-center justify-start gap-2">
                    <Edit className="h-4 w-4" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {t.common.rename}
                    </span>
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="cursor-pointer p-2"
              >
                <div className="w-full flex items-center justify-start gap-2">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600 truncate">
                    {t.common.delete}
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md text-gray-300 cursor-not-allowed min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] transition-colors disabled:pointer-events-none disabled:opacity-50"
            disabled={true}
            title={t.deleteConfirm.onlyCompletedCanDelete}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}


        {/* 删除确认对话框 */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md max-w-[90vw] mx-4">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-semibold">{t.deleteConfirm.title}</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                {t.deleteConfirm.description}<span className="font-medium text-gray-900">&ldquo;{job.fileName || 'Untitled Meeting'}&rdquo;</span>？
                <br />
                <span className="text-xs text-gray-500 mt-1 block">{t.deleteConfirm.warning}</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {t.common.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isDeleting ? t.deleteConfirm.deleting : t.deleteConfirm.confirmDelete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 重命名对话框 */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className="sm:max-w-md max-w-[90vw] mx-4">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-semibold">{t.common.rename}</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                {locale === 'zh'
                  ? `为任务 "${job.fileName || 'Untitled Meeting'}" 输入新名称`
                  : `Enter a new name for task "${job.fileName || 'Untitled Meeting'}"`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => {
                  setNewFileName(e.target.value);
                  if (renameError) setRenameError(''); // Clear error when user types
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#61d0de] focus:border-[#61d0de] ${
                  renameError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={locale === 'zh' ? '输入新的任务名称' : 'Enter new task name'}
                maxLength={100}
                disabled={isRenaming}
              />
              {renameError && (
                <p className="mt-2 text-sm text-red-600">{renameError}</p>
              )}
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsRenameDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {t.common.cancel}
              </Button>
              <Button
                onClick={handleRename}
                disabled={isRenaming || !newFileName.trim() || newFileName.trim() === job.fileName}
                className="w-full sm:w-auto order-1 sm:order-2 bg-[#61d0de] hover:bg-[#4fb3c1]"
              >
                {isRenaming ? (locale === 'zh' ? '重命名中...' : 'Renaming...') : t.common.confirm}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}