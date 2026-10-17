/**
 * 支持的界面语言。
 * 名称写成本地语言本身（而不是翻译后的名字），语言切换器在任何语言下都读得懂。
 */
export const APP_LOCALES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' }
] as const

export type AppLocale = (typeof APP_LOCALES)[number]['code']

export const DEFAULT_LOCALE: AppLocale = 'zh-CN'

/**
 * 首次访问按浏览器语言判断：中文系落到 zh-CN，其余落到 en。
 * 只在没有存过偏好时用一次，之后以用户的选择为准。
 */
export function detectLocale(): AppLocale {
  if (!import.meta.client) return DEFAULT_LOCALE
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}
