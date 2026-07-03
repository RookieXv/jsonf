<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { AlertCircle, FileUp } from '@lucide/vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  title: { type: String, required: true },
  readonly: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  lineNumbers: { type: Boolean, default: true },
  lineWrap: { type: Boolean, default: false },
  fontSize: { type: Number, default: 13 },
  error: { type: Object, default: null },
  errorLabel: { type: String, default: '' },
  validationTone: { type: String, default: '' },
  dropHint: { type: String, default: '' },
  foldEnabled: { type: Boolean, default: true },
  searchQuery: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'drop-file'])
const textareaRef = ref(null)
const scrollTop = ref(0)
const scrollLeft = ref(0)
const cursorLine = ref(1)
const foldedRanges = ref([])
const searchCursor = ref(-1)

const sourceLines = computed(() => props.modelValue.split(/\r\n|\r|\n/))
const foldRanges = computed(() => collectFoldRanges(sourceLines.value))
const visibleLines = computed(() => buildVisibleLines(sourceLines.value, foldedRanges.value))
const lines = computed(() => Math.max(1, visibleLines.value.length))
const lineNumbersText = computed(() =>
  Array.from({ length: lines.value }, (_, index) => index + 1).join('\n'),
)
const visibleText = computed(() => visibleLines.value.map((item) => item.text).join('\n'))
const foldMarkers = computed(() =>
  foldRanges.value
    .map((range) => {
      const visibleIndex = visibleLines.value.findIndex((item) => item.sourceLine === range.start)
      if (visibleIndex === -1) return null
      return {
        ...range,
        visibleLine: visibleIndex + 1,
        folded: isFolded(range.start),
      }
    })
    .filter(Boolean),
)
const highlightedHtml = computed(() => highlightJson(visibleText.value, props.searchQuery))
const searchVisibleLines = computed(() => {
  const query = props.searchQuery.trim().toLowerCase()
  if (!query) return []
  return visibleLines.value
    .map((item, index) => ({ item, visibleLine: index + 1 }))
    .filter(({ item }) => item.text.toLowerCase().includes(query))
})
const activeVisibleLine = computed(() => {
  const index = visibleLines.value.findIndex((item) => item.sourceLine === cursorLine.value)
  return index === -1 ? 0 : index + 1
})

watch(
  () => props.searchQuery,
  () => {
    searchCursor.value = -1
  },
)

function onDrop(event) {
  const file = event.dataTransfer?.files?.[0]
  if (file) emit('drop-file', file)
}

function onScroll(event) {
  scrollTop.value = event.target.scrollTop
  scrollLeft.value = event.target.scrollLeft
}

function onWheel(event) {
  // 覆盖层可见但不负责滚动，因此把滚轮位移转交给真正持有滚动状态的 textarea。
  if (!textareaRef.value || event.target === textareaRef.value) return
  textareaRef.value.scrollTop += event.deltaY
  textareaRef.value.scrollLeft += event.deltaX
  scrollTop.value = textareaRef.value.scrollTop
  scrollLeft.value = textareaRef.value.scrollLeft
}

function onInput(event) {
  foldedRanges.value = []
  updateCursorLine(event)
  emit('update:modelValue', event.target.value)
}

function updateCursorLine(event) {
  const target = event?.target ?? textareaRef.value
  if (!target) return
  cursorLine.value = target.value.slice(0, target.selectionStart ?? 0).split(/\r\n|\r|\n/).length
}

function selectText(query, direction = 1) {
  if (!query || !textareaRef.value) return 0
  // 搜索基于源文本位置；选中前先展开，避免折叠区域隐藏当前命中项。
  expandAll(false)
  const matches = findMatches(props.modelValue, query)
  if (!matches.length) return 0
  searchCursor.value = getNextSearchIndex(matches, direction)
  const index = matches[searchCursor.value]
  if (index === -1) return 0
  textareaRef.value.setSelectionRange(index, index + query.length)
  scrollSelectionIntoView(index)
  updateCursorLine()
  return {
    found: true,
    index,
    line: props.modelValue.slice(0, index).split(/\r\n|\r|\n/).length,
  }
}

defineExpose({
  selectText,
  toggleAll,
  collapseAll,
  expandAll,
})

function toggleFold(range) {
  if (!props.foldEnabled || range.end <= range.start) return
  if (isFolded(range.start)) {
    foldedRanges.value = foldedRanges.value.filter((item) => item.start !== range.start)
    return
  }
  foldedRanges.value = [...foldedRanges.value, range]
}

function collapseAll() {
  foldedRanges.value = foldRanges.value.filter((range) => range.end > range.start)
  resetScrollToTop()
}

function expandAll(reset = true) {
  foldedRanges.value = []
  if (reset) resetScrollToTop()
}

function isFolded(start) {
  return foldedRanges.value.some((range) => range.start === start)
}

function toggleAll() {
  if (foldedRanges.value.length) {
    expandAll()
    return
  }
  collapseAll()
}

function resetScrollToTop() {
  nextTick(() => {
    if (!textareaRef.value) return
    textareaRef.value.scrollTop = 0
    textareaRef.value.scrollLeft = 0
    textareaRef.value.setSelectionRange(0, 0)
    scrollTop.value = 0
    scrollLeft.value = 0
    cursorLine.value = 1
  })
}

function scrollSelectionIntoView(index) {
  nextTick(() => {
    if (!textareaRef.value) return
    const line = props.modelValue.slice(0, index).split(/\r\n|\r|\n/).length
    const lineHeight = props.fontSize * 1.62
    const targetTop = Math.max(0, (line - 2) * lineHeight)
    textareaRef.value.scrollTo({ top: targetTop, behavior: 'smooth' })
    scrollTop.value = targetTop
  })
}

function highlightJson(value, query = '') {
  // 语法高亮渲染在透明 textarea 背后的 inert pre 中，textarea 仍是可访问的真实编辑面。
  return escapeHtml(value).replace(
    /("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (token) => {
      let type = 'number'
      if (token.startsWith('"')) type = token.trim().endsWith(':') ? 'key' : 'string'
      if (token === 'true' || token === 'false') type = 'boolean'
      if (token === 'null') type = 'null'
      return `<span class="json-token json-token-${type}">${token}</span>`
    },
  ).replace(/([^<>]+)(?=<|$)/g, (text) => markSearch(text, query))
}

function collectFoldRanges(linesValue) {
  const stack = []
  const ranges = []

  // 编辑器主要处理格式化后的 JSON，按括号所在行匹配即可实现轻量折叠，避免热路径引入解析器。
  linesValue.forEach((line, index) => {
    if (/:\s*[\[{]\s*$|^[\s]*[\[{]\s*$/.test(line)) {
      stack.push(index + 1)
    }

    if (/^[\s]*[\]}]/.test(line) && stack.length) {
      const start = stack.pop()
      if (index + 1 > start) ranges.push({ start, end: index + 1 })
    }
  })

  return ranges.sort((a, b) => a.start - b.start)
}

function buildVisibleLines(linesValue, ranges) {
  const visible = []
  let index = 0

  while (index < linesValue.length) {
    const lineNumber = index + 1
    const range = ranges.find((item) => item.start === lineNumber)

    if (range) {
      const closeLine = linesValue[range.end - 1]?.trim() ?? ''
      visible.push({
        sourceLine: lineNumber,
        text: `${linesValue[index]} … ${closeLine}`,
        folded: true,
      })
      index = range.end
      continue
    }

    visible.push({
      sourceLine: lineNumber,
      text: linesValue[index],
      folded: false,
    })
    index += 1
  }

  return visible.length ? visible : [{ sourceLine: 1, text: '', folded: false }]
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function markSearch(escapedValue, query) {
  if (!query) return escapedValue
  const escapedQuery = escapeHtml(query)
  if (!escapedQuery) return escapedValue
  return escapedValue.replace(new RegExp(escapeRegExp(escapedQuery), 'gi'), (match) => `<mark class="search-hit">${match}</mark>`)
}

function findMatches(value, query) {
  const source = value.toLowerCase()
  const target = query.toLowerCase()
  const matches = []
  let index = source.indexOf(target)

  while (index !== -1) {
    matches.push(index)
    index = source.indexOf(target, index + Math.max(1, target.length))
  }

  return matches
}

function getNextSearchIndex(matches, direction) {
  if (searchCursor.value < 0) return direction > 0 ? 0 : matches.length - 1
  return (searchCursor.value + direction + matches.length) % matches.length
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>

<template>
  <section class="editor-panel" :class="[`validation-${validationTone}`]" @dragover.prevent @drop.prevent="onDrop">
    <header class="panel-header">
      <div>
        <p class="panel-kicker">{{ title }}</p>
        <p v-if="dropHint" class="panel-subtitle">
          <FileUp :size="13" />
          {{ dropHint }}
        </p>
      </div>
      <div class="panel-actions">
        <slot name="actions" />
        <div v-if="error" class="error-pill">
          <AlertCircle :size="14" />
          {{ errorLabel || 'Error' }}
        </div>
      </div>
    </header>

    <div
      class="editor-shell"
      :class="{ 'is-wrapped': lineWrap, 'has-lines': lineNumbers }"
      :style="{ '--code-size': `${fontSize}px` }"
      @wheel="onWheel"
    >
      <pre
        v-if="lineNumbers"
        class="line-numbers"
        :style="{ transform: `translateY(-${scrollTop}px)` }"
        aria-hidden="true"
      >{{ lineNumbersText }}</pre>
      <div
        v-if="lineNumbers"
        class="fold-markers"
        :style="{ transform: `translateY(-${scrollTop}px)` }"
      >
        <button
          v-for="marker in foldMarkers"
          :key="marker.start"
          type="button"
          class="fold-marker"
          :class="{ folded: marker.folded }"
          :style="{ top: `calc(14px + ${(marker.visibleLine - 1) * fontSize * 1.62}px)` }"
          :aria-label="marker.folded ? 'Expand JSON node' : 'Collapse JSON node'"
          @mousedown.prevent
          @click.stop="toggleFold(marker)"
        />
      </div>
      <span
        v-for="line in searchVisibleLines"
        :key="`search-${line.visibleLine}`"
        class="search-line-highlight"
        :style="{
          top: `calc(14px + ${(line.visibleLine - 1) * fontSize * 1.62}px - ${scrollTop}px)`,
          height: `${fontSize * 1.62}px`,
        }"
        aria-hidden="true"
      />
      <span
        v-if="activeVisibleLine"
        class="cursor-line-highlight"
        :style="{
          top: `calc(14px + ${(activeVisibleLine - 1) * fontSize * 1.62}px - ${scrollTop}px)`,
          height: `${fontSize * 1.62}px`,
        }"
        aria-hidden="true"
      />
      <pre
        class="code-highlight"
        :style="{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }"
        aria-hidden="true"
        v-html="highlightedHtml"
      />
      <textarea
        ref="textareaRef"
        class="code-input"
        spellcheck="false"
        :readonly="readonly"
        :placeholder="placeholder"
        :value="modelValue"
        @scroll="onScroll"
        @click="updateCursorLine"
        @keyup="updateCursorLine"
        @select="updateCursorLine"
        @input="onInput"
      />
    </div>
  </section>
</template>
