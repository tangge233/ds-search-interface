import type { SearchRequest, SearchResultItem } from '~/types/search'
import type { SearchFailure } from '~/utils/search-error'

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * 一次搜索的完整生命周期：校验 → 请求 → 展示态。
 * 用 AbortController 保证「新搜索取代旧搜索」，避免慢响应覆盖新结果；
 * 不主动并发重试，因为 Search 接口是账号级 5 QPS 限速。
 */
export function useWebSearch() {
  const { prefs, hasApiKey } = useSearchSettings()
  const api = useSearchApi()

  const status = ref<SearchStatus>('idle')
  const results = ref<SearchResultItem[]>([])
  const failure = ref<SearchFailure | null>(null)
  const lastQuery = ref('')
  const elapsedMs = ref(0)
  let controller: AbortController | null = null

  /** 过滤/排序只在本地进行，因此这两者的差值就是「被本地设置藏起来的条数」。 */
  const visibleResults = computed(() => applyViewOptions(results.value, prefs))
  const hiddenCount = computed(() => results.value.length - visibleResults.value.length)

  function failWith(partial: Omit<SearchFailure, 'status' | 'retryable'> & { status?: number | null; retryable?: boolean }) {
    failure.value = { status: partial.status ?? null, retryable: partial.retryable ?? false, ...partial }
    status.value = 'error'
  }

  async function run(query: string, oriQuestion = '') {
    // 先取消在途请求：无论这次提交本身是否合法，旧请求都不该再有机会写状态。
    controller?.abort()
    controller = null

    const trimmed = query.trim()
    const invalid = validateSearchInput({
      query: trimmed,
      oriQuestion,
      localization: prefs.localization
    })
    if (invalid) {
      failWith({ title: '参数不符合接口要求', detail: invalid, hint: '修正后即可提交。' })
      return
    }

    if (!hasApiKey.value) {
      failWith({
        title: '尚未配置 API Key',
        detail: 'Search 接口使用 Bearer 鉴权，需要你自己的 DeepSeek API Key。',
        hint: '填入 API Key 后立刻可以搜索，它只保存在当前浏览器。',
        needsApiKey: true
      })
      return
    }

    // 每次请求持有自己的控制器：catch 里判断的必须是本次请求的中止状态，
    // 用共享变量会在快速连续搜索时误判（旧请求被中止却报网络错误）。
    const active = new AbortController()
    controller = active
    const startedAt = performance.now()
    status.value = 'loading'
    failure.value = null
    lastQuery.value = trimmed

    const body: SearchRequest = {
      query: trimmed,
      count: prefs.count,
      need_content: prefs.needContent,
      // 可选字段留空时直接省略：文档里 null 与「未提供」等价。
      ori_question: oriQuestion.trim() || undefined,
      localization: prefs.localization.trim() || undefined
    }

    try {
      const response = await api.search(body, active.signal)
      results.value = response.results
      elapsedMs.value = Math.round(performance.now() - startedAt)
      status.value = 'success'
      useSearchHistory().remember(trimmed)
    } catch (error) {
      // 被新提交或 clear() 打断：丢弃这次的结果与错误，让最新状态决定界面。
      if (active.signal.aborted) return
      failure.value = describeSearchError(error)
      status.value = 'error'
    }
  }

  function clear() {
    controller?.abort()
    controller = null
    status.value = 'idle'
    results.value = []
    failure.value = null
    lastQuery.value = ''
    elapsedMs.value = 0
  }

  return { status, results, visibleResults, hiddenCount, failure, lastQuery, elapsedMs, run, clear }
}
