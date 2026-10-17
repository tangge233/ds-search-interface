import type { SearchSortKey } from '~/types/search'

export const DEFAULT_BASE_URL = 'https://api.deepseek.com'
export const SEARCH_PATH = '/v1/tools/search'

/** 结果区布局：居中单列 / 靠左单列 / 宽屏多列。 */
export type ResultsLayout = 'center' | 'left' | 'columns'

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
}

const KEYS = {
  apiKey: 'dss.apiKey',
  baseUrl: 'dss.baseUrl',
  prefs: 'dss.prefs'
} as const

/** 单次查询相关的偏好：工具栏上的「恢复默认」只重置这一组。 */
const QUERY_PREF_DEFAULTS: Pick<
  SearchPrefs,
  'count' | 'needContent' | 'onlyQuality' | 'sort' | 'localization'
> = {
  count: 10,
  needContent: false,
  onlyQuality: false,
  sort: 'relevance',
  localization: ''
}

const PREF_DEFAULTS: SearchPrefs = {
  ...QUERY_PREF_DEFAULTS,
  resultsLayout: 'center',
  keepHistory: true
}

/**
 * 模块级单例状态：设置弹窗、搜索栏和结果区共享同一份配置，
 * 这样在任一处保存 Key 后，其它组件立刻看到 hasApiKey 变化。
 */
const apiKey = ref('')
const baseUrl = ref(DEFAULT_BASE_URL)
const prefs = reactive<SearchPrefs>({ ...PREF_DEFAULTS })
let hydrated = false

/** 首次调用时从 localStorage 还原。放在读取之后再挂 watch，避免用默认值覆盖已存配置。 */
function hydrate() {
  if (hydrated || !import.meta.client) return
  hydrated = true

  apiKey.value = readString(KEYS.apiKey)
  baseUrl.value = readString(KEYS.baseUrl) || DEFAULT_BASE_URL
  // 旧版本存下的 prefs 可能缺字段，用默认值补齐。
  Object.assign(prefs, PREF_DEFAULTS, readJson<Partial<SearchPrefs>>(KEYS.prefs, {}))

  watch(apiKey, value => writeString(KEYS.apiKey, value))
  // 地址保持默认时不落盘，避免 localStorage 里留下「看起来配过」的痕迹。
  watch(baseUrl, value => writeString(KEYS.baseUrl, value === DEFAULT_BASE_URL ? '' : value))
  watch(prefs, value => writeJson(KEYS.prefs, value), { deep: true })
}

export function useSearchSettings() {
  hydrate()

  function saveBaseUrl(value: string) {
    baseUrl.value = value.trim().replace(/\/+$/, '') || DEFAULT_BASE_URL
  }

  function clearApiKey() {
    apiKey.value = ''
  }

  /** 只重置单次查询相关的选项；布局与记录开关属于界面设置，在弹窗里单独控制。 */
  function resetPrefs() {
    Object.assign(prefs, QUERY_PREF_DEFAULTS)
  }

  return {
    apiKey,
    baseUrl,
    prefs,
    hasApiKey: computed(() => apiKey.value.trim().length > 0),
    isCustomBaseUrl: computed(() => baseUrl.value !== DEFAULT_BASE_URL),
    saveBaseUrl,
    clearApiKey,
    resetPrefs
  }
}
