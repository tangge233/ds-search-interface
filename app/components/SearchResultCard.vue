<script setup lang="ts">
import type { SearchResultItem } from '~/types/search'

/**
 * 单条结果。左侧是当前排序与过滤下的展示序号，不是服务端排名；
 * 卡片内按 来源/日期 → 标题 → 链接 → 摘要 → 评分的顺序排布。
 * 长摘要放进浮动面板，不占列表空间；正文在卡片内原地展开（会撑高这一条）。
 */
const props = defineProps<{ item: SearchResultItem; rank: number }>()

const { t } = useI18n()
const toast = useToast()

/** 图标加载失败（站点无 favicon、被 CSP 拦）时退回通用图标，避免破图。 */
const iconFailed = ref(false)
const showContent = ref(false)

const source = computed(() => resultSource(props.item))
const publishedAt = computed(() => formatDate(props.item.date))
const endpoint = computed(() => shortUrl(props.item.url))
const scoreBadge = computed(() => scoreColor(props.item.rerank_score))
const authorityBadge = computed(() => authorityMeta(props.item.authority))

/** titleKey 由调用方给出，成功提示因此跟着界面语言走。 */
async function copy(text: string, titleKey: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: t(titleKey), icon: 'i-lucide-check', color: 'success' })
  } catch {
    // 非安全上下文（http 部署）没有 clipboard API，或不给权限。
    toast.add({
      title: t('result.copyFailed'),
      description: t('result.copyFailedDescription'),
      icon: 'i-lucide-triangle-alert',
      color: 'error'
    })
  }
}
</script>

<template>
  <article class="grid grid-cols-[2rem_1fr] gap-x-3 py-5">
    <span class="pt-0.5 text-right font-mono text-xs tabular-nums text-dimmed">{{ rank }}</span>

    <div class="min-w-0 space-y-2">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span class="flex items-center gap-1.5">
          <img
            v-if="item.site_icon && !iconFailed"
            :src="item.site_icon"
            alt=""
            class="size-3.5 rounded-sm"
            loading="lazy"
            @error="iconFailed = true"
          >
          <UIcon v-else name="i-lucide-globe" class="size-3.5 text-dimmed" />
          {{ source }}
        </span>
        <span v-if="publishedAt">{{ publishedAt }}</span>
      </div>

      <h3 class="text-base leading-snug">
        <a
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded font-semibold text-highlighted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {{ item.title || t('result.untitled') }}
        </a>
      </h3>

      <p class="truncate font-mono text-xs text-dimmed">{{ endpoint }}</p>

      <p class="text-sm leading-relaxed text-toned">{{ item.snippet }}</p>

      <div v-if="showContent && item.content" class="rounded-lg bg-muted px-3.5 py-3">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs text-dimmed">{{ t('result.contentLabel') }}</p>
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-copy"
            :label="t('result.copyContent')"
            @click="copy(item.content, 'result.contentCopied')"
          />
        </div>
        <pre class="result-content max-h-80 overflow-auto font-sans text-xs leading-relaxed text-toned">{{ item.content.slice(0, 20000) }}</pre>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
        <UTooltip :text="t('result.scoreTooltip')">
          <UBadge :color="scoreBadge" variant="subtle" size="sm" icon="i-lucide-sparkles">
            {{ t('result.score', { score: item.rerank_score.toFixed(1) }) }}
          </UBadge>
        </UTooltip>

        <UBadge :color="authorityBadge.color" variant="subtle" size="sm" icon="i-lucide-shield-check">
          {{ t(authorityBadge.key, { level: authorityBadge.level }) }}
        </UBadge>

        <div class="ms-auto flex flex-wrap items-center gap-1">
          <UPopover
            v-if="item.summary"
            :content="{ align: 'start', sideOffset: 6 }"
            :ui="{ content: 'floating-panel w-[min(36rem,calc(100vw-2rem))] p-4' }"
          >
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-align-left"
              :label="t('result.summaryOpen')"
            />
            <template #content>
              <div class="space-y-3">
                <p class="text-xs text-dimmed">
                  {{ t('result.summary', { count: item.summary.length }) }}
                </p>
                <p class="max-h-72 overflow-auto text-sm leading-relaxed text-toned">
                  {{ item.summary }}
                </p>
                <UButton
                  size="xs"
                  icon="i-lucide-copy"
                  :label="t('result.copySummary')"
                  @click="copy(item.summary, 'result.summaryCopied')"
                />
              </div>
            </template>
          </UPopover>

          <UButton
            v-if="item.content"
            color="neutral"
            variant="ghost"
            size="xs"
            :trailing-icon="showContent ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            :label="showContent ? t('result.hideContent') : t('result.showContent')"
            :aria-expanded="showContent"
            @click="showContent = !showContent"
          />
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-copy"
            :label="t('result.copyLink')"
            @click="copy(item.url, 'result.linkCopied')"
          />
          <UButton
            :to="item.url"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-external-link"
            :label="t('result.open')"
          />
        </div>
      </div>
    </div>
  </article>
</template>
