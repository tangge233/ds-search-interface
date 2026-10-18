/**
 * 支持的界面语言。
 * 名称写成本地语言本身（而不是翻译后的名字），语言切换器在任何语言下都读得懂。
 */
export const APP_LOCALES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' }
] as const

export type AppLocale = (typeof APP_LOCALES)[number]['code']

export const DEFAULT_LOCALE: AppLocale = 'zh-CN'

/**
 * 按浏览器偏好顺序匹配已支持的语言：中文统一落到 zh-CN，
 * 跳过不支持的语言，都匹配不上时退到英文。
 */
export function matchLocale(tags: readonly string[]): AppLocale {
  for (const tag of tags) {
    const language = tag.toLowerCase().split('-')[0]!
    if (language === 'zh') return 'zh-CN'
    const match = APP_LOCALES.find(item => item.code.split('-')[0] === language)
    if (match) return match.code
  }
  return 'en'
}

/** 首次访问或自动模式下，用浏览器首选语言决定界面语言。 */
export function detectLocale(): AppLocale {
  if (!import.meta.client) return DEFAULT_LOCALE
  return matchLocale(navigator.languages?.length ? navigator.languages : [navigator.language])
}
