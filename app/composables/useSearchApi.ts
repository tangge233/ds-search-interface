import type { SearchRequest, SearchResponse } from '~/types/search'

/**
 * DeepSeek Search API 的薄封装：浏览器直连，无服务端代理。
 * 官方已对 /v1/tools/search 放开 CORS（含 Authorization 预检），
 * 因此纯静态部署也能直接用；自定义 API 地址需自行支持跨域。
 */
export function useSearchApi() {
  const { apiKey, baseUrl } = useSearchSettings()

  async function search(body: SearchRequest, signal?: AbortSignal): Promise<SearchResponse> {
    const payload = await $fetch<SearchResponse>(`${baseUrl.value}${SEARCH_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.value.trim()}`,
        'Content-Type': 'application/json'
      },
      body,
      signal
    })

    // 防御性契约检查：字段缺失说明响应不符合文档，交给错误映射兜底而不是静默渲染空列表。
    if (!payload || !Array.isArray(payload.results)) {
      throw new SearchContractError('响应缺少 results 字段，可能不是 Search 接口返回的数据。')
    }
    return payload
  }

  return { search }
}
