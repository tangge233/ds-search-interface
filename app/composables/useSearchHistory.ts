const KEY = 'dss.history'
const MAX_ITEMS = 12

/**
 * 最近搜索词。纯前端记录，只存在本机 localStorage；
 * 上限 12 条，重复词前移而不是堆叠。
 * 是否记录由设置里的「保留搜索记录」决定：关闭时不再写入，已有记录由设置页清空。
 */
const items = ref<string[]>([])
let hydrated = false

function hydrate() {
  if (hydrated || !import.meta.client) return
  hydrated = true

  // 存储内容可能被手改或来自旧版本，逐项校验类型后再用。
  const stored = readJson<unknown>(KEY, [])
  items.value = Array.isArray(stored)
    ? stored.filter((item): item is string => typeof item === 'string').slice(0, MAX_ITEMS)
    : []
}

export function useSearchHistory() {
  hydrate()

  function remember(query: string) {
    const { prefs } = useSearchSettings()
    if (!prefs.keepHistory) return

    items.value = [query, ...items.value.filter(item => item !== query)].slice(0, MAX_ITEMS)
    writeJson(KEY, items.value)
  }

  function clearAll() {
    items.value = []
    writeJson(KEY, [])
  }

  return { items, remember, clearAll }
}
