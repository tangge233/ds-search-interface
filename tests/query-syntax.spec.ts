import { describe, expect, it } from 'vitest'
import { activeTokenAt, applyCompletion, completeQuery } from '~/utils/query-syntax'

const inserts = (query: string, caret: number) => completeQuery(query, caret).items.map(item => item.insert)

describe('activeTokenAt', () => {
  it('返回光标所在片段', () => {
    expect(activeTokenAt('site:git', 8)).toEqual({ start: 0, end: 8, text: 'site:git' })
    expect(activeTokenAt('vllm 部署', 2)).toEqual({ start: 0, end: 4, text: 'vllm' })
  })

  it('光标越界时夹到字符串两端', () => {
    expect(activeTokenAt('vllm', 99)).toEqual({ start: 0, end: 4, text: 'vllm' })
    // 负数夹到 0，返回光标所在的那个 token。
    expect(activeTokenAt('vllm', -3)).toEqual({ start: 0, end: 4, text: 'vllm' })
  })
})

describe('completeQuery', () => {
  it('按已输入的前缀补全运算符', () => {
    expect(inserts('vllm si', 7)).toEqual(['site:'])
    expect(inserts('vllm -', 6)).toEqual(['-site:', '-""'])
  })

  it('已经完整写出的运算符不再提示', () => {
    expect(inserts('vllm site:', 10)).toEqual([])
  })

  it('冒号后按值表补全', () => {
    expect(inserts('lang:z', 6)).toEqual(['lang:zh'])
    expect(inserts('lang:', 5)).toHaveLength(8)
  })

  it('没有值表的运算符交给用户自由输入', () => {
    expect(completeQuery('site:github.com', 15)).toEqual({ token: null, items: [] })
  })

  it('自由文本里不插话', () => {
    expect(inserts('vllm 部署', 7)).toEqual([])
    expect(completeQuery('', 0)).toEqual({ token: null, items: [] })
  })
})

describe('applyCompletion', () => {
  it('替换当前 token 并把光标放到插入内容末尾', () => {
    const token = { start: 5, end: 7, text: 'si' }
    expect(applyCompletion('vllm si 部署', token, { insert: 'site:', label: 'site:', description: '' })).toEqual({
      query: 'vllm site: 部署',
      caret: 10
    })
  })

  it('引号类候选把光标落在引号中间', () => {
    const token = { start: 0, end: 1, text: '"' }
    expect(
      applyCompletion('"', token, { insert: '""', label: '"…"', description: '', caretOffset: 1 })
    ).toEqual({ query: '""', caret: 1 })
  })
})
