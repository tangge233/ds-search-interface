export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],

  // 纯前端（SPA）部署：所有请求与 API Key 都留在浏览器，无服务端依赖。
  ssr: false,

  devtools: { enabled: true },

  app: {
    head: {
      // lang / title / description 随界面语言变化，统一在 app.vue 里输出。
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#2563eb' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },

  i18n: {
    defaultLocale: 'zh-CN',
    // 语言不进 URL：这是单页应用，分享链接靠 ?q=，多前缀路由在静态托管下只会添乱。
    // 当前语言存在本机偏好里（见 useSearchSettings），刷新后还原。
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [
      { code: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
      { code: 'en', name: 'English', file: 'en.json' }
    ]
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: ''
  }
})
