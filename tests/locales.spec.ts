import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import en from '../i18n/locales/en.json'
import zhCN from '../i18n/locales/zh-CN.json'

/**
 * 语言文件的一致性测试。缺 key 或漏写插值参数在运行时只会显示成 key 本身，
 * 很难在界面里一眼看出来，所以在测试里守住：
 * - 两种语言的 key 集合完全相同；
 * - 每条文案都能被 vue-i18n 解析（包括数字状态码这种路径）；
 * - 插值占位符两种语言一致，且填值后不残留花括号。
 */

type Messages = Record<string, unknown>

function flatten(messages: Messages, prefix = ''): [string, string][] {
  const entries: [string, string][] = []
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') entries.push([path, value])
    else if (value && typeof value === 'object') entries.push(...flatten(value as Messages, path))
    else entries.push([path, String(value)])
  }
  return entries.sort(([a], [b]) => a.localeCompare(b))
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]!).sort()
}

const catalogues = { 'zh-CN': zhCN, en } as const
const zhEntries = flatten(zhCN)
const enEntries = flatten(en)
const allParams = {
  count: 3,
  query: 'q',
  score: '1.5',
  level: 2,
  year: 2026,
  seconds: '0.4',
  status: 401,
  message: 'boom'
}

describe('语言文件', () => {
  it('两种语言的 key 集合一致', () => {
    expect(enEntries.map(([key]) => key)).toEqual(zhEntries.map(([key]) => key))
  })

  it('没有空文案', () => {
    for (const [locale, entries] of Object.entries({ zh: zhEntries, en: enEntries })) {
      for (const [key, text] of entries) {
        expect(text.trim(), `${locale}:${key}`).not.toBe('')
      }
    }
  })

  it('同一 key 的插值占位符一致', () => {
    const zhByKey = Object.fromEntries(zhEntries) as Record<string, string>
    for (const [key, text] of enEntries) {
      expect(placeholders(text), key).toEqual(placeholders(zhByKey[key]!))
    }
  })

  it('每条文案都能被 vue-i18n 解析并完成插值', () => {
    for (const [locale, messages] of Object.entries(catalogues)) {
      const i18n = createI18n({ legacy: false, locale, messages: { [locale]: messages } })
      for (const [key] of zhEntries) {
        const text = i18n.global.t(key, allParams)
        expect(text, `${locale}:${key}`).not.toBe(key)
        expect(text, `${locale}:${key}`).not.toMatch(/[{}]/)
      }
    }
  })
})
