<script setup lang="ts">
import { DEFAULT_BASE_URL } from '~/composables/useSearchSettings'
import { COUNT_OPTIONS, LAYOUT_OPTIONS, SORT_OPTIONS } from '~/utils/search-presets'
import type { ApiKeyCheck } from '~/utils/verify-api-key'

/**
 * 统一配置弹窗，按分区组织便于快速定位：
 * 连接（凭据与地址）/ 默认搜索参数 / 界面与记录 / 关于。
 * 连接项先落在草稿上，点「保存连接设置」才写入；其余项立即生效——
 * 改个布局还要先保存会很别扭。
 */
const open = defineModel<boolean>('open', { required: true })

const { apiKey, baseUrl, prefs, saveBaseUrl, clearApiKey, hasApiKey, resetPrefs } = useSearchSettings()
const { clearAll: clearHistory } = useSearchHistory()
const toast = useToast()

const SECTIONS = [
  { id: 'connection', label: '连接', icon: 'i-lucide-plug-zap' },
  { id: 'defaults', label: '默认搜索参数', icon: 'i-lucide-sliders-horizontal' },
  { id: 'interface', label: '界面与记录', icon: 'i-lucide-layout-panel-left' },
  { id: 'about', label: '关于', icon: 'i-lucide-info' }
] as const

type SectionId = (typeof SECTIONS)[number]['id']

/** 保留上次停留的分区，重复回来改同一项时少点一次。 */
const section = ref<SectionId>('connection')

const draftKey = ref('')
const draftBase = ref(DEFAULT_BASE_URL)
const revealed = ref(false)
const verifying = ref(false)
const check = ref<ApiKeyCheck | null>(null)

// 每次打开都用已保存的值重填草稿，并清掉上一次的校验结论。
watch(open, (isOpen) => {
  if (!isOpen) return
  draftKey.value = apiKey.value
  draftBase.value = baseUrl.value
  revealed.value = false
  check.value = null
})

// 草稿一改，上一次的「凭据有效」就不再代表当前输入，立即失效。
watch([draftKey, draftBase], () => {
  check.value = null
})

function saveConnection() {
  apiKey.value = draftKey.value.trim()
  saveBaseUrl(draftBase.value)
  toast.add({
    title: '连接设置已保存',
    description: 'API Key 只写入本机 localStorage。',
    icon: 'i-lucide-check',
    color: 'success'
  })
}

async function verify() {
  if (!draftKey.value.trim()) {
    check.value = { verdict: 'invalid', detail: '请先填入 API Key。' }
    return
  }
  verifying.value = true
  try {
    check.value = await verifyApiKey(draftKey.value, draftBase.value)
  } finally {
    verifying.value = false
  }
}

function forgetKey() {
  clearApiKey()
  draftKey.value = ''
  check.value = null
  toast.add({ title: '已清除本机 API Key', icon: 'i-lucide-trash-2' })
}

/** 关掉记录开关时顺手清空已有记录，否则本地仍留着旧数据。 */
function onHistoryToggle(enabled: boolean) {
  if (!enabled) clearHistory()
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="设置"
    description="配置只保存在这台设备上，随时可以清空。"
    :ui="{ content: 'sm:max-w-2xl floating-panel' }"
  >
    <template #body>
      <!-- 固定高度：切换分区时尺寸不变，内容超出时在分区内部滚动，弹窗不会乱跳。 -->
      <div class="flex h-[min(28rem,calc(100dvh-14rem))] flex-col gap-6 sm:flex-row">
        <!-- 分区导航：窄屏横向滚动，宽屏竖排 -->
        <nav class="flex shrink-0 gap-1 overflow-x-auto sm:w-40 sm:flex-col sm:overflow-visible">
          <button
            v-for="item in SECTIONS"
            :key="item.id"
            type="button"
            class="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-start text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="section === item.id
              ? 'bg-elevated font-medium text-highlighted'
              : 'text-muted hover:bg-elevated hover:text-highlighted'"
            :aria-current="section === item.id ? 'true' : undefined"
            @click="section = item.id"
          >
            <UIcon
              :name="item.icon"
              class="size-4 shrink-0"
              :class="section === item.id ? 'text-primary' : ''"
            />
            {{ item.label }}
          </button>
        </nav>

        <div class="min-h-0 min-w-0 flex-1 overflow-y-auto pe-3 [scrollbar-gutter:stable]">
          <section v-if="section === 'connection'" class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-highlighted">连接</h3>
              <p class="mt-1 text-xs text-dimmed">搜索请求由浏览器直接发往该地址，凭据不经过第三方。</p>
            </div>

            <UFormField
              label="API Key"
              required
              help="在 platform.deepseek.com 的 API Keys 页面创建，形如 sk-…"
            >
              <UInput
                v-model="draftKey"
                :type="revealed ? 'text' : 'password'"
                placeholder="sk-…"
                class="w-full"
                autocomplete="off"
                :ui="{ trailing: 'pe-1' }"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="revealed ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :aria-label="revealed ? '隐藏 API Key' : '显示 API Key'"
                    :aria-pressed="revealed"
                    @click="revealed = !revealed"
                  />
                </template>
              </UInput>
            </UFormField>

            <div class="flex flex-wrap items-center gap-2">
              <UButton
                label="保存连接设置"
                icon="i-lucide-check"
                :disabled="!draftKey.trim()"
                @click="saveConnection"
              />
              <UButton
                label="校验凭据"
                color="neutral"
                variant="outline"
                icon="i-lucide-plug-zap"
                :loading="verifying"
                @click="verify"
              />
              <UButton
                v-if="hasApiKey"
                label="清除本机 Key"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="forgetKey"
              />
            </div>

            <UAlert
              v-if="check"
              :color="check.verdict === 'valid' ? 'success' : check.verdict === 'invalid' ? 'error' : 'warning'"
              variant="subtle"
              :icon="check.verdict === 'valid' ? 'i-lucide-shield-check' : 'i-lucide-triangle-alert'"
              :title="check.verdict === 'valid' ? '凭据有效' : check.verdict === 'invalid' ? '凭据不可用' : '无法确认凭据'"
              :description="check.detail"
            />

            <UFormField
              label="API 地址"
              hint="高级"
              help="默认直连官方接口；若你的 Key 需要通过自建网关转发，可在此替换。"
            >
              <UInput v-model="draftBase" :placeholder="DEFAULT_BASE_URL" class="w-full" spellcheck="false" />
            </UFormField>
          </section>

          <section v-else-if="section === 'defaults'" class="space-y-5">
            <div>
              <h3 class="text-sm font-medium text-highlighted">默认搜索参数</h3>
              <p class="mt-1 text-xs text-dimmed">
                与结果页工具栏是同一份配置，改这里等于改默认值；工具栏用于临时调整。
              </p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="返回条数" help="1～50，只影响条数，不影响计费">
                <USelect v-model="prefs.count" :items="COUNT_OPTIONS" class="w-full" />
              </UFormField>
              <UFormField label="排序方式" help="在返回结果内本地排序，不额外计费；「相关度」即接口返回顺序">
                <USelect v-model="prefs.sort" :items="SORT_OPTIONS" class="w-full" />
              </UFormField>
              <UFormField
                label="本地化 IP"
                hint="可选"
                help="让结果偏向该地区，留空表示不指定"
                class="sm:col-span-2"
              >
                <UInput v-model="prefs.localization" placeholder="203.0.113.10" class="w-full" />
              </UFormField>
            </div>

            <div class="space-y-4 border-t border-default pt-4">
              <USwitch
                v-model="prefs.needContent"
                label="返回网页正文"
                description="在 content 里返回整页正文，勾选后可原地细读。"
              />
              <USwitch
                v-model="prefs.onlyQuality"
                label="只看优质结果"
                description="过滤掉相关度得分低于 1.5 的结果。"
              />
            </div>

            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-rotate-ccw"
              label="恢复默认参数"
              @click="resetPrefs"
            />
          </section>

          <section v-else-if="section === 'interface'" class="space-y-5">
            <div>
              <h3 class="text-sm font-medium text-highlighted">界面与记录</h3>
              <p class="mt-1 text-xs text-dimmed">这些选项立即生效，不需要保存。</p>
            </div>

            <UFormField label="结果布局" help="宽屏多列会在 ≥1024px 时并排显示两列结果。">
              <USelect v-model="prefs.resultsLayout" :items="LAYOUT_OPTIONS" class="w-full sm:w-56" />
            </UFormField>

            <USwitch
              v-model="prefs.keepHistory"
              label="保留搜索记录"
              description="关掉后不再写入本机记录，并清空已有记录。"
              @update:model-value="onHistoryToggle"
            />
          </section>

          <section v-else class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-highlighted">关于</h3>
              <p class="mt-1 text-xs text-dimmed">
                DeepSeek 搜索交互工具是一个纯前端界面，使用 Vue 3 + Nuxt 4 + Nuxt UI 构建，调用
                <a
                  href="https://api-docs.deepseek.com/zh-cn/api/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary underline underline-offset-4"
                >DeepSeek Search API</a>。
              </p>
            </div>

            <!-- 源码与许可：MIT 允许商用与再发布，但要求保留版权与许可声明，这里如实写明。 -->
            <div class="space-y-2.5 rounded-lg border border-default px-3.5 py-3">
              <p class="text-sm text-toned">
                项目以 MIT 许可证开源：可自由使用、修改与再分发，包括商用；再分发时需保留原始版权声明与许可证全文。
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <UButton
                  to="https://github.com/tangge233/ds-search-interface"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-github"
                  label="GitHub 仓库"
                  trailing-icon="i-lucide-arrow-up-right"
                />
                <UButton
                  to="https://github.com/tangge233/ds-search-interface/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-scale"
                  label="MIT 许可证全文"
                  trailing-icon="i-lucide-arrow-up-right"
                />
              </div>
            </div>

            <UAlert
              color="info"
              variant="subtle"
              icon="i-lucide-receipt"
              title="关于计费"
            >
              <template #description>
                Search 每 1000 次成功请求 5 元，只有返回结果的请求才计费。「校验凭据」走 /models 接口，不产生搜索计费。
                价格可能调整，请以
                <a
                  href="https://api-docs.deepseek.com/zh-cn/quick_start/pricing#%E7%BD%91%E9%A1%B5%E6%90%9C%E7%B4%A2%E4%B8%8E%E6%8A%93%E5%8F%96%E4%BB%B7%E6%A0%BC"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary underline underline-offset-4"
                >DeepSeek 官方计费文档</a> 为准。
              </template>
            </UAlert>

            <UAlert
              color="info"
              variant="subtle"
              icon="i-lucide-gauge"
              title="关于限速"
            >
              <template #description>
                账号级 5 QPS。触发限速时会提示稍后重试，细节见
                <a
                  href="https://api-docs.deepseek.com/zh-cn/guides/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary underline underline-offset-4"
                >官方接口指南</a>。
              </template>
            </UAlert>

            <UAlert
              color="info"
              variant="subtle"
              icon="i-lucide-server-off"
              title="数据流向"
              description="本页面不经过任何自建服务端：除了按你的配置把 API Key 与搜索词发送给你填写的 API 地址（默认 DeepSeek 官方接口）之外，不会把 API Key、搜索词或搜索结果上传或存储到其它任何服务器。配置与搜索记录只保存在本机 localStorage，清除浏览器数据即消失。"
            />

            <UAlert
              color="warning"
              variant="subtle"
              icon="i-lucide-shield-alert"
              title="使用责任"
              description="API Key 的保管、账号额度与费用、以及搜索结果的使用方式都由使用者本人负责。请遵守 DeepSeek 的服务条款，并自行判断搜索结果是否适用于你的场景——界面只做展示，不对内容准确性负责。"
            />

            <UAlert
              color="warning"
              variant="subtle"
              icon="i-lucide-lock"
              title="本地存储的边界"
              description="Key 以明文存放在浏览器 localStorage，任何在本机执行的脚本都能读到。公共电脑上请用完后点「清除本机 Key」。"
            />
          </section>
        </div>
      </div>
    </template>
  </UModal>
</template>
