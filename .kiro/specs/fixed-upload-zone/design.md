# Design Document

## Overview

本设计旨在改进当前页面布局，将上传区域固定在页面顶部，使任务列表具有独立的滚动区域。这将确保用户始终可以访问上传功能，同时提供流畅的任务浏览体验。

## Architecture

### Current Layout Structure
```
Page (min-h-screen, flex-col)
├── Header (fixed height)
└── Main (flex-1, flex-col, items-center, justify-center)
    └── ClientWrapper
        ├── UploadZone (flexible height)
        └── JobList (flexible height, causes page scroll)
```

### New Layout Structure
```
Page (h-screen, flex-col, overflow-hidden)
├── Header (fixed height)
└── Main (flex-1, flex-col, overflow-hidden)
    └── ClientWrapper (h-full, flex-col)
        ├── UploadZone (fixed height, flex-shrink-0)
        └── JobList Container (flex-1, overflow-y-auto)
            └── JobList (content)
```

## Components and Interfaces

### 1. Page Component (apps/web-app/app/page.tsx)

**Changes Required:**
- 修改根容器从 `min-h-screen` 到 `h-screen` 以防止页面滚动
- 添加 `overflow-hidden` 到根容器
- 修改 main 容器移除 `justify-center`，添加 `overflow-hidden`

**New Structure:**
```tsx
<div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
  <Header />
  <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8 overflow-hidden">
    <ClientWrapper initialJobs={initialJobs} />
  </main>
</div>
```

### 2. ClientWrapper Component (apps/web-app/components/ClientWrapper.tsx)

**Changes Required:**
- 修改容器布局为垂直 flex 布局，占满可用高度
- 确保 UploadZone 不会收缩
- 为 JobList 创建可滚动容器

**New Structure:**
```tsx
<div className="flex flex-col h-full w-full max-w-2xl">
  <div className="flex-shrink-0">
    <UploadZone onUploadComplete={handleUploadComplete} />
  </div>
  <div className="flex-1 overflow-y-auto mt-6">
    <JobList ref={jobListRef} initialJobs={initialJobs} />
  </div>
</div>
```

### 3. JobList Component (apps/web-app/components/JobList.tsx)

**Changes Required:**
- 移除外部容器的 margin-top（由父容器处理）
- 确保内容可以正常在滚动容器中显示
- 优化滚动性能

**Key Modifications:**
```tsx
// 移除 mt-6，由父容器处理间距
<div className="w-full">
  {allJobs.length !== 0 && (
    <h3 className="text-base font-semibold text-gray-800 mb-4">
      {t.home.historyTitle}
    </h3>
  )}
  <div className="space-y-4">
    {/* JobItem components */}
  </div>
</div>
```

## Data Models

无需修改现有数据模型，所有更改都是布局和样式相关的。

## Error Handling

### Scroll Behavior Edge Cases

1. **空任务列表**：当没有任务时，不显示滚动条
2. **单个任务**：当只有一个任务时，确保布局正常
3. **动态内容**：当任务动态添加/删除时，滚动位置应该合理调整

### Responsive Design Considerations

1. **小屏幕设备**：确保在移动设备上有足够的滚动区域
2. **极小高度**：当屏幕高度很小时，优先保证上传区域可见
3. **横屏模式**：适应不同的屏幕比例

## Testing Strategy

### Unit Tests
- 测试 ClientWrapper 组件的布局渲染
- 验证滚动容器的正确设置
- 测试响应式行为

### Integration Tests
- 测试上传功能在新布局下的正常工作
- 验证任务列表的滚动行为
- 测试任务添加/删除时的布局稳定性

### Visual Regression Tests
- 不同屏幕尺寸下的布局截图对比
- 滚动状态的视觉验证
- 移动设备适配验证

### User Experience Tests
- 验证上传区域始终可见
- 测试滚动流畅性
- 确认触摸设备上的滚动体验

## Implementation Details

### CSS Classes and Styling

**Key Tailwind Classes:**
- `h-screen`: 设置页面高度为视口高度
- `overflow-hidden`: 防止页面级别滚动
- `flex-shrink-0`: 防止上传区域收缩
- `overflow-y-auto`: 为任务列表启用垂直滚动
- `flex-1`: 让任务列表容器占用剩余空间

### Performance Considerations

1. **虚拟滚动**：如果任务数量很大，考虑实现虚拟滚动
2. **滚动优化**：使用 `scroll-behavior: smooth` 提供平滑滚动
3. **内存管理**：确保滚动不会导致内存泄漏

### Browser Compatibility

- 现代浏览器支持 flexbox 和 CSS Grid
- 移动浏览器的滚动行为优化
- 触摸设备的滚动手势支持

## Migration Strategy

### Phase 1: Layout Structure Changes
1. 修改 Page 组件的根容器样式
2. 更新 ClientWrapper 组件布局
3. 调整 JobList 组件样式

### Phase 2: Responsive Optimization
1. 测试不同屏幕尺寸
2. 优化移动设备体验
3. 调整间距和尺寸

### Phase 3: Performance and Polish
1. 优化滚动性能
2. 添加滚动指示器（如需要）
3. 完善用户体验细节

## Success Metrics

1. **功能性**：上传区域始终可见
2. **可用性**：任务列表可以独立滚动
3. **性能**：滚动流畅，无卡顿
4. **兼容性**：在各种设备和浏览器上正常工作
5. **用户体验**：用户反馈积极，操作更加便捷