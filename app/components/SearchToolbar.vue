<script setup lang="ts">
/**
 * 搜索选项行：与搜索框同列对齐，横向排布而不是侧栏，
 * 这样结果区可以占满整列宽度。「高级语法生成器」用浮动面板展开，不挤压已有内容。
 *
 * 这里的控件只改 queryOptions（本次会话的临时值），不会写到设置里：
 * 临时换个条数不该变成以后每次搜索的默认值。
 */
const props = defineProps<{ currentQuery: string }>()

const emit = defineEmits<{ apply: [string] }>()

const { t } = useI18n()
const { queryOptions, resetQueryOptions } = useSearchSettings()
const { countItems, sortItems } = usePresetItems()

/** 原始问题属于单次查询，由页面持有后传进来。 */
const oriQuestion = defineModel<string>('oriQuestion', { default: '' })

/** 生成搜索词后先收起浮动面板，再交给页面执行搜索。 */
function onApply(close: () => void, value: string) {
  close()
  emit('apply', value)
}
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2.5">
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted">{{ t('search.countLabel') }}</span>
        <USelect
          v-model="queryOptions.count"
          :items="countItems"
          size="sm"
          class="w-32"
          :aria-label="t('search.countAria')"
        />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-muted">{{ t('search.sortLabel') }}</span>
        <USelect
          v-model="queryOptions.sort"
          :items="sortItems"
          size="sm"
          class="w-28"
          :aria-label="t('search.sortAria')"
        />
      </div>

      <USwitch
        v-model="queryOptions.needContent"
        size="sm"
        :label="t('search.needContent')"
        :aria-label="t('search.needContentAria')"
      />
      <USwitch
        v-model="queryOptions.onlyQuality"
        size="sm"
        :label="t('search.onlyQuality')"
        :aria-label="t('search.onlyQualityAria')"
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
            :label="t('search.advanced')"
          />
          <template #content="{ close }">
            <AdvancedQueryPanel
              v-model:ori-question="oriQuestion"
              :current-query="props.currentQuery"
              @apply="value => onApply(close, value)"
            />
          </template>
        </UPopover>

        <UTooltip :text="t('search.resetTooltip')">
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-rotate-ccw"
            :aria-label="t('search.resetAria')"
            @click="resetQueryOptions"
          />
        </UTooltip>
      </div>
    </div>

    <p class="text-xs text-dimmed">{{ t('search.scopeHint') }}</p>
  </div>
</template>
