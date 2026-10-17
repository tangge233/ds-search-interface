import type { SearchSortKey } from '~/types/search'

/**
 * 输入校验。范围来自官方文档：
 * query / ori_question 为 1～128 个 Unicode 字符且不能全为空白；
 * localization 是用于本地化排序的 IP 地址。
 * 返回 null 表示通过，否则返回可直接展示的中文提示。
 */
export function validateSearchInput(input: {
  query: string
  oriQuestion?: string
  localization?: string
}): string | null {
  const query = input.query.trim()
  if (!query) return '请输入搜索词。'
  if (countCharacters(query) > 128) return '搜索词最多 128 个字符，请精简后重试。'

  const oriQuestion = input.oriQuestion?.trim() ?? ''
  if (countCharacters(oriQuestion) > 128) return '原始问题最多 128 个字符。'

  const localization = input.localization?.trim() ?? ''
  // 同时接受 IPv4 与 IPv6 文本形式，够用且不引入依赖。
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6 = /^[0-9a-fA-F:]{2,45}$/
  if (localization && !ipv4.test(localization) && !ipv6.test(localization)) {
    return '本地化 IP 格式不正确，例如 203.0.113.10 或 2001:db8::1。'
  }

  return null
}

/**
 * 在服务端返回的候选集上做本地过滤与排序。纯函数，不改动入参。
 * - onlyQuality：只保留 rerank_score ≥ 1.5 的优质结果（官方口径）。
 * - relevance：保持服务端排序；其余按权威性 / 发布时间降序，缺失值排在最后。
 */
export function applyViewOptions<
  T extends { rerank_score: number; authority: number; date: string | null }
>(items: T[], options: { onlyQuality: boolean; sort: SearchSortKey }): T[] {
  const filtered = options.onlyQuality ? items.filter(item => item.rerank_score >= 1.5) : items.slice()

  if (options.sort === 'authority') {
    return filtered.sort((a, b) => b.authority - a.authority || b.rerank_score - a.rerank_score)
  }
  if (options.sort === 'date') {
    const time = (item: T) => {
      const parsed = item.date ? Date.parse(item.date) : Number.NaN
      return Number.isNaN(parsed) ? -Infinity : parsed
    }
    return filtered.sort((a, b) => time(b) - time(a) || b.rerank_score - a.rerank_score)
  }
  return filtered
}
