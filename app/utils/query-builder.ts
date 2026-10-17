/**
 * 高级语法生成器的结构化 ⇄ 文本转换。
 * 只解析官方文档列出的运算符，认不出的 token 一律原样保留在「全部关键词」里，
 * 重复条件（第二个 after:、第二段短语等）也退回关键词，
 * 因此 `buildQuery(parseQuery(q))` 不会悄悄丢掉用户已经写好的东西。
 */

export interface QueryBuilderFields {
  /** 全部关键词，原样拼接（空格分隔即 AND） */
  keywords: string
  /** 精确短语，生成 `"…"` */
  phrase: string
  /** 排除关键词，空格或逗号分隔，逐个生成 `-词` */
  excludeKeywords: string
  /** 排除短语，生成 `-"…"` */
  excludePhrase: string
  /** 限定站点，多个用 OR 连接 */
  site: string
  /** 排除站点，多个并排 */
  excludeSite: string
  /** 语言，逗号分隔 */
  lang: string
  /** 起始日期，生成 `after:` */
  after: string
  /** 结束日期，生成 `before:` */
  before: string
}

export const EMPTY_BUILDER_FIELDS: QueryBuilderFields = {
  keywords: '',
  phrase: '',
  excludeKeywords: '',
  excludePhrase: '',
  site: '',
  excludeSite: '',
  lang: '',
  after: '',
  before: ''
}

const KNOWN_KEYS = ['site', 'lang', 'after', 'before']

/** 逗号或空白分隔的多个值：站点、排除词、语言共用同一套解析。 */
function splitList(value: string): string[] {
  return value.split(/[\s,，]+/).map(part => part.trim()).filter(Boolean)
}

/** 用户可能把引号一起填进来，统一剥掉。 */
function stripQuotes(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1)
  return trimmed
}

/** 按空白切词，引号内的空格不算分隔符（`"release notes"` 是一个 token）。 */
function tokenizeQuery(query: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of query) {
    if (char === '"') {
      inQuotes = !inQuotes
      current += char
      continue
    }
    if (!inQuotes && /\s/.test(char)) {
      if (current) tokens.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current) tokens.push(current)
  return tokens
}

/**
 * 结构化条件 → 搜索词。
 * 顺序固定为 关键词 → 短语 → 排除项 → 站点 → 语言 → 时间，
 * 多站点用 `OR` 连接（官方语法里两个并列 `site:` 会互相覆盖）。
 */
export function buildQuery(fields: QueryBuilderFields): string {
  const parts: string[] = []

  const keywords = fields.keywords.trim()
  if (keywords) parts.push(keywords)

  const phrase = stripQuotes(fields.phrase)
  if (phrase) parts.push(`"${phrase}"`)

  for (const word of splitList(fields.excludeKeywords)) parts.push(`-${word}`)

  const excludePhrase = stripQuotes(fields.excludePhrase)
  if (excludePhrase) parts.push(`-"${excludePhrase}"`)

  const sites = splitList(fields.site)
  if (sites.length) parts.push(sites.map(site => `site:${site}`).join(' OR '))

  for (const site of splitList(fields.excludeSite)) parts.push(`-site:${site}`)

  const languages = splitList(fields.lang)
  if (languages.length) parts.push(`lang:${languages.join(',')}`)

  const after = fields.after.trim().replace(/^after:/i, '')
  if (after) parts.push(`after:${after}`)

  const before = fields.before.trim().replace(/^before:/i, '')
  if (before) parts.push(`before:${before}`)

  return parts.join(' ')
}

/**
 * 搜索词 → 结构化条件（尽力而为）。
 * 单值字段只取第一个，重复出现的条件按原文退回关键词，保证内容不丢。
 */
export function parseQuery(query: string): QueryBuilderFields {
  const fields: QueryBuilderFields = { ...EMPTY_BUILDER_FIELDS }
  const keywords: string[] = []
  const excludeWords: string[] = []
  const sites: string[] = []
  const excludeSites: string[] = []
  let previousWasSite = false

  for (const token of tokenizeQuery(query)) {
    const match = /^(-?)([a-z]+):(.*)$/i.exec(token)
    const key = match?.[2]?.toLowerCase()

    if (match && key && KNOWN_KEYS.includes(key)) {
      const value = match[3] ?? ''
      if (key === 'site') (match[1] === '-' ? excludeSites : sites).push(value)
      else if (key === 'lang') fields.lang = fields.lang ? `${fields.lang},${value}` : value
      // after / before 只能存一个值，重复出现的条件按原文退回关键词，避免解析时悄悄丢条件。
      else if (key === 'after') {
        if (fields.after) keywords.push(token)
        else fields.after = value
      }
      else {
        if (fields.before) keywords.push(token)
        else fields.before = value
      }

      previousWasSite = key === 'site'
      continue
    }

    // `site:a OR site:b` 里的 OR 是我们自己生成的连接符，解析时不再当成关键词。
    if (previousWasSite && /^or$/i.test(token)) {
      previousWasSite = false
      continue
    }
    previousWasSite = false

    if (/^-".*"$/.test(token) && token.length > 3) {
      if (fields.excludePhrase) keywords.push(token)
      else fields.excludePhrase = token.slice(2, -1)
      continue
    }
    if (/^".*"$/.test(token) && token.length > 2) {
      if (fields.phrase) keywords.push(token)
      else fields.phrase = token.slice(1, -1)
      continue
    }
    if (token.startsWith('-') && token.length > 1 && !token.includes(':')) {
      excludeWords.push(token.slice(1))
      continue
    }
    keywords.push(token)
  }

  fields.keywords = keywords.join(' ')
  fields.excludeKeywords = excludeWords.join(' ')
  fields.site = sites.join(' ')
  fields.excludeSite = excludeSites.join(' ')
  return fields
}
