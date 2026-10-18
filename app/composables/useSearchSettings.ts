import type { SearchSortKey } from '~/types/search'
import { DEFAULT_BASE_URL } from '~/utils/endpoint'
import type { AppLocale } from '~/utils/locales'
import { APP_LOCALES, DEFAULT_LOCALE, detectLocale } from '~/utils/locales'
import type { LocaleMode, LocalizationMode, ResultsLayout } from '~/utils/search-presets'

/** 持久化的搜索偏好（API Key 单独存放，便于一键清除）。 */
export interface SearchPrefs {
  count: number
  needContent: boolean
  onlyQuality: boolean
  sort: SearchSortKey
  localization: string
  resultsLayout: ResultsLayout
  /** 关掉后不再写入本机搜索记录。 */
  keepHistory: boolean
  /** 本地化 IP 的来源：自动获取或手动填写。 */
  localizationMode: LocalizationMode
  /** 界面语言的来源：自动跟随浏览器偏好，或手动指定。 */
  localeMode: LocaleMode
  /** 当前界面语言；i18n 的当前语言跟随它，而不是反过来。 */
  locale: AppLocale
}

/** 一次查询实际用到的选项。设置弹窗只写默认值，工具栏只改这份会话内的副本。 */
export interface QueryOptions {
  count: number
  needContent: boolean
  onlyQuality: boolean
  sort: SearchSortKey
}

const KEYS = {
  apiKey: 'dss.apiKey',
  baseUrl: 'dss.baseUrl',
  prefs: 'dss.prefs'
} as const

/** 单次查询相关的偏好：设置弹窗的「恢复内置默认值」只重置这一组。 */
const QUERY_PREF_DEFAULTS: Pick<
  SearchPrefs,
  'count' | 'needContent' | 'onlyQuality' | 'sort' | 'localization' | 'localizationMode'
> = {
  count: 10,
  needContent: false,
  onlyQuality: false,
  sort: 'relevance',
  localization: '',
  localizationMode: 'custom'
}

const PREF_DEFAULTS: SearchPrefs = {
  ...QUERY_PREF_DEFAULTS,
  resultsLayout: 'center',
  keepHistory: true,
  localeMode: 'auto',
  locale: DEFAULT_LOCALE
}

/**
 * 模块级单例状态：设置弹窗只有这一份持久化配置，
 * 这样在任一处保存 Key 后，其它组件立刻看到 hasApiKey 变化。
 */
const apiKey = ref('')
const baseUrl = ref(DEFAULT_BASE_URL)
const prefs = reactive<SearchPrefs>({ ...PREF_DEFAULTS })

/**
 * 结果页工具栏改的是这一份：初始值取自持久化的默认参数，
 * 之后只留在内存里——否则临时换个条数会把「新搜索的默认值」也改掉，
 * 而且还落盘，刷新后依旧生效，用户根本无从察觉。
 */
const queryOptions = reactive<QueryOptions>(pickQuery(PREF_DEFAULTS))

let hydrated = false

function pickQuery(source: SearchPrefs): QueryOptions {
  return {
    count: source.count,
    needContent: source.needContent,
    onlyQuality: source.onlyQuality,
    sort: source.sort
  }
}

/** 首次调用时从 localStorage 还原。放在读取之后再挂 watch，避免用默认值覆盖已存配置。 */
function hydrate() {
  if (hydrated || !import.meta.client) return
  hydrated = true

  apiKey.value = readString(KEYS.apiKey)
  baseUrl.value = readString(KEYS.baseUrl) || DEFAULT_BASE_URL
  // 旧版本存下的 prefs 可能缺字段，用默认值补齐。
  const stored = readJson<Partial<SearchPrefs>>(KEYS.prefs, {})
  Object.assign(prefs, PREF_DEFAULTS, stored)
  // 旧版本没有来源字段：已存语言视为用户的选择，按手动处理，避免升级后被浏览器语言覆盖；
  // 没有存过语言的新用户默认自动跟随浏览器。
  if (stored.localeMode !== 'auto' && stored.localeMode !== 'manual') {
    prefs.localeMode = stored.locale ? 'manual' : 'auto'
  }
  if (prefs.localeMode === 'auto') {
    prefs.locale = detectLocale()
  } else if (!APP_LOCALES.some(item => item.code === prefs.locale)) {
    prefs.locale = DEFAULT_LOCALE
  }
  // 旧版本没有来源字段，或值无法识别时按「自定义」处理，与升级前的行为一致。
  if (prefs.localizationMode !== 'auto' && prefs.localizationMode !== 'custom') {
    prefs.localizationMode = 'custom'
  }
  // 会话内的临时选项从存下来的默认值起步。
  Object.assign(queryOptions, pickQuery(prefs))

  watch(apiKey, value => writeString(KEYS.apiKey, value))
  // 地址保持默认时不落盘，避免 localStorage 里留下「看起来配过」的痕迹。
  watch(baseUrl, value => writeString(KEYS.baseUrl, value === DEFAULT_BASE_URL ? '' : value))
  watch(prefs, value => writeJson(KEYS.prefs, value), { deep: true })
  // 改了某个默认值就把它同步给本次会话，免得工具栏上的值悄悄盖住新默认值。
  watch(
    [() => prefs.count, () => prefs.needContent, () => prefs.onlyQuality, () => prefs.sort],
    () => Object.assign(queryOptions, pickQuery(prefs))
  )
  // 切到自动模式立即按浏览器偏好重选；切回手动时保留当前语言作为起点。
  watch(() => prefs.localeMode, (mode) => {
    if (mode === 'auto') prefs.locale = detectLocale()
  })
  // 浏览器语言偏好变化时，自动模式同步切换；手动模式不打扰用户。
  window.addEventListener('languagechange', () => {
    if (prefs.localeMode === 'auto') prefs.locale = detectLocale()
  })
}

export function useSearchSettings() {
  hydrate()

  function saveBaseUrl(value: string) {
    baseUrl.value = value.trim().replace(/\/+$/, '') || DEFAULT_BASE_URL
  }

  function clearApiKey() {
    apiKey.value = ''
  }

  /** 设置弹窗用：把持久化的默认参数还原成内置默认值，布局与记录开关不在此列。 */
  function resetPrefs() {
    Object.assign(prefs, QUERY_PREF_DEFAULTS)
  }

  /** 工具栏用：只把本次会话的临时选项还原成已保存的默认值，不碰存储。 */
  function resetQueryOptions() {
    Object.assign(queryOptions, pickQuery(prefs))
  }

  return {
    apiKey,
    baseUrl,
    prefs,
    queryOptions,
    hasApiKey: computed(() => apiKey.value.trim().length > 0),
    isCustomBaseUrl: computed(() => baseUrl.value !== DEFAULT_BASE_URL),
    saveBaseUrl,
    clearApiKey,
    resetPrefs,
    resetQueryOptions
  }
}
