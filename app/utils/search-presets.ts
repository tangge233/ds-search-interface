import type { SearchSortKey } from '~/types/search'

/**
 * 搜索参数选项表。工具栏与设置弹窗共用同一份，避免两处标签各写一套后逐渐分叉。
 * 选项只带 i18n key，展示文案由使用方用 t() 展开——工具层不绑死任何一种语言。
 */

/** 结果区布局：居中单列 / 靠左单列 / 宽屏多列。 */
export type ResultsLayout = 'center' | 'left' | 'columns'

export interface PresetOption<T> {
  value: T
  labelKey: string
}

/** 返回条数只需要数字：文案统一由 preset.countOption 插值生成。 */
export const COUNT_OPTIONS = [10, 20, 30, 50]

export const SORT_OPTIONS: PresetOption<SearchSortKey>[] = [
  { value: 'relevance', labelKey: 'preset.sort.relevance' },
  { value: 'authority', labelKey: 'preset.sort.authority' },
  { value: 'date', labelKey: 'preset.sort.date' }
]

export const LAYOUT_OPTIONS: PresetOption<ResultsLayout>[] = [
  { value: 'center', labelKey: 'preset.layout.center' },
  { value: 'left', labelKey: 'preset.layout.left' },
  { value: 'columns', labelKey: 'preset.layout.columns' }
]
