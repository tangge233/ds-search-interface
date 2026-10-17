<script setup lang="ts">
import type { SyntaxCompletion, SyntaxSuggestion } from '~/utils/query-syntax'

/**
 * 搜索输入框：hero 与结果页共用。
 * 除表单提交外，它还承担「语法补全」——输入 site:、lang:、after: 时给出候选，
 * ↑↓ 选择、Tab / Enter 插入、Esc 关闭，插入后光标落在该继续输入的位置。
 */
const props = withDefaults(
  defineProps<{
    size?: 'md' | 'lg' | 'xl'
    loading?: boolean
    placeholder?: string
    autofocus?: boolean
  }>(),
  {
    size: 'lg',
    loading: false,
    placeholder: '输入关键词，或使用 site: lang: after: 等语法',
    autofocus: false
  }
)

const emit = defineEmits<{ submit: [] }>()

const query = defineModel<string>({ required: true })

const root = useTemplateRef<{ inputRef?: HTMLInputElement; $el?: HTMLElement } | null>('root')
/** 补全面板的 id 前缀：listbox 与选项都要被 input 用 aria-controls / aria-activedescendant 指到。 */
const uid = useId()
const caret = ref(0)
const activeIndex = ref(0)
const focused = ref(false)
/** Esc 关闭后不因同一次输入再次弹出，下一次击键再恢复提示。 */
const dismissed = ref(false)

function inputElement(): HTMLInputElement | null {
  const el = root.value?.inputRef ?? root.value?.$el?.querySelector('input')
  return el instanceof HTMLInputElement ? el : null
}

const completion = computed<SyntaxCompletion>(() => completeQuery(query.value, caret.value))
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
  dismissed.value = false
  activeIndex.value = 0
  // v-model 与 selectionStart 的更新时序不保证，下一帧再读光标位置。
  nextTick(syncCaret)
}

function onFocus() {
  focused.value = true
  syncCaret()
}

function onBlur() {
  focused.value = false
}

function accept(item: SyntaxSuggestion) {
  const token = completion.value.token
  if (!token) return

  const applied = applyCompletion(query.value, token, item)
  query.value = applied.query
  dismissed.value = false
  activeIndex.value = 0

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
    activeIndex.value = (activeIndex.value + step + items.length) % items.length
    return
  }
  if (event.key === 'Tab' || event.key === 'Enter') {
    // 面板打开时 Enter 用于插入候选，不再提交表单。
    event.preventDefault()
    const item = items[activeIndex.value]
    if (item) accept(item)
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

/** 已输入部分染成强调色，补全列表该有的样子。 */
function highlight(item: SyntaxSuggestion) {
  const typed = completion.value.token?.text.length ?? 0
  const cut = Math.min(typed, item.label.length)
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
        :placeholder="placeholder"
        icon="i-lucide-search"
        class="w-full"
        :ui="{ base: 'text-base' }"
        role="combobox"
        :aria-invalid="length > 128 || undefined"
        :aria-expanded="open"
        :aria-controls="open ? `${uid}-syntax` : undefined"
        :aria-activedescendant="open ? `${uid}-syntax-${activeIndex}` : undefined"
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
            aria-label="清空搜索词"
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
          @mouseenter="activeIndex = index"
          @mousedown.prevent="accept(item)"
        >
          <code class="shrink-0 font-mono text-sm">
            <span class="text-primary">{{ highlight(item).head }}</span><span class="text-toned">{{ highlight(item).tail }}</span>
          </code>
          <span class="truncate text-xs text-muted">{{ item.description }}</span>
        </li>
        <li class="mt-1 border-t border-default px-3 pt-1.5 text-xs text-dimmed">
          ↑↓ 选择 · Tab 插入 · Esc 关闭
        </li>
      </ul>
    </div>

    <UButton
      type="submit"
      :size="size"
      :loading="loading"
      :disabled="!query.trim()"
      label="搜索"
      icon="i-lucide-arrow-right"
    />
  </form>

  <!-- 只在接近上限时提示，避免常驻一行噪声。 -->
  <p v-if="length > 96" class="mt-1.5 text-xs" :class="length > 128 ? 'text-error' : 'text-dimmed'">
    {{ length }} / 128 个字符{{ length > 128 ? '，超出上限无法提交' : '' }}
  </p>
</template>
