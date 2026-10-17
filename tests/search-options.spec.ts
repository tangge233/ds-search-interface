import { describe, expect, it } from 'vitest'
import { applyViewOptions, validateSearchInput } from '~/utils/search-options'

describe('validateSearchInput', () => {
  it('拒绝空白搜索词', () => {
    expect(validateSearchInput({ query: '   ' })).toBe('请输入搜索词。')
  })

  it('按码点而非 UTF-16 单元计算长度', () => {
    expect(validateSearchInput({ query: 'a'.repeat(128) })).toBeNull()
    expect(validateSearchInput({ query: 'a'.repeat(129) })).toContain('最多 128')
    // 每个 emoji 是一个码点，但占两个 UTF-16 单元。
    expect(validateSearchInput({ query: '😀'.repeat(128) })).toBeNull()
    expect(validateSearchInput({ query: '😀'.repeat(129) })).toContain('最多 128')
  })

  it('限制原始问题长度', () => {
    expect(validateSearchInput({ query: 'a', oriQuestion: 'b'.repeat(129) })).toContain('128')
    expect(validateSearchInput({ query: 'a', oriQuestion: 'b'.repeat(128) })).toBeNull()
  })

  it('接受合法 IPv4 / IPv6', () => {
    for (const localization of ['203.0.113.10', '255.255.255.255', '0.0.0.0', '::1', '2001:db8::1', '::ffff:192.168.0.1']) {
      expect(validateSearchInput({ query: 'a', localization })).toBeNull()
    }
  })

  it('拒绝越界段、前导零与畸形 IPv6', () => {
    for (const localization of ['999.999.999.999', '256.0.0.1', '01.2.3.4', '1.2.3', '1.2.3.4.5', '::::', '12345::1', '2001:db8:::1']) {
      expect(validateSearchInput({ query: 'a', localization })).toContain('本地化 IP')
    }
  })

  it('本地化 IP 留空表示不指定', () => {
    expect(validateSearchInput({ query: 'a', localization: '   ' })).toBeNull()
  })
})

describe('applyViewOptions', () => {
  const items = [
    { id: 'low', rerank_score: 1, authority: 4, date: null },
    { id: 'top', rerank_score: 2, authority: 2, date: '2025-01-01T00:00:00Z' },
    { id: 'good', rerank_score: 1.6, authority: -1, date: '2026-01-01T00:00:00Z' }
  ]
  const ids = (list: { id: string }[]) => list.map(item => item.id)

  it('只保留相关度 ≥ 1.5 的优质结果', () => {
    expect(ids(applyViewOptions(items, { onlyQuality: true, sort: 'relevance' }))).toEqual(['top', 'good'])
  })

  it('相关度排序保持接口返回顺序', () => {
    expect(ids(applyViewOptions(items, { onlyQuality: false, sort: 'relevance' }))).toEqual(['low', 'top', 'good'])
  })

  it('权威性优先，未知值排在最后', () => {
    expect(ids(applyViewOptions(items, { onlyQuality: false, sort: 'authority' }))).toEqual(['low', 'top', 'good'])
  })

  it('时间优先，缺失日期排在最后', () => {
    expect(ids(applyViewOptions(items, { onlyQuality: false, sort: 'date' }))).toEqual(['good', 'top', 'low'])
  })

  it('权威性相同时用相关度兜底', () => {
    const tied = [
      { id: 'a', rerank_score: 1.2, authority: 3, date: null },
      { id: 'b', rerank_score: 2.4, authority: 3, date: null }
    ]
    expect(ids(applyViewOptions(tied, { onlyQuality: false, sort: 'authority' }))).toEqual(['b', 'a'])
  })

  it('不改动入参', () => {
    const input = [...items]
    applyViewOptions(input, { onlyQuality: false, sort: 'date' })
    expect(input).toEqual(items)
  })
})
