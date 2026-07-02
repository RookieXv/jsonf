<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronRight, Copy, Plus, Scissors, Trash2 } from '@lucide/vue'
import { matchesTreeNode } from '../utils/treeSearch'

const props = defineProps({
  node: { type: Object, required: true },
  selectedId: { type: String, default: '' },
  depth: { type: Number, default: 0 },
  query: { type: String, default: '' },
  expandSignal: { type: Number, default: 0 },
  collapseSignal: { type: Number, default: 0 },
  revealId: { type: String, default: '' },
})

const emit = defineEmits(['select', 'action', 'context'])
const open = ref(props.depth < 2)

const hasChildren = computed(() => props.node.children.length > 0)
const isSelected = computed(() => props.selectedId === props.node.id)
const isMatched = computed(() => {
  return matchesTreeNode(props.node, props.query)
})
const shouldReveal = computed(() => !!props.revealId && isSameOrAncestorPath(props.node.id, props.revealId))
const highlightedLabel = computed(() => markTreeSearch(props.node.label, props.query))
const highlightedSummary = computed(() => markTreeSearch(props.node.summary, props.query))

watch(
  () => props.expandSignal,
  () => {
    if (props.expandSignal > 0) open.value = true
  },
  { immediate: true },
)

watch(
  () => props.collapseSignal,
  () => {
    open.value = props.depth === 0
  },
)

watch(
  () => props.revealId,
  () => {
    if (shouldReveal.value) open.value = true
  },
  { immediate: true },
)

function selectNode() {
  emit('select', props.node)
}

function commitKey(event) {
  const value = event.target.textContent.trim()
  emit('action', { type: 'edit-key', node: props.node, value })
  event.target.blur()
}

function commitValue(event) {
  const value = event.target.textContent.trim()
  emit('action', { type: 'edit-value', node: props.node, value })
  event.target.blur()
}

function commitOnEnter(event, commit) {
  event.preventDefault()
  commit(event)
}

function isSameOrAncestorPath(path, target) {
  if (path === target) return true
  if (path === '$') return target.startsWith('$.') || target.startsWith('$[')
  return target.startsWith(`${path}.`) || target.startsWith(`${path}[`)
}

function markTreeSearch(value, query) {
  const escaped = escapeHtml(String(value))
  const target = query.trim()
  if (!target) return escaped
  return escaped.replace(new RegExp(escapeRegExp(escapeHtml(target)), 'gi'), (match) => `<mark class="search-hit">${match}</mark>`)
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>

<template>
  <div class="tree-node">
    <button
      class="tree-row"
      :class="{ selected: isSelected, matched: isMatched }"
      :data-node-id="node.id"
      :style="{ paddingLeft: `${depth * 14 + 8}px` }"
      @click="selectNode"
      @contextmenu.prevent="$emit('context', { node, x: $event.clientX, y: $event.clientY })"
    >
      <span class="tree-actions" @click.stop>
        <button title="Copy" @click="$emit('action', { type: 'copy', node })"><Copy :size="11" /></button>
        <button title="Extract" @click="$emit('action', { type: 'extract', node })"><Scissors :size="11" /></button>
        <button title="Add" @click="$emit('action', { type: 'add', node })"><Plus :size="11" /></button>
        <button v-if="node.path !== '$'" title="Delete" @click="$emit('action', { type: 'delete', node })"><Trash2 :size="11" /></button>
      </span>
      <span class="tree-caret" @click.stop="open = !open">
        <ChevronRight v-if="hasChildren" :size="13" :class="{ open }" />
      </span>
      <span
        class="tree-key"
        :contenteditable="node.path !== '$' && !/^\\d+$/.test(String(node.key))"
        spellcheck="false"
        @click.stop="selectNode"
        @blur="commitKey"
        @keydown.enter="commitOnEnter($event, commitKey)"
        v-html="highlightedLabel"
      />
      <span class="type-badge">{{ node.type }}</span>
      <span
        class="tree-summary"
        :contenteditable="!hasChildren"
        spellcheck="false"
        @click.stop="selectNode"
        @blur="commitValue"
        @keydown.enter="commitOnEnter($event, commitValue)"
        v-html="highlightedSummary"
      />
    </button>

    <div v-if="hasChildren && open">
      <JsonTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        :depth="depth + 1"
        :query="query"
        :expand-signal="expandSignal"
        :collapse-signal="collapseSignal"
        :reveal-id="revealId"
        @select="$emit('select', $event)"
        @action="$emit('action', $event)"
        @context="$emit('context', $event)"
      />
    </div>
  </div>
</template>
