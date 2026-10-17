<script setup lang="ts">
/**
 * 搜索页：首屏与结果页共用一套状态。
 * 结果页所有控件（搜索框 + 选项行）都在同一列，控件区底部用 2px 分割线与结果分开；
 * 结果区布局（居中单列 / 靠左单列 / 宽屏多列）与搜索记录开关在设置弹窗里配置。
 * 查询词同步到 URL 的 ?q=，方便分享与刷新复现。
 */
const route = useRoute()
const router = useRouter()

const { prefs, hasApiKey } = useSearchSettings()
const { items: history, clearAll: clearHistory } = useSearchHistory()
const {
  status,
  results,
  visibleResults,
  hiddenCount,
  failure,
  lastQuery,
  elapsedMs,
  run,
  clear
} = useWebSearch()

const query = ref('')
const oriQuestion = ref('')
const settingsOpen = ref(false)
const syntaxOpen = ref(false)

const heroField = useTemplateRef<{ focus: () => void } | null>('heroField')
const resultField = useTemplateRef<{ focus: () => void } | null>('resultField')

const EXAMPLES = [
  'DeepSeek V4 模型 发布',
  'site:github.com vLLM 部署',
  'lang:zh after:2026-01 大模型 定价'
]

const isIdle = computed(() => status.value === 'idle')

/** 只有一份可见的搜索框，/ 快捷键聚焦当前那份。 */
const activeField = computed(() => (isIdle.value ? heroField.value : resultField.value))

/** 多列布局需要更宽的容器；靠左布局则贴住起始边。 */
const containerClass = computed(() => {
  if (prefs.resultsLayout === 'columns') return 'mx-auto max-w-6xl'
  if (prefs.resultsLayout === 'left') return 'max-w-3xl'
  return 'mx-auto max-w-3xl'
})

const resultsClass = computed(() =>
  prefs.resultsLayout === 'columns'
    ? 'grid gap-x-10 lg:grid-cols-2'
    : 'divide-y divide-default'
)

/** 多列时用每条结果自己的下边框当分隔线，单列时交给容器的 divide。 */
const cardClass = computed(() => (prefs.resultsLayout === 'columns' ? 'border-b border-default' : ''))

async function submit() {
  const trimmed = query.value.trim()
  if (!trimmed) return

  query.value = trimmed
  // 先固定 URL 再发请求：否则搜索途中点「返回首页」，旧请求结束后会把 ?q= 写回来。
  router.replace({ query: { q: trimmed } })
  await run(trimmed, oriQuestion.value)
}

function searchWith(value: string) {
  query.value = value
  syntaxOpen.value = false
  submit()
}

function resetAll() {
  clear()
  query.value = ''
  oriQuestion.value = ''
  router.replace({ query: {} })
  nextTick(() => heroField.value?.focus())
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return

  // 模态打开时焦点应留在弹窗内：此时抢焦点会把用户从设置里拽回背后的搜索框。
  if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return

  const target = event.target as HTMLElement | null
  // 正在别的输入控件里打字时不要抢焦点。
  if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) return

  event.preventDefault()
  activeField.value?.focus()
}

// 缺少 Key 时自动唤起设置弹窗，省掉「为什么搜不了」这一步。
watch(failure, (value) => {
  if (value?.needsApiKey) settingsOpen.value = true
})

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)

  const initial = typeof route.query.q === 'string' ? route.query.q.trim() : ''
  // 首屏不主动弹设置弹窗：hero 上的提示已经说明了下一步。
  // 但带着 ?q= 进来说明用户此刻就是想搜，这时直接唤起。
  if (!initial) return

  query.value = initial
  if (hasApiKey.value) await submit()
  else settingsOpen.value = true
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-default">
    <AppHeader @open-settings="settingsOpen = true" @reset="resetAll" />

    <!-- 首屏：纯中性底色，强调色只留给控件 -->
    <main v-if="isIdle" class="flex-1">
      <div class="mx-auto w-full max-w-2xl px-4 pt-[12vh] pb-16 text-center">
        <h1 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">
          DeepSeek 搜索交互工具
        </h1>
        <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          检索实时网页，结果带相关度得分与权威性评级；API Key 只保存在这台设备的浏览器里。
        </p>

        <div class="mt-8">
          <SearchField
            ref="heroField"
            v-model="query"
            size="xl"
            autofocus
            :loading="status === 'loading'"
            @submit="submit"
          />
          <p class="mt-2 text-left text-xs text-dimmed">
            输入 <code class="font-mono">site:</code> <code class="font-mono">lang:</code>
            <code class="font-mono">after:</code> 时会出现补全提示，Tab 插入；按
            <code class="font-mono">/</code> 聚焦搜索框。
          </p>
        </div>

        <UAlert
          v-if="!hasApiKey"
          class="mt-6 text-left"
          color="warning"
          variant="subtle"
          icon="i-lucide-key-round"
          title="先填入自己的 DeepSeek API Key"
          description="搜索请求由浏览器直连 api.deepseek.com，Key 不会离开本机。"
        >
          <template #actions>
            <UButton size="xs" label="去设置" @click="settingsOpen = true" />
          </template>
        </UAlert>

        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <UButton
            v-for="example in EXAMPLES"
            :key="example"
            size="xs"
            color="neutral"
            variant="subtle"
            :label="example"
            @click="searchWith(example)"
          />
        </div>

        <div class="mt-6 text-left">
          <button
            type="button"
            class="flex items-center gap-1 rounded text-xs text-dimmed hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :aria-expanded="syntaxOpen"
            @click="syntaxOpen = !syntaxOpen"
          >
            <UIcon :name="syntaxOpen ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="size-3.5" />
            支持的搜索语法
          </button>
          <SearchSyntaxList v-if="syntaxOpen" class="mt-3" @use="searchWith" />
        </div>

        <section v-if="prefs.keepHistory && history.length" class="mt-6 text-left">
          <div class="flex items-baseline justify-between">
            <h2 class="text-xs text-toned">最近搜索</h2>
            <UButton
              color="neutral"
              variant="link"
              size="xs"
              label="清除"
              @click="clearHistory"
            />
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <UButton
              v-for="item in history"
              :key="item"
              size="xs"
              color="neutral"
              variant="outline"
              :label="item.length > 44 ? `${item.slice(0, 43)}…` : item"
              :title="item"
              @click="searchWith(item)"
            />
          </div>
        </section>
      </div>
    </main>

    <main v-else :class="['w-full flex-1 px-4 pb-24', containerClass]">
      <!-- 控件区：与结果同列对齐，底部 2px 分割线把搜索与结果明确分开 -->
      <div class="sticky top-14 z-20 -mx-4 border-b-2 border-default bg-default/95 px-4 pt-3 pb-3 shadow-sm backdrop-blur">
        <SearchField
          ref="resultField"
          v-model="query"
          size="md"
          :loading="status === 'loading'"
          @submit="submit"
        />
        <div class="mt-3">
          <SearchToolbar
            v-model:ori-question="oriQuestion"
            :current-query="query"
            @apply="searchWith"
          />
        </div>
      </div>

      <section class="pt-5">
        <header class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-sm text-muted">
            <template v-if="status === 'loading'">正在搜索「{{ lastQuery }}」…</template>
            <template v-else-if="status === 'success'">
              「{{ lastQuery }}」返回 {{ results.length }} 条<template v-if="hiddenCount">，本地设置隐藏了 {{ hiddenCount }} 条</template>
            </template>
          </p>
          <p v-if="status === 'success'" class="text-xs tabular-nums text-dimmed">
            用时 {{ (elapsedMs / 1000).toFixed(1) }} 秒
          </p>
        </header>

        <SearchResultSkeleton v-if="status === 'loading'" class="mt-2" />

        <div v-else-if="status === 'error' && failure" class="mt-4 space-y-4">
          <UAlert
            color="error"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            :title="failure.title"
            :description="failure.detail"
          />
          <p class="text-sm text-muted">{{ failure.hint }}</p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="failure.retryable"
              label="重试"
              icon="i-lucide-refresh-cw"
              @click="submit"
            />
            <UButton
              v-if="failure.needsApiKey || failure.status === 401"
              label="打开设置"
              icon="i-lucide-settings-2"
              color="neutral"
              variant="outline"
              @click="settingsOpen = true"
            />
            <UButton
              label="返回首页"
              icon="i-lucide-house"
              color="neutral"
              variant="ghost"
              @click="resetAll"
            />
          </div>
        </div>

        <div v-else-if="status === 'success' && !visibleResults.length" class="mt-6 space-y-4">
          <UEmpty
            icon="i-lucide-search-x"
            title="没有可展示的结果"
            :description="results.length
              ? '当前筛选条件下没有结果，可以关掉本地过滤再看。'
              : '换个说法，或去掉 site: / after: 之类的限定词再试。'"
          />
          <div class="flex justify-center">
            <UButton
              v-if="prefs.onlyQuality && results.length"
              label="关闭「仅优质结果」"
              color="neutral"
              variant="outline"
              size="sm"
              @click="prefs.onlyQuality = false"
            />
            <UButton
              v-else
              label="返回首页"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="resetAll"
            />
          </div>
        </div>

        <div v-else :class="[resultsClass, 'mt-1']">
          <SearchResultCard
            v-for="(item, index) in visibleResults"
            :key="`${index}-${item.url}`"
            :class="cardClass"
            :item="item"
            :rank="index + 1"
          />
        </div>
      </section>
    </main>

    <footer class="border-t border-default py-6">
      <p :class="['w-full px-4 text-xs text-dimmed', containerClass]">
        结果由 DeepSeek Search API 提供；本页面只做前端展示，不代理、不存储你的请求。
      </p>
    </footer>

    <SettingsDialog v-model:open="settingsOpen" />
  </div>
</template>
