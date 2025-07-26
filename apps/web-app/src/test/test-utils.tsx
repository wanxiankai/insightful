import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock LanguageContext
const MockLanguageContext = React.createContext({
  language: 'zh',
  setLanguage: () => {},
  t: (key: string) => key
})

// Mock LanguageProvider
const MockLanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const value = {
    language: 'zh',
    setLanguage: () => {},
    t: (key: string) => {
      // Simple translation mapping for tests
      const translations: Record<string, string> = {
        'recording.permission.title': '需要麦克风权限',
        'recording.permission.description': '为了录制音频，我们需要访问您的麦克风',
        'recording.permission.request': '请求权限',
        'recording.permission.granted': '麦克风已就绪',
        'recording.permission.denied': '麦克风权限被拒绝',
        'recording.permission.retry': '重试',
        'recording.permission.settings': '打开设置',
        'recording.permission.loading': '加载中...',
        'recording.error.device_not_found': '未找到麦克风设备',
        'recording.error.device_busy': '麦克风正在被其他应用使用',
        'recording.error.unsupported_browser': '浏览器不支持录制功能',
        'recording.error.check_microphone': '检查麦克风',
        'recording.error.close_other_apps': '关闭其他应用',
        'recording.error.upgrade_browser': '升级浏览器'
      }
      return translations[key] || key
    }
  }

  return (
    <MockLanguageContext.Provider value={value}>
      {children}
    </MockLanguageContext.Provider>
  )
}

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockLanguageProvider>
      {children}
    </MockLanguageProvider>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }