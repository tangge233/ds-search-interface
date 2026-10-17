/**
 * DeepSeek Search API（`POST /v1/tools/search`）的数据契约。
 * 字段约束与语义来自官方文档：https://api-docs.deepseek.com/zh-cn/api/search
 */

/** 搜索请求体。未知字段会被服务端忽略，这里只声明已支持的字段。 */
export interface SearchRequest {
  /** 搜索词，1～128 个 Unicode 字符，不能全为空白。支持 site: / -site: / "" / lang: / after: / before: 语法。 */
  query: string
  /** 返回条数，1～50，默认 10。只影响条数，不影响计费。 */
  count?: number
  /** 触发搜索的用户原始问题，1～128 个字符，有助于服务端理解意图；null 视为未提供。 */
  ori_question?: string | null
  /** 用于优先返回本地化搜索结果的 IP 地址，默认空字符串。 */
  localization?: string
  /** 是否返回网页正文；为 false 时 content 恒为空字符串。 */
  need_content?: boolean
}

/** 单条搜索结果。 */
export interface SearchResultItem {
  /** 排序分数 0～3，综合相关性/权威性/时效性；≥1.5 为优质结果。 */
  rerank_score: number
  title: string
  url: string
  /** 短摘要，通常 100～200 字符，适合列表展示。 */
  snippet: string
  /** 长摘要，通常 600～800 字符，适合给模型阅读。 */
  summary: string
  /** 网页正文，need_content 为 false 或正文缺失时为空字符串。 */
  content: string
  site_name: string | null
  site_icon: string | null
  /** 发布时间，UTC 的 RFC 3339 格式；未知为 null。 */
  date: string | null
  /** 网页权威性 0～4，-1 表示未知；≥3 为极权威结果。 */
  authority: number
}

export interface SearchResponse {
  /** 没有匹配结果时为空数组。 */
  results: SearchResultItem[]
}

/** 本地排序方式（在服务端返回的候选集上排序，不改变计费）。 */
export type SearchSortKey = 'relevance' | 'authority' | 'date'
