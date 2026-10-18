/**
 * 查询语法补全。把「像 IDE 一样提示」的逻辑收敛成纯函数：
 * 组件只负责渲染与键盘事件，新增运算符时不必改 UI。
 * 说明文案只带 i18n key 与插值参数，翻译在渲染时进行。
 *
 * 光标处的片段为空（字段为空、刚敲完空格、退格删到片段开头）时给出全部运算符，
 * 面板因此可以默认展开：输入筛选、空格重置、退格恢复，全程不用先记住语法。
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
  /** 光标所在片段；空 token 表示「可以在这里开始写下一个条件」，同样是合法插入点。 */
  token: ActiveToken
  /** 空数组表示此处不提示（自由文本、没有值表的运算符） */
  items: SyntaxSuggestion[]
}

interface ValueSuggestion {
  value: string
  descriptionKey: string
  descriptionParams?: Record<string, unknown>
}

/** 语言候选；语言名称放在 `syntax.languages.*`，值本身是 lang: 的参数。 */
const LANGUAGES: ValueSuggestion[] = ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'ru'].map(value => ({
  value,
  descriptionKey: `syntax.languages.${value}`
}))

const CURRENT_YEAR = new Date().getFullYear()

/**
 * 运算符候选。insert 同时决定「输入什么就提示什么」：
 * 光标处的片段是它的前缀就出现在候选里，所以新增运算符不用再改补全逻辑。
 */
const OPERATORS: SyntaxSuggestion[] = [
  { insert: 'site:', label: 'site:', descriptionKey: 'syntax.site' },
  { insert: '-site:', label: '-site:', descriptionKey: 'syntax.excludeSite' },
  { insert: '""', label: '"…"', descriptionKey: 'syntax.phrase', caretOffset: 1 },
  { insert: '-""', label: '-"…"', descriptionKey: 'syntax.excludePhrase', caretOffset: 2 },
  { insert: 'lang:', label: 'lang:', descriptionKey: 'syntax.completion.lang' },
  { insert: 'after:', label: 'after:', descriptionKey: 'syntax.after' },
  { insert: 'before:', label: 'before:', descriptionKey: 'syntax.before' }
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
 * - 空 token（字段为空、刚敲完空格、退格删到片段开头）→ 列出全部运算符，作为默认展开的提示；
 * - 还没写冒号 → 按前缀补全运算符（`s` → `site:`，`-` → `-site:` / `-"…"`）；
 * - 写了冒号且在候选表里 → 按前缀补全值（`lang:z` → `lang:zh`）。
 * 其余情况（自由文本、`site:` 这类没有值表的运算符）返回空列表，避免在用户写作时插话。
 */
export function completeQuery(query: string, caret: number): SyntaxCompletion {
  const token = activeTokenAt(query, caret)
  const typed = token.text.toLowerCase()

  if (!typed) return { token, items: OPERATORS }

  const colon = typed.indexOf(':')
  if (colon === -1) {
    return {
      token,
      // 已经完全写出的运算符不再提示，避免插入后候选原地不动。
      items: OPERATORS.filter(item => item.insert.toLowerCase().startsWith(typed) && item.insert !== token.text)
    }
  }

  const key = typed.slice(0, colon)
  const table = VALUE_TABLES[key]
  if (!table) return { token, items: [] }

  const typedValue = typed.slice(colon + 1)
  const items = table
    .filter(entry => entry.value.toLowerCase().startsWith(typedValue))
    .map(entry => ({
      insert: `${key}:${entry.value}`,
      label: `${key}:${entry.value}`,
      descriptionKey: entry.descriptionKey,
      descriptionParams: entry.descriptionParams
    }))
  return { token, items: items.filter(item => item.insert !== token.text) }
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
