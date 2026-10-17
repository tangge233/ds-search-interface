export default defineAppConfig({
  ui: {
    // neutral 的调色板 chroma 为 0（纯灰），背景与层级因此完全不偏蓝；
    // 蓝色只作为 primary 出现在控件强调上。
    colors: {
      primary: 'blue',
      success: 'emerald',
      info: 'cyan',
      warning: 'amber',
      error: 'rose',
      neutral: 'neutral'
    }
  }
})
