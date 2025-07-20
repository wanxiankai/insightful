// 国际化配置和翻译文件
export type Locale = 'zh' | 'en';

export const defaultLocale: Locale = 'zh';

export const locales: Locale[] = ['zh', 'en'];

// 翻译文本类型定义
export interface Translations {
  // 通用
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    delete: string;
    back: string;
    viewReport: string;
    uploadFile: string;
    selectFile: string;
    dragDropHere: string;
    supportedFormats: string;
    uploading: string;
    processing: string;
    completed: string;
    failed: string;
    pending: string;
    copy: string;
    copied: string;
    copySuccess: string;
  };

  // 导航和头部
  nav: {
    signOut: string;
    giveStar: string;
    backToHome: string;
  };

  // 登录页面
  signin: {
    title: string;
    subtitle: string;
    welcomeBack: string;
    startJourney: string;
    signInWithGithub: string;
    signingIn: string;
    features: {
      transcription: {
        title: string;
        description: string;
      };
      timeSaving: {
        title: string;
        description: string;
      };
      actionTracking: {
        title: string;
        description: string;
      };
      insights: {
        title: string;
        description: string;
      };
    };
    stats: {
      meetings: string;
      timeSaved: string;
      accuracy: string;
    };
    coreFeatures: string;
    experienceNow: string;
    featureList: {
      transcription: string;
      taskExtraction: string;
      insights: string;
    };
    terms: string;
    privacy: string;
    loginAgreement: string;
    noAccount: string;
  };

  // 主页面
  home: {
    uploadTitle: string;
    historyTitle: string;
    aiAnalyzing: string;
  };

  // 任务状态
  status: {
    pending: string;
    processing: string;
    completed: string;
    failed: string;
  };

  // 任务详情页面
  jobDetail: {
    notFound: string;
    notFoundDesc: string;
    meetingSummary: string;
    actionItems: string;
    assignee: string;
    dueDate: string;
    noActionItems: string;
    analysisCompletedAt: string;
    copySummary: string;
    copyActionItems: string;
    copyAllActionItems: string;
    exportMarkdown: string;
    exportSuccess: string;
    exportFailed: string;
  };

  // 删除确认
  deleteConfirm: {
    title: string;
    description: string;
    warning: string;
    deleting: string;
    confirmDelete: string;
    onlyCompletedCanDelete: string;
  };

  // 错误信息
  errors: {
    uploadFailed: string;
    createJobFailed: string;
    deleteFailed: string;
    networkError: string;
    tryAgainLater: string;
  };
}

// 中文翻译
export const zhTranslations: Translations = {
  common: {
    loading: '加载中...',
    error: '错误',
    success: '成功',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    back: '返回',
    viewReport: '查看报告',
    uploadFile: '上传文件',
    selectFile: '选择文件',
    dragDropHere: '拖拽文件到此处',
    supportedFormats: '支持音频和视频格式文件',
    uploading: '上传中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    pending: '排队中',
    copy: '复制',
    copied: '已复制',
    copySuccess: '复制成功',
  },
  nav: {
    signOut: '登出',
    giveStar: '给我一个Star',
    backToHome: '返回首页',
  },
  signin: {
    title: 'Insightful',
    subtitle: 'AI 驱动的会议智能分析',
    welcomeBack: '欢迎回来',
    startJourney: '开始你的智能会议分析之旅',
    signInWithGithub: '使用 GitHub 登录',
    signingIn: '正在登录...',
    features: {
      transcription: {
        title: '智能转录',
        description: '自动将音频转换为文字，准确率高达98%',
      },
      timeSaving: {
        title: '节省时间',
        description: '将2小时会议压缩为5分钟精华总结',
      },
      actionTracking: {
        title: '行动跟踪',
        description: '自动提取任务分配和截止日期',
      },
      insights: {
        title: '即时洞察',
        description: 'AI分析会议重点，生成关键决策',
      },
    },
    stats: {
      meetings: '会议处理',
      timeSaved: '平均节省时间',
      accuracy: '准确率',
    },
    coreFeatures: '核心功能',
    experienceNow: '立即体验',
    featureList: {
      transcription: '智能转录 & 摘要生成',
      taskExtraction: '自动任务提取',
      insights: '关键决策洞察',
    },
    terms: '服务条款',
    privacy: '隐私政策',
    loginAgreement: '登录即表示你同意我们的',
    noAccount: '还没有账户？登录后自动创建',
  },
  home: {
    uploadTitle: '上传会议文件',
    historyTitle: '历史文件记录',
    aiAnalyzing: 'AI 分析中',
  },
  status: {
    pending: '排队中',
    processing: 'AI 分析中',
    completed: '已完成',
    failed: '失败',
  },
  jobDetail: {
    notFound: '任务未找到或仍在处理中',
    notFoundDesc: '请稍后再试，或返回仪表盘查看最新状态。',
    meetingSummary: '会议摘要',
    actionItems: '行动项',
    assignee: '负责人',
    dueDate: '截止日期',
    noActionItems: '本次会议未识别出明确的行动项。',
    analysisCompletedAt: '分析完成于',
    copySummary: '复制摘要',
    copyActionItems: '复制行动项',
    copyAllActionItems: '复制所有行动项',
    exportMarkdown: '导出 Markdown',
    exportSuccess: '导出成功',
    exportFailed: '导出失败',
  },
  deleteConfirm: {
    title: '确认删除任务',
    description: '您确定要删除任务吗？',
    warning: '此操作将永久删除该任务及其相关数据，无法恢复。',
    deleting: '删除中...',
    confirmDelete: '确认删除',
    onlyCompletedCanDelete: '只能删除已完成或失败的任务',
  },
  errors: {
    uploadFailed: '上传失败',
    createJobFailed: '创建任务失败',
    deleteFailed: '删除任务失败，请稍后重试',
    networkError: '网络错误，上传失败',
    tryAgainLater: '请稍后重试',
  },
};

// 英文翻译
export const enTranslations: Translations = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    back: 'Back',
    viewReport: 'View Report',
    uploadFile: 'Upload File',
    selectFile: 'Select File',
    dragDropHere: 'Drag files here',
    supportedFormats: 'Supports audio and video formats',
    uploading: 'Uploading',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    pending: 'Pending',
    copy: 'Copy',
    copied: 'Copied',
    copySuccess: 'Copy Success',
  },
  nav: {
    signOut: 'Sign Out',
    giveStar: 'Give us a Star',
    backToHome: 'Back to Home',
  },
  signin: {
    title: 'Insightful',
    subtitle: 'AI-Powered Meeting Analysis',
    welcomeBack: 'Welcome Back',
    startJourney: 'Start your intelligent meeting analysis journey',
    signInWithGithub: 'Sign in with GitHub',
    signingIn: 'Signing in...',
    features: {
      transcription: {
        title: 'Smart Transcription',
        description: 'Automatically convert audio to text with 98% accuracy',
      },
      timeSaving: {
        title: 'Save Time',
        description: 'Compress 2-hour meetings into 5-minute summaries',
      },
      actionTracking: {
        title: 'Action Tracking',
        description: 'Automatically extract task assignments and deadlines',
      },
      insights: {
        title: 'Instant Insights',
        description: 'AI analyzes meeting highlights and generates key decisions',
      },
    },
    stats: {
      meetings: 'Meetings Processed',
      timeSaved: 'Average Time Saved',
      accuracy: 'Accuracy',
    },
    coreFeatures: 'Core Features',
    experienceNow: 'Experience Now',
    featureList: {
      transcription: 'Smart Transcription & Summary',
      taskExtraction: 'Automatic Task Extraction',
      insights: 'Key Decision Insights',
    },
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    loginAgreement: 'By signing in, you agree to our',
    noAccount: "Don't have an account? One will be created automatically",
  },
  home: {
    uploadTitle: 'Upload Meeting File',
    historyTitle: 'File History',
    aiAnalyzing: 'AI Analyzing',
  },
  status: {
    pending: 'Pending',
    processing: 'AI Analyzing',
    completed: 'Completed',
    failed: 'Failed',
  },
  jobDetail: {
    notFound: 'Task not found or still processing',
    notFoundDesc: 'Please try again later or return to dashboard to check the latest status.',
    meetingSummary: 'Meeting Summary',
    actionItems: 'Action Items',
    assignee: 'Assignee',
    dueDate: 'Due Date',
    noActionItems: 'No clear action items were identified in this meeting.',
    analysisCompletedAt: 'Analysis completed at',
    copySummary: 'Copy Summary',
    copyActionItems: 'Copy Action Items',
    copyAllActionItems: 'Copy All Action Items',
    exportMarkdown: 'Export Markdown',
    exportSuccess: 'Export Success',
    exportFailed: 'Export Failed',
  },
  deleteConfirm: {
    title: 'Confirm Delete Task',
    description: 'Are you sure you want to delete this task?',
    warning: 'This action will permanently delete the task and its related data, and cannot be undone.',
    deleting: 'Deleting...',
    confirmDelete: 'Confirm Delete',
    onlyCompletedCanDelete: 'Only completed or failed tasks can be deleted',
  },
  errors: {
    uploadFailed: 'Upload failed',
    createJobFailed: 'Failed to create task',
    deleteFailed: 'Failed to delete task, please try again later',
    networkError: 'Network error, upload failed',
    tryAgainLater: 'Please try again later',
  },
};

// 获取翻译文本的函数
export function getTranslations(locale: Locale): Translations {
  switch (locale) {
    case 'en':
      return enTranslations;
    case 'zh':
    default:
      return zhTranslations;
  }
}