import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * 纯函数单测，不启动 Nuxt：
 * 被测模块只依赖 `~/` 别名与类型，所以这里只需要把别名指到 app/。
 */
export default defineConfig({
  resolve: {
    alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) }
  },
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node'
  }
})
