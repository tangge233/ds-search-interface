<script setup lang="ts">
import { EMPTY_BUILDER_FIELDS, buildQuery, parseQuery } from '~/utils/query-builder'
import type { QueryBuilderFields } from '~/utils/query-builder'

/**
 * 高级语法生成器：把结构化条件拼成搜索词。
 * 作为浮动面板内容使用，自身只负责「固定头尾 + 中间滚动」的骨架：
 * 头部操作按钮与底部「写入并搜索」始终可见，中间的字段区和语法速查独立滚动，
 * 展开语法速查也不会把按钮挤出可视范围。
 *
 * 解析是「尽力而为」的：认不出的片段原样留在「全部关键词」里，
 * 而且只在用户点「从搜索框解析」时才回填，避免悄悄改写已写好的查询。
 */
const props = defineProps<{ currentQuery: string }>()

const emit = defineEmits<{ apply: [string] }>()

const { prefs } = useSearchSettings()
const oriQuestion = defineModel<string>('oriQuestion', { default: '' })

const fields = reactive<QueryBuilderFields>({ ...EMPTY_BUILDER_FIELDS })
const showSyntax = ref(false)

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
</script>

<template>
  <div class="flex max-h-[70vh] flex-col">
    <header class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default px-4 py-3">
      <h2 class="text-sm font-medium text-highlighted">高级语法生成器</h2>
      <div class="ms-auto flex flex-wrap items-center gap-1">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-text-search"
          label="从搜索框解析"
          @click="fillFromQuery"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-eraser"
          label="清空条件"
          @click="clearFields"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-book-open"
          label="语法速查"
          :aria-expanded="showSyntax"
          @click="showSyntax = !showSyntax"
        />
      </div>
    </header>

    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 pe-3 [scrollbar-gutter:stable]">
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="全部关键词" class="sm:col-span-2">
          <UInput v-model="fields.keywords" placeholder="空格分隔，结果需全部包含" class="w-full" />
        </UFormField>
        <UFormField label="精确短语">
          <UInput v-model="fields.phrase" placeholder="整句匹配" class="w-full" />
        </UFormField>
        <UFormField label="排除关键词">
          <UInput v-model="fields.excludeKeywords" placeholder="广告 推广" class="w-full" />
        </UFormField>
        <UFormField label="排除短语">
          <UInput v-model="fields.excludePhrase" placeholder="release notes" class="w-full" />
        </UFormField>
        <UFormField label="限定站点" help="多个站点自动用 OR 连接">
          <UInput v-model="fields.site" placeholder="github.com huggingface.co" class="w-full" />
        </UFormField>
        <UFormField label="排除站点">
          <UInput v-model="fields.excludeSite" placeholder="example.com" class="w-full" />
        </UFormField>
        <UFormField label="语言" help="逗号分隔，生成 lang:zh,en">
          <UInput v-model="fields.lang" placeholder="zh,en" class="w-full" />
        </UFormField>
        <UFormField label="起始时间" help="生成 after:">
          <UInput v-model="fields.after" placeholder="2025 或 2025-01-01" class="w-full" />
        </UFormField>
        <UFormField label="结束时间" help="生成 before:">
          <UInput v-model="fields.before" placeholder="2026" class="w-full" />
        </UFormField>
      </div>

      <div class="rounded-lg bg-muted px-3 py-2">
        <p class="text-xs text-dimmed">生成的搜索词</p>
        <p class="mt-1 break-all font-mono text-sm text-toned">
          {{ preview || '（还没有填写任何条件）' }}
        </p>
      </div>

      <SearchSyntaxList v-if="showSyntax" @use="value => emit('apply', value)" />

      <div class="grid gap-3 border-t border-default pt-4 sm:grid-cols-2">
        <UFormField
          label="原始问题"
          hint="可选"
          help="≤128 字符，帮助服务端理解搜索意图"
          class="sm:col-span-2"
        >
          <UInput v-model="oriQuestion" placeholder="例如：怎么在生产环境部署 vLLM？" class="w-full" />
        </UFormField>
        <UFormField label="本地化 IP" hint="可选" help="让结果偏向该地区，留空表示不指定">
          <UInput v-model="prefs.localization" placeholder="203.0.113.10" class="w-full" />
        </UFormField>
      </div>
    </div>

    <footer class="flex shrink-0 flex-wrap items-center gap-2 border-t border-default px-4 py-3">
      <UButton
        size="sm"
        icon="i-lucide-corner-down-right"
        label="写入并搜索"
        :disabled="!preview"
        @click="apply"
      />
      <span class="text-xs text-dimmed">写入后会替换搜索框内容并立即搜索。</span>
    </footer>
  </div>
</template>
