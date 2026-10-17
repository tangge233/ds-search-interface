import type { SearchSortKey } from '~/types/search'
import { countCharacters } from '~/utils/format'

/**
 * 输入校验。范围来自官方文档：
 * query / ori_question 为 1～128 个 Unicode 字符且不能全为空白；
 * localization 是用于本地化排序的 IP 地址。
 * 返回 null 表示通过，否则返回可直接展示的中文提示。
 */

/** 每段 0～255，且不接受前导零（`01` 在不同系统里会被当成八进制或直接拒绝）。 */
const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/

/**
 * IPv6 交给 URL 解析器判定：方括号里只接受 IPv6 字面量，
 * 非法地址（`::::`、超过 8 段、单段超过 4 位）构造时就会抛出，
 * 比手写正则可靠，也不用额外依赖。
 */
function isIPv6(value: string): boolean {
  if (!value.includes(':')) return false
  try {
    new URL(`http://[${value}]/`)
    return true
  } catch {
    return false
  }
}

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
  if (localization && !IPV4.test(localization) && !isIPv6(localization)) {
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
