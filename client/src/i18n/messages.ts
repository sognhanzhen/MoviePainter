export const SUPPORTED_LANGUAGES = ["en-US", "zh-CN"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en-US";
export const LANGUAGE_STORAGE_KEY = "moviepainter-language";

type TranslationParams = Record<string, string | number>;

const messages = {
  "auth.closePanel": {
    "en-US": "Close sign-in panel",
    "zh-CN": "关闭登录面板"
  },
  "auth.createAccount": {
    "en-US": "Create account",
    "zh-CN": "创建账号"
  },
  "auth.creatingAccount": {
    "en-US": "Creating your account...",
    "zh-CN": "正在创建账号..."
  },
  "auth.email": {
    "en-US": "Email",
    "zh-CN": "邮箱"
  },
  "auth.login": {
    "en-US": "Log in",
    "zh-CN": "登录"
  },
  "auth.name": {
    "en-US": "Name",
    "zh-CN": "名称"
  },
  "auth.password": {
    "en-US": "Password",
    "zh-CN": "密码"
  },
  "auth.passwordPlaceholder": {
    "en-US": "Enter at least 6 characters",
    "zh-CN": "请输入至少 6 个字符"
  },
  "auth.processing": {
    "en-US": "Processing...",
    "zh-CN": "处理中..."
  },
  "auth.requestFailed": {
    "en-US": "Request failed. Please try again.",
    "zh-CN": "请求失败，请稍后再试。"
  },
  "auth.signIn": {
    "en-US": "Sign in",
    "zh-CN": "登录"
  },
  "auth.signInPrompt": {
    "en-US": "Please log in using the form below",
    "zh-CN": "请使用下方表单登录"
  },
  "auth.signUp": {
    "en-US": "Sign up",
    "zh-CN": "注册"
  },
  "auth.signingIn": {
    "en-US": "Signing in...",
    "zh-CN": "正在登录..."
  },
  "auth.welcome": {
    "en-US": "Welcome to MoviePainter",
    "zh-CN": "欢迎使用 MoviePainter"
  },
  "avatar.currentUser": {
    "en-US": "Current User",
    "zh-CN": "当前用户"
  },
  "avatar.language": {
    "en-US": "Language",
    "zh-CN": "语言"
  },
  "avatar.languageEnglish": {
    "en-US": "EN",
    "zh-CN": "英"
  },
  "avatar.languageEnglishLabel": {
    "en-US": "English",
    "zh-CN": "英文"
  },
  "avatar.languageChinese": {
    "en-US": "ZH",
    "zh-CN": "中"
  },
  "avatar.languageChineseLabel": {
    "en-US": "Chinese",
    "zh-CN": "中文"
  },
  "avatar.logout": {
    "en-US": "Log out",
    "zh-CN": "退出登录"
  },
  "avatar.openMenu": {
    "en-US": "Open user menu",
    "zh-CN": "打开用户菜单"
  },
  "avatar.settings": {
    "en-US": "Settings",
    "zh-CN": "设置"
  },
  "brand.name": {
    "en-US": "MoviePainter",
    "zh-CN": "MoviePainter"
  },
  "common.clear": {
    "en-US": "Clear",
    "zh-CN": "清除"
  },
  "common.loading": {
    "en-US": "Loading",
    "zh-CN": "加载中"
  },
  "common.retry": {
    "en-US": "Retry",
    "zh-CN": "重试"
  },
  "common.settingsLoaded": {
    "en-US": "Settings loaded from {source}.",
    "zh-CN": "设置已从 {source} 数据源加载。"
  },
  "common.settingsSaved": {
    "en-US": "Settings saved to {source}. Last updated: {updatedAt}",
    "zh-CN": "设置已保存到 {source} 数据源。最近更新时间：{updatedAt}"
  },
  "common.userFallback": {
    "en-US": "MoviePainter User",
    "zh-CN": "MoviePainter 用户"
  },
  "generation.status.failed": {
    "en-US": "Failed",
    "zh-CN": "失败"
  },
  "generation.status.running": {
    "en-US": "Generating",
    "zh-CN": "生成中"
  },
  "generation.status.succeeded": {
    "en-US": "Completed",
    "zh-CN": "已完成"
  },
  "generation.status.waiting": {
    "en-US": "Waiting",
    "zh-CN": "待处理"
  },
  "nav.assets": {
    "en-US": "Assets",
    "zh-CN": "素材"
  },
  "nav.history": {
    "en-US": "History",
    "zh-CN": "历史记录"
  },
  "nav.library": {
    "en-US": "Library",
    "zh-CN": "海报库"
  },
  "nav.settings": {
    "en-US": "Settings",
    "zh-CN": "个人设置"
  },
  "nav.workspace": {
    "en-US": "Workspace",
    "zh-CN": "生成工作区"
  },
  "protected.restoring": {
    "en-US": "Restoring your workspace...",
    "zh-CN": "正在恢复你的工作台..."
  },
  "settings.defaultMode": {
    "en-US": "Default mode",
    "zh-CN": "默认模式"
  },
  "settings.description": {
    "en-US": "Manage your profile, default workspace mode, language, and upcoming notification preferences.",
    "zh-CN": "这里将承接用户基础资料、默认工作模式、语言和后续通知偏好等设置。"
  },
  "settings.displayName": {
    "en-US": "Display name",
    "zh-CN": "展示名称"
  },
  "settings.fallbackLoaded": {
    "en-US": "Settings could not be loaded, so default preferences are shown for now.",
    "zh-CN": "设置加载失败，当前先展示默认设置。"
  },
  "settings.languagePreference": {
    "en-US": "Language preference",
    "zh-CN": "语言偏好"
  },
  "settings.loading": {
    "en-US": "Loading profile settings...",
    "zh-CN": "正在加载个人设置..."
  },
  "settings.localSessionFallback": {
    "en-US": "The sign-in session was restored, but backend settings are unavailable. Local defaults are shown for now.",
    "zh-CN": "当前仅恢复了登录会话，后端配置暂不可用，先展示本地默认设置。"
  },
  "settings.notifications": {
    "en-US": "Enable notifications",
    "zh-CN": "开启通知提醒"
  },
  "settings.profile": {
    "en-US": "Profile",
    "zh-CN": "个人资料"
  },
  "settings.save": {
    "en-US": "Save settings",
    "zh-CN": "保存设置"
  },
  "settings.saveFailed": {
    "en-US": "Settings could not be saved. Please try again later.",
    "zh-CN": "设置保存失败，请稍后再试。"
  },
  "settings.saving": {
    "en-US": "Saving settings...",
    "zh-CN": "正在保存设置..."
  },
  "settings.title": {
    "en-US": "Personal Settings",
    "zh-CN": "个人设置"
  }
} as const;

export type TranslationKey = keyof typeof messages;

export function normalizeLanguage(value: unknown): Language {
  if (value === "zh-CN" || value === "zh") {
    return "zh-CN";
  }

  if (value === "en-US" || value === "en") {
    return "en-US";
  }

  return DEFAULT_LANGUAGE;
}

export function translate(language: Language, key: TranslationKey, params?: TranslationParams) {
  const template: string = messages[key][language] ?? messages[key][DEFAULT_LANGUAGE];

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
}
