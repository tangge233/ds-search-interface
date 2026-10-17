<script setup lang="ts">
const { t, locale, loadLocaleMessages } = useI18n()
const { prefs } = useSearchSettings()

// 语言只有一份来源：本机偏好。i18n 的 locale 跟着它走，
// 于是设置里的切换、刷新后的还原、以及 <html lang> 都不会各说各话。
// 启动时的首次对齐在 plugins/locale-prefs.ts 里完成，这里负责后续的切换。
// 先加载再切换：反过来的话，等待语言分包加载的那一帧会把 key 名字渲染到界面上。
watch(() => prefs.locale, async (value) => {
  if (value === locale.value) return
  try {
    await loadLocaleMessages(value)
  } catch {
    // 加载失败就停在当前语言，不让切换把界面搞成一片 key。
    return
  }
  locale.value = value
}, { immediate: true })

useHead({
  title: () => t('meta.title'),
  htmlAttrs: { lang: () => prefs.locale },
  meta: [{ name: 'description', content: () => t('meta.description') }]
})
</script>

<template>
  <!-- UApp 提供 toast / tooltip / overlay 的宿主，缺少它这些能力不会渲染。 -->
  <UApp>
    <NuxtPage />
  </UApp>
</template>
