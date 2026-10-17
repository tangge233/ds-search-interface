/**
 * 查询语法补全。把「像 IDE 一样提示」的逻辑收敛成纯函数：
 * 组件只负责渲染与键盘事件，新增运算符时不必改 UI。
 * 说明文案只带 i18n key 与插值参数，翻译在渲染时进行。
 */

export interface SyntaxSuggestion {
  /** 替换当前 token 的完整文本 */
  insert: string
  /** 列表里展示的标记 */
  label: string
  /** 说明文案的 i18n key */
  descriptionKey: string
  /** 说明文案的插值参数（例如年份） */
  descriptionParams?: Record<string, unknown>
  /** 插入后光标相对 insert 起点的偏移；引号类会落在引号中间 */
  caretOffset?: number
}

/** 光标所在的空格分隔片段。 */
export interface ActiveToken {
  start: number
  end: number
  text: string
}

export interface SyntaxCompletion {
  token: ActiveToken | null
  items: SyntaxSuggestion[]
}

interface ValueSuggestion {
  value: string
  descriptionKey: string
  descriptionParams?: Record<string, unknown>
}

/** 语言候选；中文名放在 `syntax.languages.*`，值本身是 lang: 的参数。 */
const LANGUAGES: ValueSuggestion[] = ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'ru'].map(value => ({
  value,
  descriptionKey: `syntax.languages.${value}`
}))

const CURRENT_YEAR = new Date().getFullYear()

/** 运算符候选：prefix 决定「输入什么就提示什么」。 */
const OPERATORS: (SyntaxSuggestion & { prefix: string })[] = [
  { prefix: 'site:', insert: 'site:', label: 'site:', descriptionKey: 'syntax.site' },
  { prefix: '-site:', insert: '-site:', label: '-site:', descriptionKey: 'syntax.excludeSite' },
  { prefix: '"', insert: '""', label: '"…"', descriptionKey: 'syntax.phrase', caretOffset: 1 },
  { prefix: '-"', insert: '-""', label: '-"…"', descriptionKey: 'syntax.excludePhrase', caretOffset: 2 },
  { prefix: 'lang:', insert: 'lang:', label: 'lang:', descriptionKey: 'syntax.completion.lang' },
  { prefix: 'after:', insert: 'after:', label: 'after:', descriptionKey: 'syntax.after' },
  { prefix: 'before:', insert: 'before:', label: 'before:', descriptionKey: 'syntax.before' }
]

/** 值候选：冒号后继续输入时按前缀过滤。没有候选表的运算符交给用户自由输入。 */
const VALUE_TABLES: Record<string, ValueSuggestion[]> = {
  lang: LANGUAGES,
  after: [0, 1, 2].map((offset) => {
    const year = CURRENT_YEAR - offset
    return { value: String(year), descriptionKey: 'syntax.completion.afterYear', descriptionParams: { year } }
  }),
  before: [0, 1, 2].map((offset) => {
    const year = CURRENT_YEAR - offset
    return { value: String(year), descriptionKey: 'syntax.completion.beforeYear', descriptionParams: { year } }
  })
}

/** 取光标所在片段；光标停在空格上时返回空 token（表示可以开始下一个条件）。 */
export function activeTokenAt(query: string, caret: number): ActiveToken {
  const position = Math.max(0, Math.min(caret, query.length))
  let start = position
  while (start > 0 && !/\s/.test(query[start - 1]!)) start--
  let end = position
  while (end < query.length && !/\s/.test(query[end]!)) end++
  return { start, end, text: query.slice(start, end) }
}

/**
 * 当前位置的补全候选：
 * - 还没写冒号 → 补全运算符（`s` → `site:`，`-` → `-site:` / `-"…"`）
 * - 写了冒号且在候选表里 → 补全值（`lang:z` → `lang:zh`）
 * 其余情况返回空列表，避免在自由文本里插话。
 */
export function completeQuery(query: string, caret: number): SyntaxCompletion {
  const token = activeTokenAt(query, caret)
  if (!token.text) return { token: null, items: [] }

  const colon = token.text.indexOf(':')
  if (colon === -1) {
    const typed = token.text.toLowerCase()
    const items = OPERATORS
      .filter(operator => operator.prefix.toLowerCase().startsWith(typed))
      .map(({ prefix: _prefix, ...suggestion }) => suggestion)
    // 已经完全写出的运算符不再提示，避免插入后候选原地不动。
    return { token, items: items.filter(item => item.insert !== token.text) }
  }

  const key = token.text.slice(0, colon).toLowerCase()
  const typedValue = token.text.slice(colon + 1).toLowerCase()
  const table = VALUE_TABLES[key]
  if (!table) return { token: null, items: [] }

  const items = table
    .filter(entry => entry.value.toLowerCase().startsWith(typedValue))
    .map(entry => ({
      insert: `${key}:${entry.value}`,
      label: `${key}:${entry.value}`,
      descriptionKey: entry.descriptionKey,
      descriptionParams: entry.descriptionParams
    }))
    .filter(item => item.insert !== token.text)
  return { token, items }
}

/** 用候选替换 token，并给出插入后的光标位置。 */
export function applyCompletion(
  query: string,
  token: ActiveToken,
  item: SyntaxSuggestion
): { query: string; caret: number } {
  return {
    query: `${query.slice(0, token.start)}${item.insert}${query.slice(token.end)}`,
    caret: token.start + (item.caretOffset ?? item.insert.length)
  }
}
