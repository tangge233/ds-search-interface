import { describe, expect, it } from 'vitest'
import { buildQuery, EMPTY_BUILDER_FIELDS, parseQuery } from '~/utils/query-builder'

describe('buildQuery', () => {
  it('按文档顺序拼接：关键词 → 短语 → 排除 → 站点 → 语言 → 时间', () => {
    expect(
      buildQuery({
        keywords: 'vllm 部署',
        phrase: 'release notes',
        excludeKeywords: '广告，推广',
        excludePhrase: 'spam',
        site: 'github.com huggingface.co',
        excludeSite: 'example.com',
        lang: 'zh,en',
        after: '2025',
        before: '2026'
      })
    ).toBe(
      'vllm 部署 "release notes" -广告 -推广 -"spam" site:github.com OR site:huggingface.co -site:example.com lang:zh,en after:2025 before:2026'
    )
  })

  it('剥掉用户自带的前缀与引号，避免重复生成运算符', () => {
    expect(buildQuery({ ...EMPTY_BUILDER_FIELDS, phrase: '"精确短语"', after: 'after:2025' })).toBe(
      '"精确短语" after:2025'
    )
  })

  it('空条件不产生多余空格', () => {
    expect(buildQuery({ ...EMPTY_BUILDER_FIELDS, keywords: '  deepseek  ' })).toBe('deepseek')
    expect(buildQuery(EMPTY_BUILDER_FIELDS)).toBe('')
  })
})

describe('parseQuery', () => {
  it('识别运算符并保留其余关键词', () => {
    expect(parseQuery('vllm 部署 site:github.com -site:evil.com -广告 lang:zh after:2025')).toMatchObject({
      keywords: 'vllm 部署',
      site: 'github.com',
      excludeSite: 'evil.com',
      excludeKeywords: '广告',
      lang: 'zh',
      after: '2025'
    })
  })

  it('去掉自己生成的 OR 连接符，多站点回到同一个字段', () => {
    expect(parseQuery('site:a.com OR site:b.com')).toMatchObject({ site: 'a.com b.com', keywords: '' })
  })

  it('引号内的空格属于同一个 token', () => {
    expect(parseQuery('教程 "release notes"')).toMatchObject({
      keywords: '教程',
      phrase: 'release notes'
    })
  })

  it('重复的单值条件退回关键词，不丢条件', () => {
    const fields = parseQuery('after:2025 after:2024 before:2026 before:2023')
    expect(fields).toMatchObject({ after: '2025', before: '2026', keywords: 'after:2024 before:2023' })
  })

  it('无法识别的写法原样留在关键词里', () => {
    expect(parseQuery('foo:bar vllm')).toMatchObject({ keywords: 'foo:bar vllm' })
  })

  it('parseQuery → buildQuery → parseQuery 稳定', () => {
    const query =
      'vllm 部署 "release notes" -广告 -"spam" site:a.com OR site:b.com -site:evil.com lang:zh,en after:2025 before:2026'
    const once = parseQuery(query)
    expect(parseQuery(buildQuery(once))).toEqual(once)
  })
})
