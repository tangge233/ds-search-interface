<script setup lang="ts">
import { COUNT_OPTIONS, SORT_OPTIONS } from '~/utils/search-presets'

/**
 * 搜索选项行：与搜索框同列对齐，横向排布而不是侧栏，
 * 这样结果区可以占满整列宽度。「高级语法生成器」用浮动面板展开，不挤压已有内容。
 */
const props = defineProps<{ currentQuery: string }>()

const emit = defineEmits<{ apply: [string] }>()

const { prefs, resetPrefs } = useSearchSettings()

/** 原始问题属于单次查询，由页面持有后传进来。 */
const oriQuestion = defineModel<string>('oriQuestion', { default: '' })

/** 生成搜索词后先收起浮动面板，再交给页面执行搜索。 */
function onApply(close: () => void, value: string) {
  close()
  emit('apply', value)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-5 gap-y-2.5">
    <div class="flex items-center gap-2">
      <span class="text-xs text-muted">条数</span>
      <USelect
        v-model="prefs.count"
        :items="COUNT_OPTIONS"
        size="sm"
        class="w-24"
        aria-label="返回条数"
      />
    </div>

    <div class="flex items-center gap-2">
      <span class="text-xs text-muted">排序</span>
      <USelect
        v-model="prefs.sort"
        :items="SORT_OPTIONS"
        size="sm"
        class="w-28"
        aria-label="排序方式"
      />
    </div>

    <USwitch
      v-model="prefs.needContent"
      size="sm"
      label="返回正文"
      aria-label="返回网页正文"
    />
    <USwitch
      v-model="prefs.onlyQuality"
      size="sm"
      label="仅优质结果"
      aria-label="只看相关度不低于 1.5 的结果"
    />

    <div class="ms-auto flex items-center gap-1">
      <UPopover
        :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
        :ui="{ content: 'floating-panel w-[min(44rem,calc(100vw-2rem))] overflow-hidden p-0' }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-sliders-horizontal"
          label="高级语法"
        />
        <template #content="{ close }">
          <AdvancedQueryPanel
            v-model:ori-question="oriQuestion"
            :current-query="props.currentQuery"
            @apply="value => onApply(close, value)"
          />
        </template>
      </UPopover>

      <UTooltip text="恢复默认参数（条数、排序、开关、本地化 IP）">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-rotate-ccw"
          aria-label="恢复默认参数"
          @click="resetPrefs"
        />
      </UTooltip>
    </div>
  </div>
</template>
