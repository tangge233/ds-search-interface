import { describe, expect, it } from 'vitest'
import { normalizeResults } from '~/utils/search-contract'
import { SearchContractError } from '~/utils/search-error'

const validItem = {
  rerank_score: 2.5,
  title: '标题',
  url: 'https://example.com/a',
  snippet: '摘要',
  summary: '长摘要',
  content: '',
  site_name: 'Example',
  site_icon: 'https://example.com/favicon.ico',
  date: '2026-01-02T03:04:05Z',
  authority: 3
}

/** 取出契约错误的原因码；不是契约错误则返回 undefined。 */
function reasonOf(payload: unknown): string | undefined {
  try {
    normalizeResults(payload)
  } catch (error) {
    if (error instanceof SearchContractError) return error.reason
  }
  return undefined
}

describe('normalizeResults', () => {
  it('透出文档里声明的字段', () => {
    expect(normalizeResults({ results: [validItem] })).toEqual([validItem])
  })

  it('缺字段时补渲染安全的默认值', () => {
    expect(normalizeResults({ results: [{ url: 'https://example.com/a' }] })).toEqual([
      {
        url: 'https://example.com/a',
        title: '',
        snippet: '',
        summary: '',
        content: '',
        rerank_score: 0,
        authority: -1,
        site_name: null,
        site_icon: null,
        date: null
      }
    ])
  })

  it('字段类型不符时降级而不是把畸形值传给模板', () => {
    const [item] = normalizeResults({
      results: [{ url: 'https://example.com/a', rerank_score: 'abc', authority: 'high', title: 42 }]
    })

    expect(item).toMatchObject({ rerank_score: 0, authority: -1, title: '' })
  })

  it('丢弃没有 url 的条目与非对象条目', () => {
    const items = normalizeResults({
      results: [null, 'https://example.com', { title: '无链接' }, { url: 'https://example.com/a' }]
    })

    expect(items).toHaveLength(1)
    expect(items[0]?.url).toBe('https://example.com/a')
  })

  it('空结果数组是合法响应', () => {
    expect(normalizeResults({ results: [] })).toEqual([])
  })

  it('顶层不是对象或缺少 results 时抛契约错误', () => {
    for (const payload of [undefined, null, 'text', {}, { results: 'nope' }, []]) {
      expect(() => normalizeResults(payload)).toThrow(SearchContractError)
    }
  })

  it('有条目但一条都留不下时抛契约错误，而不是伪装成空结果', () => {
    expect(() => normalizeResults({ results: [{ title: 'a' }, { title: 'b' }] })).toThrow(SearchContractError)
  })

  it('契约错误带上可翻译的原因码', () => {
    expect(reasonOf({ results: 'nope' })).toBe('resultsNotArray')
    expect(reasonOf({ results: [{ title: 'a' }] })).toBe('itemsMissingUrl')
    expect(reasonOf({})).toBe('missingResults')
  })
})
