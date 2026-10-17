import type { SearchResultItem } from '~/types/search'
import { SearchContractError } from '~/utils/search-error'

/**
 * 响应归一化：在数据进入响应式状态之前把字段降级成渲染安全的默认值。
 *
 * 结果卡片会直接调用 `rerank_score.toFixed()`、读 `summary.length`，
 * 字段类型不符会在渲染期抛错并让整个结果区白屏；模板兜底既写不干净也容易被漏掉，
 * 因此这里一次性收口，模板只面对 `SearchResultItem`。
 *
 * 入参在类型上只是 `object`，每个字段都用 `in` + `typeof` 现查现用，
 * 既没有对未校验数据的断言，也不会把「有这个字段」误当成「字段类型对」。
 */

/** 单条结果：缺 url 的条目点不开也去不了重，返回 null 由调用方丢弃。 */
function toResultItem(raw: object): SearchResultItem | null {
  if (!('url' in raw) || typeof raw.url !== 'string' || !raw.url) return null

  const score = 'rerank_score' in raw ? Number(raw.rerank_score) : Number.NaN
  const authority = 'authority' in raw ? Number(raw.authority) : Number.NaN

  return {
    url: raw.url,
    title: 'title' in raw && typeof raw.title === 'string' ? raw.title : '',
    snippet: 'snippet' in raw && typeof raw.snippet === 'string' ? raw.snippet : '',
    summary: 'summary' in raw && typeof raw.summary === 'string' ? raw.summary : '',
    content: 'content' in raw && typeof raw.content === 'string' ? raw.content : '',
    // 缺相关度按 0（最低）而不是中间值，避免把畸形数据展示成中等质量。
    rerank_score: Number.isFinite(score) ? score : 0,
    // -1 是接口自己的「权威性未知」口径，缺值跟随它。
    authority: Number.isFinite(authority) ? authority : -1,
    site_name: 'site_name' in raw && typeof raw.site_name === 'string' && raw.site_name ? raw.site_name : null,
    site_icon: 'site_icon' in raw && typeof raw.site_icon === 'string' && raw.site_icon ? raw.site_icon : null,
    date: 'date' in raw && typeof raw.date === 'string' && raw.date ? raw.date : null
  }
}

/**
 * 把接口响应收敛成结果数组。
 * - 顶层缺 `results`：说明不是 Search 接口，抛契约错误（会被映射成可读提示）。
 * - 条目缺 url：丢弃该条。
 * - 有条目但一条都留不下：说明字段名整体对不上，同样按契约错误处理，
 *   否则界面会显示「没有结果」，掩盖掉真正的类型问题。
 */
export function normalizeResults(payload: unknown): SearchResultItem[] {
  if (typeof payload !== 'object' || payload === null || !('results' in payload)) {
    throw new SearchContractError('missingResults')
  }

  const results = payload.results
  if (!Array.isArray(results)) {
    throw new SearchContractError('resultsNotArray')
  }

  const items: SearchResultItem[] = []
  for (const raw of results) {
    if (typeof raw !== 'object' || raw === null) continue
    const item = toResultItem(raw)
    if (item) items.push(item)
  }

  if (results.length > 0 && items.length === 0) {
    throw new SearchContractError('itemsMissingUrl')
  }

  return items
}
