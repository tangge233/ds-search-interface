<script setup lang="ts">
/**
 * 顶部栏：品牌入口、使用提示、API Key 状态与主题切换。
 * 直接读共享配置，避免父组件为「Key 是否配置」做无意义的 prop 传递。
 * 高级语法的用法说明放在「使用提示」浮层里：它常驻可达，页面正文不必被文档占位。
 */
const emit = defineEmits<{ openSettings: []; reset: []; useQuery: [string] }>()

const { t } = useI18n()
const { hasApiKey, isCustomBaseUrl } = useSearchSettings()

/** 示例点完先收起浮层，再交给页面执行搜索。 */
function onUseExample(close: () => void, value: string) {
  close()
  emit('useQuery', value)
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-default bg-default/85 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
      <NuxtLink
        to="/"
        class="group flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="emit('reset')"
      >
        <span class="grid size-7 place-items-center rounded-md bg-primary text-inverted">
          <UIcon name="i-lucide-search" class="size-4" />
        </span>
        <span class="hidden text-sm font-semibold text-highlighted sm:inline">{{ t('app.name') }}</span>
      </NuxtLink>

      <div class="ms-auto flex items-center gap-2">
        <UBadge
          v-if="isCustomBaseUrl"
          class="hidden sm:inline-flex"
          color="neutral"
          variant="subtle"
          icon="i-lucide-router"
          :label="t('header.customBaseUrl')"
        />
        <!-- 使用提示：高级语法的完整用法常驻在右上角，点示例直接填入并搜索。 -->
        <UPopover
          :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
          :ui="{ content: 'floating-panel w-[min(44rem,calc(100vw-2rem))] max-h-[min(70dvh,34rem)] overflow-y-auto p-4' }"
        >
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-circle-help"
            :aria-label="t('header.help')"
          />
          <template #content="{ close }">
            <div class="space-y-3">
              <div>
                <h2 class="text-sm font-medium text-highlighted">{{ t('header.helpTitle') }}</h2>
                <p class="mt-1 text-xs leading-relaxed text-dimmed">{{ t('header.helpDescription') }}</p>
              </div>
              <SearchSyntaxList @use="value => onUseExample(close, value)" />
            </div>
          </template>
        </UPopover>

        <UButton
          :color="hasApiKey ? 'neutral' : 'primary'"
          :variant="hasApiKey ? 'ghost' : 'soft'"
          size="sm"
          icon="i-lucide-settings-2"
          :label="hasApiKey ? t('header.settings') : t('header.settingsApiKey')"
          @click="emit('openSettings')"
        />
        <UColorModeButton />
      </div>
    </div>
  </header>
</template>
