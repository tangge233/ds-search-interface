import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { APP_LOCALES, matchLocale } from '~/utils/locales'

/**
 * 语言文件的一致性测试。缺 key 或漏写插值参数在运行时只会显示成 key 本身，
 * 很难在界面里一眼看出来，所以在测试里守住：
 * - 语言注册表与语言文件一一对应（直接扫描目录，新增文件不会被漏掉）；
 * - 浏览器语言偏好按顺序匹配到已支持的语言；
 * - 所有语言的 key 集合完全相同；
 * - 每条文案都能被 vue-i18n 解析（包括数字状态码这种路径）；
 * - 插值占位符各语言一致，且填值后不残留花括号。
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

const localeDir = fileURLToPath(new URL('../i18n/locales', import.meta.url))
const catalogues: Record<string, Messages> = Object.fromEntries(
  readdirSync(localeDir)
    .filter(name => name.endsWith('.json'))
    .map(name => [
      name.replace(/\.json$/, ''),
      JSON.parse(readFileSync(join(localeDir, name), 'utf8')) as Messages
    ])
)
const referenceEntries = flatten(catalogues.en!)
const allParams = {
  count: 3,
  query: 'q',
  score: '1.5',
  level: 2,
  year: 2026,
  seconds: '0.4',
  status: 401,
  message: 'boom',
  language: 'English'
}

describe('浏览器语言匹配', () => {
  it('按偏好顺序选择第一个支持的语言', () => {
    expect(matchLocale(['ja-JP', 'en-US'])).toBe('ja')
    expect(matchLocale(['FR-ca', 'en-US'])).toBe('fr')
    expect(matchLocale(['pt-BR', 'de-DE', 'en-US'])).toBe('de')
  })

  it('中文统一匹配到简体中文', () => {
    expect(matchLocale(['zh-TW', 'en-US'])).toBe('zh-CN')
    expect(matchLocale(['zh'])).toBe('zh-CN')
  })

  it('没有匹配的语言时回退英文', () => {
    expect(matchLocale(['pt-BR'])).toBe('en')
    expect(matchLocale([])).toBe('en')
  })
})

describe('语言文件', () => {
  it('APP_LOCALES 与语言文件一一对应', () => {
    expect(Object.keys(catalogues).sort()).toEqual(APP_LOCALES.map(locale => locale.code).sort())
  })

  it('所有语言的 key 集合一致', () => {
    for (const [locale, messages] of Object.entries(catalogues)) {
      expect(flatten(messages).map(([key]) => key), locale).toEqual(referenceEntries.map(([key]) => key))
    }
  })

  it('没有空文案', () => {
    for (const [locale, messages] of Object.entries(catalogues)) {
      for (const [key, text] of flatten(messages)) {
        expect(text.trim(), `${locale}:${key}`).not.toBe('')
      }
    }
  })

  it('同一 key 的插值占位符一致', () => {
    const reference = Object.fromEntries(referenceEntries) as Record<string, string>
    for (const [locale, messages] of Object.entries(catalogues)) {
      for (const [key, text] of flatten(messages)) {
        expect(placeholders(text), `${locale}:${key}`).toEqual(placeholders(reference[key]!))
      }
    }
  })

  it('每条文案都能被 vue-i18n 解析并完成插值', () => {
    for (const [locale, messages] of Object.entries(catalogues)) {
      const i18n = createI18n({ legacy: false, locale, messages: { [locale]: messages } })
      for (const [key] of referenceEntries) {
        const text = i18n.global.t(key, allParams)
        expect(text, `${locale}:${key}`).not.toBe(key)
        expect(text, `${locale}:${key}`).not.toMatch(/[{}]/)
      }
    }
  })
})
