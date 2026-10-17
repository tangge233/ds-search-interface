import { COUNT_OPTIONS, LAYOUT_OPTIONS, LOCALIZATION_MODE_OPTIONS, SORT_OPTIONS } from '~/utils/search-presets'

/**
 * 参数选项的展示文案。
 * presets 只存 labelKey，这里统一展开成 t() 之后的结果，
 * 工具栏与设置弹窗因此不会各自翻译一遍而逐渐分叉。
 */
export function usePresetItems() {
  const { t } = useI18n()

  const countItems = computed(() =>
    COUNT_OPTIONS.map(value => ({ value, label: t('preset.countOption', { count: value }) }))
  )
  const sortItems = computed(() => SORT_OPTIONS.map(option => ({ value: option.value, label: t(option.labelKey) })))
  const layoutItems = computed(() =>
    LAYOUT_OPTIONS.map(option => ({ value: option.value, label: t(option.labelKey) }))
  )
  const localizationModeItems = computed(() =>
    LOCALIZATION_MODE_OPTIONS.map(option => ({ value: option.value, label: t(option.labelKey) }))
  )

  return { countItems, sortItems, layoutItems, localizationModeItems }
}
