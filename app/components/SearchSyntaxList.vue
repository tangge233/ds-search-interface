<script setup lang="ts">
/**
 * 搜索语法速查。运算符由 API 原样透传给搜索服务，
 * 因此这里既是文档也是可点击的示例：点示例即把完整查询填进搜索框。
 */
const emit = defineEmits<{ use: [string] }>()

const { t } = useI18n()

/** 运算符本身与示例查询都是 API 语法，不翻译；只有解释文案走 i18n。 */
const OPERATORS = [
  { syntax: 'site:', meaningKey: 'syntax.site', example: 'vLLM 部署 site:github.com' },
  { syntax: '-site:', meaningKey: 'syntax.excludeSite', example: 'DeepSeek -site:example.com' },
  { syntax: '"…"', meaningKey: 'syntax.phrase', example: 'DeepSeek "精确短语"' },
  { syntax: '-…', meaningKey: 'syntax.excludeKeyword', example: 'DeepSeek -广告' },
  { syntax: '-"…"', meaningKey: 'syntax.excludePhrase', example: 'DeepSeek -"release notes"' },
  { syntax: 'lang:', meaningKey: 'syntax.lang', example: '模型 发布 lang:zh,en' },
  { syntax: 'after:', meaningKey: 'syntax.after', example: 'DeepSeek 发布 after:2025-01-01' },
  { syntax: 'before:', meaningKey: 'syntax.before', example: 'DeepSeek 发布 before:2026' }
]
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-default">
    <h3 class="border-b border-default bg-muted px-4 py-2.5 text-xs font-medium text-toned">
      {{ t('syntax.listTitle') }}
    </h3>
    <dl class="divide-y divide-default">
      <div v-for="op in OPERATORS" :key="op.syntax" class="px-4 py-3">
        <dt class="flex items-baseline gap-2">
          <code class="font-mono text-sm text-primary">{{ op.syntax }}</code>
          <span class="text-xs text-muted">{{ t(op.meaningKey) }}</span>
        </dt>
        <dd class="mt-1">
          <button
            type="button"
            class="rounded text-left font-mono text-xs text-toned underline decoration-dotted underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="emit('use', op.example)"
          >
            {{ op.example }}
          </button>
        </dd>
      </div>
    </dl>
  </section>
</template>
