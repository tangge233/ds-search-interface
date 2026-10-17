/**
 * 启动前把界面语言对齐到本机偏好。
 * i18n 的文案按语言分包懒加载，若等组件挂载后再切，非默认语言的用户会先看到一帧默认语言；
 * 在插件里先加载再设 locale，首帧就是正确语言。
 */
export default defineNuxtPlugin({
  name: 'locale-prefs',
  // 必须等 i18n 插件把 composer 与消息加载器准备好。
  dependsOn: ['i18n:plugin'],
  async setup() {
    // 插件里没有组件实例，不能用 useI18n()，直接取 nuxt 上的 composer。
    const { $i18n } = useNuxtApp()
    const { prefs } = useSearchSettings()

    const target = prefs.locale
    if (target === $i18n.locale.value) return

    try {
      await $i18n.loadLocaleMessages(target)
    } catch {
      // 语言分包加载失败（离线 / 部署缺文件）时保持默认语言，界面仍可用。
      return
    }
    $i18n.locale.value = target
  }
})
