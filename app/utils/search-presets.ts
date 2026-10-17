import type { SelectItem } from '@nuxt/ui'

/**
 * 搜索参数选项表。工具栏与设置弹窗共用同一份，避免两处标签各写一套后逐渐分叉。
 */

export const COUNT_OPTIONS: SelectItem[] = [
  { label: '10 条', value: 10 },
  { label: '20 条', value: 20 },
  { label: '30 条', value: 30 },
  { label: '50 条', value: 50 }
]

export const SORT_OPTIONS: SelectItem[] = [
  { label: '相关度', value: 'relevance' },
  { label: '权威性优先', value: 'authority' },
  { label: '发布时间优先', value: 'date' }
]

export const LAYOUT_OPTIONS: SelectItem[] = [
  { label: '居中单列', value: 'center' },
  { label: '靠左单列', value: 'left' },
  { label: '宽屏多列', value: 'columns' }
]
