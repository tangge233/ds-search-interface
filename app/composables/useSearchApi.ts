import type { SearchRequest, SearchResponse } from '~/types/search'
import { endpoint, SEARCH_PATH } from '~/utils/endpoint'
import { normalizeResults } from '~/utils/search-contract'

/**
 * DeepSeek Search API 的薄封装：浏览器直连，无服务端代理。
 * 官方已对 /v1/tools/search 放开 CORS（含 Authorization 预检），
 * 因此纯静态部署也能直接用；自定义 API 地址需自行支持跨域。
 */
export function useSearchApi() {
  const { apiKey, baseUrl } = useSearchSettings()

  async function search(body: SearchRequest, signal?: AbortSignal): Promise<SearchResponse> {
    const payload = await $fetch<unknown>(endpoint(baseUrl.value, SEARCH_PATH), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.value.trim()}`,
        'Content-Type': 'application/json'
      },
      body,
      signal
    })

    // 契约校验放在这里而不是模板：字段缺失/类型不符要变成可读错误，
    // 不能让结果卡片在渲染期抛错。
    return { results: normalizeResults(payload) }
  }

  return { search }
}
