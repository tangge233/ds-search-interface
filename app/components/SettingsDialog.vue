<script setup lang="ts">
import { DEFAULT_BASE_URL } from '~/utils/endpoint'
import { APP_LOCALES } from '~/utils/locales'
import type { ApiKeyCheck } from '~/utils/verify-api-key'

/**
 * 统一配置弹窗，按分区组织便于快速定位：
 * 连接（凭据与地址）/ 默认搜索参数 / 界面与记录 / 关于。
 * 连接项先落在草稿上，点「保存连接设置」才写入；其余项立即生效——
 * 改个布局还要先保存会很别扭。
 */
const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const { apiKey, baseUrl, prefs, saveBaseUrl, clearApiKey, hasApiKey, resetPrefs } = useSearchSettings()
const { clearAll: clearHistory } = useSearchHistory()
const { countItems, sortItems, layoutItems } = usePresetItems()
const toast = useToast()

/** 分区只存 labelKey，切语言时导航跟着变。 */
const SECTIONS = [
  { id: 'connection', labelKey: 'settings.sectionConnection', icon: 'i-lucide-plug-zap' },
  { id: 'defaults', labelKey: 'settings.sectionDefaults', icon: 'i-lucide-sliders-horizontal' },
  { id: 'interface', labelKey: 'settings.sectionInterface', icon: 'i-lucide-layout-panel-left' },
  { id: 'about', labelKey: 'settings.sectionAbout', icon: 'i-lucide-info' }
] as const

type SectionId = (typeof SECTIONS)[number]['id']

/** 语言名称用各自的语言书写，不再翻译一遍。 */
const localeItems = APP_LOCALES.map(item => ({ value: item.code, label: item.label }))

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

/** 服务端原文最具体；未预期的状态码要把状态码补回去，否则只剩一句 API 报错。 */
function checkDescription(value: ApiKeyCheck): string {
  if (value.verdict === 'unknown' && value.status !== undefined && value.serverMessage) {
    return t('verify.httpErrorWithMessage', { status: value.status, message: value.serverMessage })
  }
  return value.serverMessage || t(value.detailKey, { status: value.status })
}

function checkTitle(verdict: ApiKeyCheck['verdict']): string {
  if (verdict === 'valid') return t('settings.checkValidTitle')
  if (verdict === 'invalid') return t('settings.checkInvalidTitle')
  return t('settings.checkUnknownTitle')
}

function saveConnection() {
  apiKey.value = draftKey.value.trim()
  saveBaseUrl(draftBase.value)
  toast.add({
    title: t('settings.savedTitle'),
    description: t('settings.savedDescription'),
    icon: 'i-lucide-check',
    color: 'success'
  })
}

async function verify() {
  if (!draftKey.value.trim()) {
    check.value = { verdict: 'invalid', detailKey: 'verify.enterKeyFirst' }
    return
  }
  verifying.value = true
  try {
    check.value = await verifyApiKey(draftKey.value, draftBase.value)
  } catch {
    // verifyApiKey 自己已经处理了已知错误；这里只兜住未预期异常，避免按钮卡在 loading。
    check.value = { verdict: 'unknown', detailKey: 'verify.failed' }
  } finally {
    verifying.value = false
  }
}

function forgetKey() {
  clearApiKey()
  draftKey.value = ''
  check.value = null
  toast.add({ title: t('settings.keyCleared'), icon: 'i-lucide-trash-2' })
}

/** 关掉记录开关时顺手清空已有记录，否则本地仍留着旧数据。 */
function onHistoryToggle(enabled: boolean) {
  if (!enabled) clearHistory()
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('settings.title')"
    :description="t('settings.description')"
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
            {{ t(item.labelKey) }}
          </button>
        </nav>

        <div class="min-h-0 min-w-0 flex-1 overflow-y-auto pe-3 [scrollbar-gutter:stable]">
          <section v-if="section === 'connection'" class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-highlighted">{{ t('settings.sectionConnection') }}</h3>
              <p class="mt-1 text-xs text-dimmed">{{ t('settings.connectionDescription') }}</p>
            </div>

            <UFormField
              :label="t('settings.apiKeyLabel')"
              required
              :help="t('settings.apiKeyHelp')"
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
                    :aria-label="revealed ? t('settings.hideKey') : t('settings.showKey')"
                    :aria-pressed="revealed"
                    @click="revealed = !revealed"
                  />
                </template>
              </UInput>
            </UFormField>

            <div class="flex flex-wrap items-center gap-2">
              <UButton
                :label="t('settings.saveConnection')"
                icon="i-lucide-check"
                :disabled="!draftKey.trim()"
                @click="saveConnection"
              />
              <UButton
                :label="t('settings.verify')"
                color="neutral"
                variant="outline"
                icon="i-lucide-plug-zap"
                :loading="verifying"
                @click="verify"
              />
              <UButton
                v-if="hasApiKey"
                :label="t('settings.clearKey')"
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
              :title="checkTitle(check.verdict)"
              :description="checkDescription(check)"
            />

            <UFormField
              :label="t('settings.baseUrlLabel')"
              :hint="t('settings.advancedHint')"
              :help="t('settings.baseUrlHelp')"
            >
              <UInput v-model="draftBase" :placeholder="DEFAULT_BASE_URL" class="w-full" spellcheck="false" />
            </UFormField>
          </section>

          <section v-else-if="section === 'defaults'" class="space-y-5">
            <div>
              <h3 class="text-sm font-medium text-highlighted">{{ t('settings.sectionDefaults') }}</h3>
              <p class="mt-1 text-xs text-dimmed">
                {{ t('settings.defaultsDescription') }}
              </p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField :label="t('settings.countLabel')" :help="t('settings.countHelp')">
                <USelect v-model="prefs.count" :items="countItems" class="w-full" />
              </UFormField>
              <UFormField :label="t('settings.sortLabel')" :help="t('settings.sortHelp')">
                <USelect v-model="prefs.sort" :items="sortItems" class="w-full" />
              </UFormField>
              <UFormField
                :label="t('settings.localizationLabel')"
                :hint="t('advanced.optional')"
                :help="t('settings.localizationHelp')"
                class="sm:col-span-2"
              >
                <UInput v-model="prefs.localization" :placeholder="t('advanced.localizationPlaceholder')" class="w-full" />
              </UFormField>
            </div>

            <div class="space-y-4 border-t border-default pt-4">
              <USwitch
                v-model="prefs.needContent"
                :label="t('settings.needContentLabel')"
                :description="t('settings.needContentDescription')"
              />
              <USwitch
                v-model="prefs.onlyQuality"
                :label="t('settings.onlyQualityLabel')"
                :description="t('settings.onlyQualityDescription')"
              />
            </div>

            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-rotate-ccw"
              :label="t('search.resetAria')"
              @click="resetPrefs"
            />
          </section>

          <section v-else-if="section === 'interface'" class="space-y-5">
            <div>
              <h3 class="text-sm font-medium text-highlighted">{{ t('settings.sectionInterface') }}</h3>
              <p class="mt-1 text-xs text-dimmed">{{ t('settings.interfaceDescription') }}</p>
            </div>

            <UFormField :label="t('settings.layoutLabel')" :help="t('settings.layoutHelp')">
              <USelect v-model="prefs.resultsLayout" :items="layoutItems" class="w-full sm:w-56" />
            </UFormField>

            <UFormField :label="t('settings.languageLabel')" :help="t('settings.languageHelp')">
              <USelect v-model="prefs.locale" :items="localeItems" class="w-full sm:w-56" />
            </UFormField>

            <USwitch
              v-model="prefs.keepHistory"
              :label="t('settings.keepHistoryLabel')"
              :description="t('settings.keepHistoryDescription')"
              @update:model-value="onHistoryToggle"
            />
          </section>

          <section v-else class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-highlighted">{{ t('settings.sectionAbout') }}</h3>
              <p class="mt-1 text-xs text-dimmed">
                {{ t('settings.aboutIntro') }}
              </p>
              <a
                href="https://api-docs.deepseek.com/zh-cn/api/search"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-1 inline-block text-xs text-primary underline underline-offset-4"
              >{{ t('settings.aboutApiDocs') }}</a>
            </div>

            <!-- 源码与许可：MIT 允许商用与再发布，但要求保留版权与许可声明，这里如实写明。 -->
            <div class="space-y-2.5 rounded-lg border border-default px-3.5 py-3">
              <p class="text-sm text-toned">
                {{ t('settings.licenseText') }}
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
                  :label="t('settings.githubRepo')"
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
                  :label="t('settings.licenseLink')"
                  trailing-icon="i-lucide-arrow-up-right"
                />
              </div>
            </div>

            <!-- 告示里的外链单独成行：句子完整可翻译，不必在文案中间切出链接。 -->
            <UAlert
              color="info"
              variant="subtle"
              icon="i-lucide-receipt"
              :title="t('settings.billingTitle')"
            >
              <template #description>
                <p>{{ t('settings.billingText') }}</p>
                <a
                  href="https://api-docs.deepseek.com/zh-cn/quick_start/pricing#%E7%BD%91%E9%A1%B5%E6%90%9C%E7%B4%A2%E4%B8%8E%E6%8A%93%E5%8F%96%E4%BB%B7%E6%A0%BC"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-1 inline-block text-primary underline underline-offset-4"
                >{{ t('settings.billingLink') }}</a>
              </template>
            </UAlert>

            <UAlert
              color="info"
              variant="subtle"
              icon="i-lucide-gauge"
              :title="t('settings.rateTitle')"
            >
              <template #description>
                <p>{{ t('settings.rateText') }}</p>
                <a
                  href="https://api-docs.deepseek.com/zh-cn/guides/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-1 inline-block text-primary underline underline-offset-4"
                >{{ t('settings.rateLink') }}</a>
              </template>
            </UAlert>

            <UAlert
              color="info"
              variant="subtle"
              icon="i-lucide-server-off"
              :title="t('settings.dataTitle')"
              :description="t('settings.dataText')"
            />

            <UAlert
              color="warning"
              variant="subtle"
              icon="i-lucide-shield-alert"
              :title="t('settings.dutyTitle')"
              :description="t('settings.dutyText')"
            />

            <UAlert
              color="warning"
              variant="subtle"
              icon="i-lucide-lock"
              :title="t('settings.storageTitle')"
              :description="t('settings.storageText')"
            />
          </section>
        </div>
      </div>
    </template>
  </UModal>
</template>
