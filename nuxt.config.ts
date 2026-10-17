export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],

  // 纯前端（SPA）部署：所有请求与 API Key 都留在浏览器，无服务端依赖。
  ssr: false,

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'DeepSeek 搜索交互工具',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'DeepSeek 搜索交互工具：调用 DeepSeek Search API 的纯前端网页搜索，API Key 只保存在本地浏览器。'
        },
        { name: 'theme-color', content: '#2563eb' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: ''
  }
})
