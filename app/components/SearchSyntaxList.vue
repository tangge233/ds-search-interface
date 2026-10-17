<script setup lang="ts">
/**
 * 搜索语法速查。运算符由 API 原样透传给搜索服务，
 * 因此这里既是文档也是可点击的示例：点示例即把完整查询填进搜索框。
 */
const emit = defineEmits<{ use: [string] }>()

const OPERATORS = [
  { syntax: 'site:', meaning: '只在指定站点内搜索，多个站点用 OR 连接', example: 'vLLM 部署 site:github.com' },
  { syntax: '-site:', meaning: '排除指定站点', example: 'DeepSeek -site:example.com' },
  { syntax: '"…"', meaning: '精确匹配短语', example: 'DeepSeek "精确短语"' },
  { syntax: '-…', meaning: '排除包含该关键词的网页', example: 'DeepSeek -广告' },
  { syntax: '-"…"', meaning: '排除包含该短语的网页', example: 'DeepSeek -"release notes"' },
  { syntax: 'lang:', meaning: '限定语言，多种语言用逗号分隔', example: '模型 发布 lang:zh,en' },
  { syntax: 'after:', meaning: '只保留该日期之后发布的网页', example: 'DeepSeek 发布 after:2025-01-01' },
  { syntax: 'before:', meaning: '只保留该日期之前发布的网页', example: 'DeepSeek 发布 before:2026' }
]
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-default">
    <h3 class="border-b border-default bg-muted px-4 py-2.5 text-xs font-medium text-toned">
      支持的搜索语法
    </h3>
    <dl class="divide-y divide-default">
      <div v-for="op in OPERATORS" :key="op.syntax" class="px-4 py-3">
        <dt class="flex items-baseline gap-2">
          <code class="font-mono text-sm text-primary">{{ op.syntax }}</code>
          <span class="text-xs text-muted">{{ op.meaning }}</span>
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
