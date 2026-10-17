<script setup lang="ts">
import { EMPTY_BUILDER_FIELDS, buildQuery, parseQuery } from '~/utils/query-builder'
import type { QueryBuilderFields } from '~/utils/query-builder'

/**
 * 高级语法生成器：把结构化条件拼成搜索词。
 * 作为浮动面板内容使用，自身只负责「固定头尾 + 中间滚动」的骨架：
 * 头部操作按钮与底部「写入并搜索」始终可见，中间的字段区独立滚动，
 * 字段再多也不会把按钮挤出可视范围。语法用法见右上角「使用提示」。
 *
 * 解析是「尽力而为」的：认不出的片段原样留在「全部关键词」里，
 * 而且只在用户点「从搜索框解析」时才回填，避免悄悄改写已写好的查询。
 */
const props = defineProps<{ currentQuery: string }>()

const emit = defineEmits<{ apply: [string] }>()

const { t } = useI18n()
const { prefs } = useSearchSettings()
const { detecting, failed, setMode } = useLocalizationIp()
const { localizationModeItems } = usePresetItems()
const oriQuestion = defineModel<string>('oriQuestion', { default: '' })

const fields = reactive<QueryBuilderFields>({ ...EMPTY_BUILDER_FIELDS })

const preview = computed(() => buildQuery(fields))

function apply() {
  if (preview.value) emit('apply', preview.value)
}

function fillFromQuery() {
  Object.assign(fields, parseQuery(props.currentQuery))
}

function clearFields() {
  Object.assign(fields, EMPTY_BUILDER_FIELDS)
}

/** URadioGroup 的值类型是联合类型，收窄后交给 setMode，避免在模板里断言。 */
function onModeChange(value: unknown) {
  if (value === 'auto' || value === 'custom') void setMode(value)
}
</script>

<template>
  <div class="flex max-h-[70vh] flex-col">
    <header class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default px-4 py-3">
      <h2 class="text-sm font-medium text-highlighted">{{ t('advanced.title') }}</h2>
      <div class="ms-auto flex flex-wrap items-center gap-1">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-text-search"
          :label="t('advanced.parse')"
          @click="fillFromQuery"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-eraser"
          :label="t('advanced.clearFields')"
          @click="clearFields"
        />
      </div>
    </header>

    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 pe-3 [scrollbar-gutter:stable]">
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField :label="t('advanced.keywords')" class="sm:col-span-2">
          <UInput v-model="fields.keywords" :placeholder="t('advanced.keywordsPlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="t('advanced.phrase')">
          <UInput v-model="fields.phrase" :placeholder="t('advanced.phrasePlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="t('advanced.excludeKeywords')">
          <UInput v-model="fields.excludeKeywords" :placeholder="t('advanced.excludeKeywordsPlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="t('advanced.excludePhrase')">
          <UInput v-model="fields.excludePhrase" :placeholder="t('advanced.excludePhrasePlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="t('advanced.site')" :help="t('advanced.siteHelp')">
          <UInput v-model="fields.site" :placeholder="t('advanced.sitePlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="t('advanced.excludeSite')">
          <UInput v-model="fields.excludeSite" :placeholder="t('advanced.excludeSitePlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="t('advanced.lang')" :help="t('advanced.langHelp')">
          <UInput v-model="fields.lang" :placeholder="t('advanced.langPlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="t('advanced.after')" :help="t('advanced.afterHelp')">
          <UInput v-model="fields.after" :placeholder="t('advanced.afterPlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="t('advanced.before')" :help="t('advanced.beforeHelp')">
          <UInput v-model="fields.before" :placeholder="t('advanced.beforePlaceholder')" class="w-full" />
        </UFormField>
      </div>

      <div class="rounded-lg bg-muted px-3 py-2">
        <p class="text-xs text-dimmed">{{ t('advanced.previewLabel') }}</p>
        <p class="mt-1 break-all font-mono text-sm text-toned">
          {{ preview || t('advanced.previewEmpty') }}
        </p>
      </div>

      <div class="grid gap-3 border-t border-default pt-4 sm:grid-cols-2">
        <UFormField
          :label="t('advanced.oriQuestion')"
          :hint="t('advanced.optional')"
          :help="t('advanced.oriQuestionHelp')"
          class="sm:col-span-2"
        >
          <UInput v-model="oriQuestion" :placeholder="t('advanced.oriQuestionPlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="t('advanced.localization')" :hint="t('advanced.optional')">
          <div class="space-y-2.5">
            <URadioGroup
              :model-value="prefs.localizationMode"
              :items="localizationModeItems"
              orientation="horizontal"
              @update:model-value="onModeChange"
            />

            <template v-if="prefs.localizationMode === 'custom'">
              <UInput
                v-model="prefs.localization"
                :placeholder="t('advanced.localizationPlaceholder')"
                class="w-full"
              />
              <p class="text-xs text-dimmed">{{ t('localization.customHelp') }}</p>
            </template>

            <template v-else>
              <p v-if="prefs.localization" class="font-mono text-sm text-toned">{{ prefs.localization }}</p>
              <p v-if="detecting" class="text-xs text-dimmed">{{ t('localization.autoDetecting') }}</p>
              <p v-else-if="failed" class="text-xs text-error">
                {{ prefs.localization ? t('localization.autoFailedKeep') : t('localization.autoFailedNone') }}
              </p>
              <p v-else class="text-xs text-dimmed">{{ t('localization.autoHelp') }}</p>
            </template>
          </div>
        </UFormField>
      </div>
    </div>

    <footer class="flex shrink-0 flex-wrap items-center gap-2 border-t border-default px-4 py-3">
      <UButton
        size="sm"
        icon="i-lucide-corner-down-right"
        :label="t('advanced.apply')"
        :disabled="!preview"
        @click="apply"
      />
      <span class="text-xs text-dimmed">{{ t('advanced.applyHint') }}</span>
    </footer>
  </div>
</template>
