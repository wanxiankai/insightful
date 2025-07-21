# 任务操作菜单重构文档

## 功能概述

将原有的单一删除按钮重构为操作菜单（"..."按钮），为用户提供更多的任务管理选项，包括重命名和删除功能。

## 重构内容

### 🔄 UI变更

#### 原有设计
- **单一删除按钮**: 垃圾桶图标按钮
- **直接操作**: 点击即弹出删除确认对话框
- **功能限制**: 只能删除任务

#### 新设计
- **操作菜单**: 三个点（"..."）按钮
- **下拉菜单**: 点击显示操作选项列表
- **多功能**: 支持重命名和删除操作

### 🎯 功能特性

#### 1. 操作菜单按钮
- **图标**: 使用 `MoreHorizontal` 图标（三个点）
- **位置**: 保持在原删除按钮的位置
- **状态**: 只有已完成或失败的任务才可操作
- **提示**: 悬停显示"更多操作"提示

#### 2. 下拉菜单选项
- **重命名**: 编辑图标 + "重命名"文字
- **删除**: 垃圾桶图标 + "删除"文字（红色）
- **对齐**: 右对齐，宽度固定为160px

#### 3. 重命名功能
- **对话框**: 模态对话框形式
- **输入框**: 预填充当前任务名称
- **验证**: 不能为空，不能与原名称相同
- **限制**: 最大长度100字符
- **按钮**: 取消 + 确认（主色调）

#### 4. 删除功能
- **保持原有逻辑**: 删除确认对话框不变
- **触发方式**: 通过菜单选项触发
- **交互流程**: 菜单 → 删除选项 → 确认对话框

### 🎨 视觉设计

#### 操作按钮样式
```css
/* 默认状态 */
color: text-gray-500
hover: text-gray-700, bg-gray-100

/* 禁用状态 */
color: text-gray-300
cursor: not-allowed
```

#### 菜单项样式
```css
/* 重命名选项 */
color: default
hover: bg-gray-100

/* 删除选项 */
color: text-red-600
hover: bg-red-50, text-red-600
```

#### 重命名对话框
```css
/* 输入框 */
border: border-gray-300
focus: ring-[#61d0de], border-[#61d0de]

/* 确认按钮 */
background: bg-[#61d0de]
hover: bg-[#4fb3c1]
```

### 🔧 技术实现

#### 1. 组件结构
```typescript
interface JobItemProps {
  job: MeetingJob;
  onDelete: (jobId: string) => void;
  onRename?: (jobId: string, newName: string) => void; // 新增
  isOptimistic?: boolean;
}
```

#### 2. 状态管理
```typescript
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false); // 新增
const [newFileName, setNewFileName] = useState(job.fileName || ''); // 新增
const [isRenaming, setIsRenaming] = useState(false); // 新增
```

#### 3. 重命名处理
```typescript
const handleRename = async () => {
  if (!newFileName.trim() || newFileName.trim() === job.fileName) {
    setIsRenameDialogOpen(false);
    return;
  }

  try {
    setIsRenaming(true);
    // TODO: 调用重命名 API（后续实现）
    if (onRename) {
      onRename(job.id, newFileName.trim());
    }
    setIsRenameDialogOpen(false);
  } catch {
    alert('重命名失败，请稍后重试');
  } finally {
    setIsRenaming(false);
  }
};
```

#### 4. JobList组件更新
```typescript
// 处理任务重命名
const handleRenameJob = (jobId: string, newName: string) => {
  setJobs(currentJobs => 
    currentJobs.map(job => 
      job.id === jobId ? { ...job, fileName: newName } : job
    )
  );
  
  // 同时更新乐观数据
  setOptimisticJobs(prev => {
    if (prev.has(jobId)) {
      const newMap = new Map(prev);
      const existingJob = newMap.get(jobId);
      if (existingJob) {
        newMap.set(jobId, { ...existingJob, fileName: newName });
      }
      return newMap;
    }
    return prev;
  });
};
```

### 🌐 国际化支持

#### 新增翻译文本
```typescript
// 中文
rename: '重命名',
actions: '操作',
moreActions: '更多操作',

// 英文
rename: 'Rename',
actions: 'Actions',
moreActions: 'More Actions',
```

#### 对话框文本
- **重命名对话框标题**: "重命名" / "Rename"
- **输入框占位符**: "输入新的任务名称" / "Enter new task name"
- **确认按钮**: "确认" / "Confirm"
- **进行中状态**: "重命名中..." / "Renaming..."

### 📱 用户体验

#### 操作流程
1. **定位任务**: 在任务列表中找到要操作的任务
2. **打开菜单**: 点击任务右侧的"..."按钮
3. **选择操作**: 从下拉菜单中选择"重命名"或"删除"
4. **执行操作**: 根据选择进入相应的操作流程

#### 重命名流程
1. **点击重命名**: 从操作菜单选择重命名
2. **输入新名称**: 在对话框中修改任务名称
3. **确认更改**: 点击确认按钮保存更改
4. **即时更新**: 任务列表中的名称立即更新

#### 删除流程
1. **点击删除**: 从操作菜单选择删除
2. **确认删除**: 在确认对话框中确认操作
3. **执行删除**: 任务从列表中移除

### 🔍 技术细节

#### 权限控制
- **操作条件**: 只有 `COMPLETED` 或 `FAILED` 状态的任务可操作
- **按钮状态**: 不可操作的任务显示禁用状态
- **提示信息**: 禁用时显示相应提示

#### 数据验证
- **重命名验证**: 不能为空，不能与原名称相同
- **长度限制**: 任务名称最大100字符
- **特殊字符**: 允许中英文、数字、常用符号

#### 错误处理
- **网络错误**: 显示友好的错误提示
- **验证失败**: 禁用确认按钮
- **操作冲突**: 防止重复操作

### 🚀 后续扩展

#### API接口预留
```typescript
// 重命名API（待实现）
PATCH /api/job/{jobId}/rename
Body: { fileName: string }
Response: { success: boolean, job: MeetingJob }
```

#### 功能扩展可能性
- **复制任务**: 创建任务副本
- **导出任务**: 导出任务数据
- **分享任务**: 生成分享链接
- **标签管理**: 为任务添加标签
- **批量操作**: 选择多个任务进行批量操作

### 📊 优势总结

#### 用户体验提升
- **操作集中**: 所有任务操作集中在一个菜单中
- **界面简洁**: 减少按钮数量，界面更清爽
- **功能扩展**: 为未来功能扩展提供了良好基础

#### 技术架构优化
- **组件复用**: 操作菜单可复用到其他场景
- **状态管理**: 清晰的状态管理和回调机制
- **类型安全**: 完整的TypeScript类型定义

#### 维护性改善
- **代码组织**: 相关功能集中管理
- **扩展性**: 新增操作只需添加菜单项
- **一致性**: 统一的操作模式和交互体验

这个重构为任务管理提供了更好的用户体验和更强的扩展性，为后续功能开发奠定了良好基础。