import type { SearchResultItem } from '~/types/search'

/** RFC 3339 → 本地时区的 YYYY-MM-DD，与 after: / before: 的书写习惯一致。 */
export function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 结果来源展示：优先站点名，其次主机名（去掉 www.）。 */
export function resultSource(result: Pick<SearchResultItem, 'site_name' | 'url'>): string {
  if (result.site_name) return result.site_name
  try {
    return new URL(result.url).hostname.replace(/^www\./, '')
  } catch {
    return result.url
  }
}

/** 把 URL 压成 host + path + query；超长时只保留前段并加省略号。 */
export function shortUrl(url: string, max = 72): string {
  try {
    const parsed = new URL(url)
    const compact = `${parsed.host}${parsed.pathname}${parsed.search}`
    return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact
  } catch {
    return url
  }
}

/** 分数 → 语义色：≥2 优秀，≥1.5 优质（官方口径），其余为一般。 */
export function scoreColor(score: number): 'success' | 'primary' | 'neutral' {
  if (score >= 2) return 'success'
  if (score >= 1.5) return 'primary'
  return 'neutral'
}

/** 权威性 → 文案与语义色。-1 表示 API 未给出判断。 */
export function authorityMeta(authority: number): {
  label: string
  color: 'success' | 'neutral'
} {
  if (authority < 0) return { label: '权威性未知', color: 'neutral' }
  if (authority >= 3) return { label: `极权威 ${authority}/4`, color: 'success' }
  return { label: `权威性 ${authority}/4`, color: 'neutral' }
}

/**
 * 按 Unicode 码点计数。API 的 1～128 字符上限是按字符而非 UTF-16 单元计的，
 * 中文/emoji 用 String.length 会算多，所以这里显式展开码点。
 */
export function countCharacters(value: string): number {
  return [...value].length
}
