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
    rename: string;
    actions: string;
    moreActions: string;
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

  // 录制功能
  recording: {
    startRecording: string;
    stopRecording: string;
    recording: string;
    requestPermission: string;
    permissionRequired: string;
    permissionGranted: string;
    permissionDenied: string;
    permissionDeniedDesc: string;
    permissionInstructions: string;
    deviceNotFound: string;
    deviceNotFoundDesc: string;
    deviceBusy: string;
    deviceBusyDesc: string;
    unsupportedBrowser: string;
    unsupportedBrowserDesc: string;
    tryAgain: string;
    openSettings: string;
    checkMicrophone: string;
    closeOtherApps: string;
    upgradebrowser: string;
    // Timer related
    recorded: string;
    remaining: string;
    timeLimit: string;
    approachingLimit: string;
    criticalLimit: string;
    ready: string;
    paused: string;
    stopped: string;
    error: string;
    // Browser compatibility
    compatibilityWarning: string;
    limitedSupport: string;
    currentBrowser: string;
    missingFeatures: string;
    warnings: string;
    availableOptions: string;
    recommendations: string;
    continueAnyway: string;
    technicalSupport: string;
    // Demo component
    demoTitle: string;
    status: string;
    duration: string;
    clearError: string;
    permission: string;
    canRecord: string;
    yes: string;
    no: string;
    requesting: string;
    // Interface messages
    errorDetails: string;
    recordingTips: string;
    recordingSuccess: string;
    tip1: string;
    tip2: string;
    tip3: string;
    tip4: string;
    successMessage: string;
    // State manager
    readyToRecord: string;
    clickToStart: string;
    requestingPermission: string;
    requestingMicAccess: string;
    recordingInProgress: string;
    keepQuiet: string;
    processingAudio: string;
    processingFile: string;
    recordingCompleted: string;
    recordingSaved: string;
    recordingError: string;
    errorOccurred: string;
    unknownStatus: string;
    statusUnknown: string;
    recordingDuration: string;
    processingPleaseWait: string;
    // Upload zone
    recordingNow: string;
    keepQuietAvoidNoise: string;
    remainingTime: string;
    allowMicrophoneAccess: string;
    uploadingAudioFile: string;
    processingAudioFile: string;
    clickStopToEnd: string;
    keepConnectionOpen: string;
    taskCreated: string;
    aiAnalysisInProgress: string;
    newRecording: string;
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
    rename: '重命名',
    actions: '操作',
    moreActions: '更多操作',
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
  recording: {
    startRecording: '开始录制',
    stopRecording: '停止录制',
    recording: '录制中',
    requestPermission: '请求权限',
    permissionRequired: '需要麦克风权限',
    permissionGranted: '麦克风已就绪',
    permissionDenied: '麦克风权限被拒绝',
    permissionDeniedDesc: '无法访问麦克风，请在浏览器设置中允许麦克风权限',
    permissionInstructions: '为了开始录制，我们需要访问您的麦克风。请点击下方按钮授予权限。',
    deviceNotFound: '未找到麦克风设备',
    deviceNotFoundDesc: '请确保您的设备已连接麦克风并重试',
    deviceBusy: '麦克风正在被其他应用使用',
    deviceBusyDesc: '请关闭其他正在使用麦克风的应用程序',
    unsupportedBrowser: '浏览器不支持录制功能',
    unsupportedBrowserDesc: '请使用最新版本的Chrome、Firefox或Safari浏览器',
    tryAgain: '重试',
    openSettings: '打开设置',
    checkMicrophone: '检查麦克风',
    closeOtherApps: '关闭其他应用',
    upgradebrowser: '升级浏览器',
    // Timer related
    recorded: '已录制',
    remaining: '剩余',
    timeLimit: '录制时间即将达到上限',
    approachingLimit: '⚠️ 录制时间即将达到上限',
    criticalLimit: '🚨 录制即将自动停止',
    ready: '就绪',
    paused: '已暂停',
    stopped: '已停止',
    error: '错误',
    // Browser compatibility
    compatibilityWarning: '浏览器兼容性警告',
    limitedSupport: '您的浏览器对录制功能的支持有限。',
    currentBrowser: '当前浏览器',
    missingFeatures: '缺失功能',
    warnings: '警告',
    availableOptions: '可用选项',
    recommendations: '建议',
    continueAnyway: '仍然继续',
    technicalSupport: '如需技术支持，请联系我们的帮助台',
    // Demo component
    demoTitle: '录音演示',
    status: '状态',
    duration: '时长',
    clearError: '清除错误',
    permission: '权限',
    canRecord: '可以录制',
    yes: '是',
    no: '否',
    requesting: '请求中...',
    // Interface messages
    errorDetails: '错误详情',
    recordingTips: '录制提示',
    recordingSuccess: '录制成功',
    tip1: '确保您的麦克风已连接并正常工作',
    tip2: '选择安静的环境进行录制',
    tip3: '录制时长最多30分钟',
    tip4: '支持的格式：WebM (Opus编码)',
    successMessage: '您的录音已成功保存，时长',
    // State manager
    readyToRecord: '准备录制',
    clickToStart: '点击开始按钮开始录音',
    requestingPermission: '请求权限',
    requestingMicAccess: '正在请求麦克风访问权限...',
    recordingInProgress: '录制中',
    keepQuiet: '正在录制音频，请保持安静...',
    processingAudio: '处理中',
    processingFile: '正在处理录音文件...',
    recordingCompleted: '录制完成',
    recordingSaved: '录音已成功保存',
    recordingError: '录制错误',
    errorOccurred: '录制过程中发生错误',
    unknownStatus: '未知状态',
    statusUnknown: '状态未知',
    recordingDuration: '录制时长',
    processingPleaseWait: '处理中，请稍候...',
    // Upload zone
    recordingNow: '正在录制',
    keepQuietAvoidNoise: '请保持安静，避免背景噪音',
    remainingTime: '剩余时间',
    allowMicrophoneAccess: '请在浏览器弹窗中允许访问麦克风权限',
    uploadingAudioFile: '正在上传录音文件',
    processingAudioFile: '正在处理录音文件',
    clickStopToEnd: '点击停止按钮结束录制',
    keepConnectionOpen: '请保持网络连接，不要关闭页面',
    taskCreated: '任务已创建，正在进行AI分析',
    aiAnalysisInProgress: '任务已创建，正在进行AI分析',
    newRecording: '新建录制',
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
    rename: 'Rename',
    actions: 'Actions',
    moreActions: 'More Actions',
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
  recording: {
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    recording: 'Recording',
    requestPermission: 'Request Permission',
    permissionRequired: 'Microphone Permission Required',
    permissionGranted: 'Microphone Ready',
    permissionDenied: 'Microphone Permission Denied',
    permissionDeniedDesc: 'Cannot access microphone. Please allow microphone access in your browser settings.',
    permissionInstructions: 'To start recording, we need access to your microphone. Please click the button below to grant permission.',
    deviceNotFound: 'Microphone Device Not Found',
    deviceNotFoundDesc: 'Please ensure your device has a microphone connected and try again.',
    deviceBusy: 'Microphone is Being Used by Another Application',
    deviceBusyDesc: 'Please close other applications that are using the microphone.',
    unsupportedBrowser: 'Browser Does Not Support Recording',
    unsupportedBrowserDesc: 'Please use the latest version of Chrome, Firefox, or Safari.',
    tryAgain: 'Try Again',
    openSettings: 'Open Settings',
    checkMicrophone: 'Check Microphone',
    closeOtherApps: 'Close Other Apps',
    upgradebrowser: 'Upgrade Browser',
    // Timer related
    recorded: 'Recorded',
    remaining: 'Remaining',
    timeLimit: 'Recording time limit approaching',
    approachingLimit: '⚠️ Recording time limit approaching',
    criticalLimit: '🚨 Recording will stop automatically',
    ready: 'Ready',
    paused: 'Paused',
    stopped: 'Stopped',
    error: 'Error',
    // Browser compatibility
    compatibilityWarning: 'Browser Compatibility Warning',
    limitedSupport: 'Your browser has limited support for recording features.',
    currentBrowser: 'Current Browser',
    missingFeatures: 'Missing Features',
    warnings: 'Warnings',
    availableOptions: 'Available Options',
    recommendations: 'Recommendations',
    continueAnyway: 'Continue Anyway',
    technicalSupport: 'For technical support, please contact our help desk',
    // Demo component
    demoTitle: 'Audio Recorder Demo',
    status: 'Status',
    duration: 'Duration',
    clearError: 'Clear Error',
    permission: 'Permission',
    canRecord: 'Can Record',
    yes: 'Yes',
    no: 'No',
    requesting: 'Requesting...',
    // Interface messages
    errorDetails: 'Error Details',
    recordingTips: 'Recording Tips',
    recordingSuccess: 'Recording Successful',
    tip1: 'Ensure your microphone is connected and working properly',
    tip2: 'Choose a quiet environment for recording',
    tip3: 'Maximum recording duration is 30 minutes',
    tip4: 'Supported format: WebM (Opus codec)',
    successMessage: 'Your recording has been successfully saved, duration',
    // State manager
    readyToRecord: 'Ready to Record',
    clickToStart: 'Click start button to begin recording',
    requestingPermission: 'Requesting Permission',
    requestingMicAccess: 'Requesting microphone access permission...',
    recordingInProgress: 'Recording',
    keepQuiet: 'Recording audio, please keep quiet...',
    processingAudio: 'Processing',
    processingFile: 'Processing audio file...',
    recordingCompleted: 'Recording Completed',
    recordingSaved: 'Recording successfully saved',
    recordingError: 'Recording Error',
    errorOccurred: 'An error occurred during recording',
    unknownStatus: 'Unknown Status',
    statusUnknown: 'Status unknown',
    recordingDuration: 'Recording Duration',
    processingPleaseWait: 'Processing, please wait...',
    // Upload zone
    recordingNow: 'Recording Now',
    keepQuietAvoidNoise: 'Please keep quiet and avoid background noise',
    remainingTime: 'Remaining Time',
    allowMicrophoneAccess: 'Please allow microphone access in the browser popup',
    uploadingAudioFile: 'Uploading audio file',
    processingAudioFile: 'Processing audio file',
    clickStopToEnd: 'Click stop button to end recording',
    keepConnectionOpen: 'Please keep network connection, do not close the page',
    taskCreated: 'Task created, AI analysis in progress',
    aiAnalysisInProgress: 'Task created, AI analysis in progress',
    newRecording: 'New Recording',
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