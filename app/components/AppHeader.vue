<script setup lang="ts">
/**
 * 顶部栏：品牌入口、API Key 状态与主题切换。
 * 直接读共享配置，避免父组件为「Key 是否配置」做无意义的 prop 传递。
 */
const emit = defineEmits<{ openSettings: []; reset: [] }>()

const { t } = useI18n()
const { hasApiKey, isCustomBaseUrl } = useSearchSettings()
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
