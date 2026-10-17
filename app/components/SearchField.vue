<script setup lang="ts">
import type { SyntaxCompletion, SyntaxSuggestion } from '~/utils/query-syntax'

/**
 * 搜索输入框：hero 与结果页共用。
 * 除表单提交外，它还承担「语法补全」——面板默认展开，列出 site:、lang:、after: 等运算符，
 * 输入即按前缀筛选、空格回到默认列表、退格删字符后重新匹配；
 * ↑↓ 选择、Tab / Enter 插入、Esc 关闭，插入后光标落在该继续输入的位置。
 * 空片段（刚聚焦、刚敲完空格）不预选候选，回车因此仍然是提交搜索。
 */
const props = withDefaults(
  defineProps<{
    size?: 'md' | 'lg' | 'xl'
    loading?: boolean
    /** 留空时用当前语言的默认占位符 */
    placeholder?: string
    autofocus?: boolean
  }>(),
  {
    size: 'lg',
    loading: false,
    placeholder: '',
    autofocus: false
  }
)

const { t } = useI18n()

const emit = defineEmits<{ submit: [] }>()

const query = defineModel<string>({ required: true })

const root = useTemplateRef<{ inputRef?: HTMLInputElement; $el?: HTMLElement } | null>('root')
/** 补全面板的 id 前缀：listbox 与选项都要被 input 用 aria-controls / aria-activedescendant 指到。 */
const uid = useId()
const caret = ref(0)
const focused = ref(false)
/** Esc 关闭后不因同一次输入再次弹出；下一次输入（含空格、退格）再恢复提示。 */
const dismissed = ref(false)
/** 用 ↑↓ 或 hover 明确选过的候选；null 表示还没选过。 */
const picked = ref<number | null>(null)

function inputElement(): HTMLInputElement | null {
  const el = root.value?.inputRef ?? root.value?.$el?.querySelector('input')
  return el instanceof HTMLInputElement ? el : null
}

const completion = computed<SyntaxCompletion>(() => completeQuery(query.value, caret.value))
/**
 * 空片段（默认面板）不预选候选：此时回车应提交搜索而不是插入运算符。
 * 片段里有内容说明用户正在写运算符或值，预选第一项，回车即补全——和 IDE 一致。
 */
const activeIndex = computed(() => picked.value ?? (completion.value.token.text ? 0 : -1))
const open = computed(
  () => focused.value && !dismissed.value && completion.value.items.length > 0
)

function focus() {
  inputElement()?.focus()
}
defineExpose({ focus })

function syncCaret() {
  const el = inputElement()
  if (el) caret.value = el.selectionStart ?? el.value.length
}

function onInput() {
  // 每次输入都重置选择：空格把片段清空后回到默认面板，退格删字符后重新匹配。
  dismissed.value = false
  picked.value = null
  // v-model 与 selectionStart 的更新时序不保证，下一帧再读光标位置。
  nextTick(syncCaret)
}

function onFocus() {
  focused.value = true
  dismissed.value = false
  syncCaret()
}

function onBlur() {
  focused.value = false
}

function accept(item: SyntaxSuggestion) {
  const token = completion.value.token
  const applied = applyCompletion(query.value, token, item)
  query.value = applied.query
  dismissed.value = false
  picked.value = null

  nextTick(() => {
    const el = inputElement()
    el?.focus()
    el?.setSelectionRange(applied.caret, applied.caret)
    caret.value = applied.caret
  })
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) return

  const items = completion.value.items
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const step = event.key === 'ArrowDown' ? 1 : -1
    const current = activeIndex.value
    // 默认面板下还没选过（-1）：↓ 从第一项开始，↑ 从最后一项开始。
    picked.value = current < 0
      ? (step === 1 ? 0 : items.length - 1)
      : (current + step + items.length) % items.length
    return
  }
  if (event.key === 'Tab' || event.key === 'Enter') {
    const item = items[activeIndex.value]
    // 默认面板里没选过候选时把回车、Tab 留给原生行为：回车提交搜索，Tab 移走焦点。
    if (!item) return
    event.preventDefault()
    accept(item)
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    dismissed.value = true
  }
}

function onSubmit() {
  dismissed.value = true
  emit('submit')
}

onMounted(() => {
  if (props.autofocus) focus()
})

const length = computed(() => countCharacters(query.value.trim()))
const placeholderText = computed(() => props.placeholder || t('search.placeholder'))

/** 已输入部分染成强调色，补全列表该有的样子。 */
function highlight(item: SyntaxSuggestion) {
  // 按 insert 切：引号类的 label 比 insert 短，用 label 长度会切错位置。
  const typed = completion.value.token.text.length
  const cut = Math.min(typed, item.insert.length)
  return { head: item.label.slice(0, cut), tail: item.label.slice(cut) }
}
</script>

<template>
  <form class="flex items-start gap-2" @submit.prevent="onSubmit">
    <div class="relative min-w-0 flex-1">
      <UInput
        ref="root"
        v-model="query"
        :size="size"
        :loading="loading"
        :placeholder="placeholderText"
        icon="i-lucide-search"
        class="w-full"
        :ui="{ base: 'text-base' }"
        role="combobox"
        :aria-invalid="length > 128 || undefined"
        :aria-expanded="open"
        :aria-controls="open ? `${uid}-syntax` : undefined"
        :aria-activedescendant="open && activeIndex >= 0 ? `${uid}-syntax-${activeIndex}` : undefined"
        aria-autocomplete="list"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        @input="onInput"
        @keydown="onKeydown"
        @focus="onFocus"
        @blur="onBlur"
        @click="syncCaret"
        @keyup="syncCaret"
      >
        <template v-if="query" #trailing>
          <UButton
            color="neutral"
            variant="link"
            size="sm"
            icon="i-lucide-circle-x"
            :aria-label="t('search.clear')"
            @click="query = ''"
          />
        </template>
      </UInput>

      <!-- 语法提示面板。mousedown.prevent 保证点击候选不会先触发失焦。 -->
      <ul
        v-if="open"
        :id="`${uid}-syntax`"
        class="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-default bg-elevated py-1 shadow-lg"
        role="listbox"
      >
        <li
          v-for="(item, index) in completion.items"
          :id="`${uid}-syntax-${index}`"
          :key="item.insert"
          role="option"
          :aria-selected="index === activeIndex"
          class="flex cursor-pointer items-baseline gap-3 px-3 py-1.5"
          :class="index === activeIndex ? 'bg-accented' : ''"
          @mouseenter="picked = index"
          @mousedown.prevent="accept(item)"
        >
          <code class="shrink-0 font-mono text-sm">
            <span class="text-primary">{{ highlight(item).head }}</span><span class="text-toned">{{ highlight(item).tail }}</span>
          </code>
          <span class="truncate text-xs text-muted">{{ t(item.descriptionKey, item.descriptionParams ?? {}) }}</span>
        </li>
        <li class="mt-1 border-t border-default px-3 pt-1.5 text-xs text-dimmed">
          {{ t('search.completionHint') }}
        </li>
      </ul>
    </div>

    <UButton
      type="submit"
      :size="size"
      :loading="loading"
      :disabled="!query.trim()"
      :label="t('search.submit')"
      icon="i-lucide-arrow-right"
    />
  </form>

  <!-- 只在接近上限时提示，避免常驻一行噪声。 -->
  <p v-if="length > 96" class="mt-1.5 text-xs" :class="length > 128 ? 'text-error' : 'text-dimmed'">
    {{ length > 128 ? t('search.lengthOver', { count: length }) : t('search.length', { count: length }) }}
  </p>
</template>
