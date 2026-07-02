<script setup>
import {
  ArrowLeft,
  ArrowDownAZ,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpDown,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  Eraser,
  FileUp,
  Languages,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  WandSparkles,
  WrapText,
} from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'
import IconButton from './components/IconButton.vue'
import JsonEditor from './components/JsonEditor.vue'
import JsonTreeNode from './components/JsonTreeNode.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { LANGUAGES } from './config/i18n'
import { tools } from './config/tools'
import { useJsonWorkbench } from './composables/useJsonWorkbench'
import { usePreferences } from './composables/usePreferences'
import { useResizablePanels } from './composables/useResizablePanels'
import { getNodePreview } from './services/jsonService'
import { logger } from './utils/logger'

const workbench = useJsonWorkbench()
const preferences = usePreferences()
const panels = useResizablePanels()
const fileInput = ref(null)
const inputCollapsed = ref(false)
const outputCollapsed = ref(false)
const inputEditorRef = ref(null)
const outputEditorRef = ref(null)
const contextMenu = ref(null)
const inputFolded = ref(false)
const outputFolded = ref(false)
const treeCollapseSignal = ref(0)
const treeExpandSignal = ref(0)
const treeSearchIndex = ref(-1)
const treeRevealId = ref('')
const jsonPath = ref('$')

const t = preferences.t
const currentTool = ref('formatter')

const statusLabel = computed(() => {
  if (workbench.status.value === 'valid') return t.value.status.valid
  if (workbench.status.value === 'invalid') return t.value.status.invalid
  return t.value.status.idle
})

const statusTone = computed(() => ({
  valid: workbench.status.value === 'valid',
  invalid: workbench.status.value === 'invalid',
}))

const selectedPreview = computed(() =>
  workbench.selectedNode.value ? getNodePreview(workbench.selectedNode.value.value) : '',
)

const inputErrorLabel = computed(() => {
  const error = workbench.result.value.error
  if (!error) return ''
  if (error.line && error.column) return `${t.value.editor.errorAt} ${error.line}:${error.column}`
  return 'Error'
})

const outputSearchMatches = computed(() => {
  const query = workbench.outputQuery.value.trim().toLowerCase()
  if (!query) return 0
  return workbench.output.value.toLowerCase().split(query).length - 1
})

const treeSearchMatches = computed(() => {
  const query = workbench.treeQuery.value.trim()
  return query ? workbench.filteredNodes.value.length : 0
})

const activeSearchMatches = computed(() =>
  workbench.viewMode.value === 'json' ? outputSearchMatches.value : treeSearchMatches.value,
)

const workspaceColumns = computed(() => {
  if (inputCollapsed.value && outputCollapsed.value) return '42px 42px 8px 42px'
  if (inputCollapsed.value) return '42px 42px 8px minmax(0, 1fr)'
  if (outputCollapsed.value) return 'minmax(0, 1fr) 42px 8px 42px'
  return panels.gridTemplateColumns.value
})

const indentOptions = computed(() => [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: t.value.status.tab },
])

const indentLabel = computed(
  () => indentOptions.value.find((option) => option.value === workbench.indent.value)?.label ?? workbench.indent.value,
)

function translateNotice(value) {
  const map = {
    copy: t.value.notices.copied,
    repair: t.value.notices.repaired,
    'repair-failed': t.value.notices.repairFailed,
    loaded: t.value.notices.loaded,
    downloaded: t.value.notices.downloaded,
    'node-added': t.value.notices.nodeAdded,
    'node-deleted': t.value.notices.nodeDeleted,
    'node-extracted': t.value.notices.nodeExtracted,
    'validate-success': t.value.notices.validateSuccess,
    'validate-failed': t.value.notices.validateFailed,
    'action-needs-valid-json': t.value.notices.actionNeedsValidJson,
  }
  return map[value] ?? value
}

function formatBytes(value) {
  const bytes = new Blob([value ?? '']).size
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

async function handleFile(file) {
  if (!file) return
  const text = await file.text()
  workbench.loadText(text)
  workbench.showNotice('loaded')
  logger.info('file loaded', { name: file.name, bytes: file.size })
}

function triggerUpload() {
  fileInput.value?.click()
}

function downloadOutput() {
  if (!workbench.output.value) return
  const blob = new Blob([workbench.output.value], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'jsonf-output.json'
  link.click()
  URL.revokeObjectURL(url)
  workbench.showNotice('downloaded')
}

function selectNode(node) {
  workbench.selectedNodeId.value = node.id
}

function handleTreeAction(payload) {
  const node = payload?.node
  if (node) selectNode(node)
  if (payload?.type === 'copy') workbench.copySelectedNode()
  if (payload?.type === 'extract') workbench.extractSelectedNode()
  if (payload?.type === 'add') {
    workbench.addNode()
    treeRevealId.value = workbench.selectedNodeId.value
    nextTick(scrollSelectedNodeIntoView)
  }
  if (payload?.type === 'delete') workbench.deleteNode()
  if (payload?.type === 'edit-value') workbench.updateSelectedNodeValue(payload.value)
  if (payload?.type === 'edit-key') workbench.renameSelectedNodeKey(payload.value)
  contextMenu.value = null
}

function openTreeContext(payload) {
  const node = payload?.node ?? payload
  if (!node) return
  selectNode(node)
  contextMenu.value = {
    node,
    x: Math.min(payload?.x ?? 0, window.innerWidth - 176),
    y: Math.min(payload?.y ?? 0, window.innerHeight - 142),
  }
}

function closeContextMenu() {
  contextMenu.value = null
}

function scrollSelectedNodeIntoView() {
  const selectedId = workbench.selectedNodeId.value
  if (!selectedId) return
  const row = Array.from(document.querySelectorAll('.tree-row')).find((element) => element.dataset.nodeId === selectedId)
  const pane = document.querySelector('.tree-scroll-pane')
  if (!row || !pane) return
  const rowRect = row.getBoundingClientRect()
  const paneRect = pane.getBoundingClientRect()
  const targetTop = pane.scrollTop + rowRect.top - paneRect.top - paneRect.height / 2 + rowRect.height / 2
  pane.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
}

function navigateJsonSearch(direction = 1) {
  const result = outputEditorRef.value?.selectText(workbench.outputQuery.value.trim(), direction)
  if (result?.line) jsonPath.value = inferJsonPath(workbench.outputText.value, result.line)
}

function navigateTreeSearch(direction = 1) {
  const nodes = workbench.filteredNodes.value
  if (!workbench.treeQuery.value.trim() || !nodes.length) return
  treeSearchIndex.value = (treeSearchIndex.value + direction + nodes.length) % nodes.length
  selectNode(nodes[treeSearchIndex.value])
  treeRevealId.value = nodes[treeSearchIndex.value].id
  nextTick(scrollSelectedNodeIntoView)
}

function navigateSearch(direction = 1) {
  if (workbench.viewMode.value === 'json') {
    navigateJsonSearch(direction)
    return
  }
  navigateTreeSearch(direction)
}

function toggleInputJsonFold() {
  inputEditorRef.value?.toggleAll()
  inputFolded.value = !inputFolded.value
}

function toggleOutputFold() {
  if (workbench.viewMode.value === 'json') {
    outputEditorRef.value?.toggleAll()
    outputFolded.value = !outputFolded.value
    return
  }
  if (outputFolded.value) {
    treeExpandSignal.value += 1
  } else {
    treeCollapseSignal.value += 1
  }
  outputFolded.value = !outputFolded.value
}

watch(
  () => workbench.outputQuery.value,
  (query) => {
    if (!query.trim()) jsonPath.value = '$'
  },
)

watch(
  () => workbench.treeQuery.value,
  () => {
    treeSearchIndex.value = -1
  },
)

watch(
  () => workbench.viewMode.value,
  () => {
    outputFolded.value = false
  },
)

function activeOutputPath() {
  return workbench.viewMode.value === 'json' ? jsonPath.value : (workbench.selectedNode.value?.path ?? '$')
}

function inferJsonPath(value, targetLine) {
  const lines = value.split(/\r\n|\r|\n/)
  const stack = []

  for (let index = 0; index < Math.min(targetLine, lines.length); index += 1) {
    const raw = lines[index]
    const trimmed = raw.trim()
    const indent = raw.search(/\S|$/)
    const level = Math.max(0, Math.floor(indent / 2))

    while (stack.length > level) stack.pop()

    const keyMatch = trimmed.match(/^"((?:\\.|[^"\\])*)"\s*:/)
    if (keyMatch) {
      stack[level] = JSON.parse(`"${keyMatch[1]}"`)
      stack.length = level + 1
    }
  }

  return stack.reduce((path, key) => {
    if (/^[A-Za-z_$][\w$]*$/.test(key)) return `${path}.${key}`
    return `${path}[${JSON.stringify(key)}]`
  }, '$')
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <img src="/favicon.svg" alt="" />
        </div>
        <div>
          <strong>JSONF</strong>
          <span v-if="t.appTagline">{{ t.appTagline }}</span>
        </div>
      </div>

      <nav class="tool-tabs" aria-label="tools">
        <button
          v-for="tool in tools"
          :key="tool.key"
          class="tool-tab"
          :class="{ active: currentTool === tool.key }"
          :disabled="tool.disabled"
          @click="currentTool = tool.key"
        >
          <component :is="tool.icon" :size="15" />
          {{ t.tools[tool.key] }}
        </button>
      </nav>

      <div class="topbar-actions">
        <button class="select-button" :title="t.commands.language">
          <Languages :size="15" />
          <select v-model="preferences.language.value" aria-label="language">
            <option v-for="language in LANGUAGES" :key="language.key" :value="language.key">
              {{ language.short }}
            </option>
          </select>
        </button>
        <IconButton :label="t.commands.theme" @click="preferences.cycleTheme">
          <Sun v-if="preferences.theme.value === 'light'" :size="16" />
          <Moon v-else :size="16" />
        </IconButton>
        <IconButton :label="t.commands.settings" @click="preferences.settingsOpen.value = true">
          <Settings :size="16" />
        </IconButton>
      </div>
    </header>

    <section class="commandbar">
      <div class="command-group">
        <IconButton :label="t.commands.format" @click="workbench.format">
          <Sparkles :size="16" />
          <template #label>{{ t.commands.format }}</template>
        </IconButton>
        <IconButton :label="t.commands.minify" @click="workbench.minify">
          <WrapText :size="16" />
          <template #label>{{ t.commands.minify }}</template>
        </IconButton>
        <IconButton :label="t.commands.validate" @click="workbench.validate">
          <CheckCircle2 :size="16" />
          <template #label>{{ t.commands.validate }}</template>
        </IconButton>
        <IconButton :label="t.commands.repair" @click="workbench.repair">
          <WandSparkles :size="16" />
          <template #label>{{ t.commands.repair }}</template>
        </IconButton>
        <IconButton
          :label="t.commands.escape"
          :class="{ active: workbench.inputBeforeEscape.value }"
          @click="workbench.escapeInput"
        >
          <WrapText :size="16" />
          <template #label>{{ t.commands.escape }}</template>
        </IconButton>
      </div>

      <div class="command-group">
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept="application/json,.json,text/json"
          @change="handleFile($event.target.files?.[0])"
        />
        <IconButton :label="t.commands.upload" @click="triggerUpload">
          <Upload :size="16" />
        </IconButton>
        <IconButton :label="t.commands.download" @click="downloadOutput">
          <Download :size="16" />
        </IconButton>
        <IconButton :label="t.commands.copy" @click="workbench.copy()">
          <Copy :size="16" />
        </IconButton>
        <IconButton :label="t.commands.clear" @click="workbench.clear">
          <Eraser :size="16" />
        </IconButton>
      </div>

      <div class="command-group command-group--right">
        <label class="switch-control">
          <input v-model="workbench.preserveEscapes.value" type="checkbox" />
          <span>{{ t.commands.preserveEscapes }}</span>
        </label>
        <label class="switch-control">
          <input v-model="workbench.autoFormat.value" type="checkbox" />
          <span>{{ t.commands.autoFormat }}</span>
        </label>
        <select v-model="workbench.indent.value" class="compact-select" :aria-label="t.status.indent">
          <option v-for="option in indentOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <span class="status-chip" :class="statusTone">
          <ShieldCheck :size="14" />
          {{ statusLabel }}
        </span>
      </div>
    </section>

    <main class="workspace" :style="{ gridTemplateColumns: workspaceColumns }" @click="closeContextMenu">
      <JsonEditor
        v-show="!inputCollapsed"
        ref="inputEditorRef"
        v-model="workbench.input.value"
        :title="t.editor.input"
        :placeholder="t.editor.placeholder"
        :line-numbers="workbench.lineNumbers.value"
        :line-wrap="workbench.lineWrap.value"
        :font-size="workbench.fontSize.value"
        :drop-hint="t.editor.dropHint"
        :error="workbench.result.value.error"
        :error-label="inputErrorLabel"
        :validation-tone="workbench.validationTone.value"
        @drop-file="handleFile"
      >
        <template #actions>
          <IconButton :label="t.commands.format" @click="workbench.format">
            <Sparkles :size="14" />
          </IconButton>
          <IconButton :label="t.commands.minify" @click="workbench.minify">
            <WrapText :size="14" />
          </IconButton>
          <IconButton :label="inputFolded ? t.commands.expandJson : t.commands.collapseJson" @click="toggleInputJsonFold">
            <ArrowUpDown :size="14" />
          </IconButton>
          <IconButton
            :label="t.commands.escape"
            :class="{ active: workbench.inputBeforeEscape.value }"
            @click="workbench.escapeInput"
          >
            <FileUp :size="14" />
          </IconButton>
          <button
            class="mini-toggle"
            :class="{ active: workbench.sortInputKeys.value }"
            :title="t.commands.sortKeys"
            :aria-label="t.commands.sortKeys"
            @click="workbench.sortInput"
          >
            <ArrowDownAZ :size="13" />
          </button>
          <IconButton :label="t.commands.collapseInput" @click="inputCollapsed = true">
            <PanelLeftClose :size="14" />
          </IconButton>
        </template>
      </JsonEditor>

      <button v-if="inputCollapsed" class="collapsed-rail collapsed-rail-input" @click="inputCollapsed = false">
        <PanelLeftOpen :size="16" />
        <span>Input</span>
      </button>

      <aside class="transfer-rail" aria-label="transfer">
        <IconButton label="Input to output" @click="workbench.sendInputToOutput">
          <ArrowRight :size="17" />
        </IconButton>
        <IconButton label="Swap" @click="workbench.swapInputOutput">
          <ArrowRightLeft :size="17" />
        </IconButton>
        <IconButton label="Output to input" @click="workbench.sendOutputToInput">
          <ArrowLeft :size="17" />
        </IconButton>
      </aside>

      <div
        v-show="!inputCollapsed && !outputCollapsed"
        class="splitter splitter-left"
        title="Resize"
        @mousedown="panels.startResize(0, $event)"
      />

      <section v-show="!outputCollapsed" class="output-panel">
        <header class="panel-header">
          <div>
            <p class="panel-kicker">{{ t.editor.output }}</p>
          </div>
          <div class="output-tools">
            <div class="segmented-control">
              <button
                v-for="mode in ['json', 'tree']"
                :key="mode"
                :class="{ active: workbench.viewMode.value === mode }"
                @click="workbench.viewMode.value = mode"
              >
                {{ t.modes[mode] }}
              </button>
            </div>
            <label class="search-pill">
              <Search :size="14" />
              <input
                v-if="workbench.viewMode.value === 'json'"
                v-model="workbench.outputQuery.value"
                :placeholder="t.editor.searchText"
                @keydown.enter.prevent="navigateSearch(1)"
              />
              <input
                v-else
                v-model="workbench.treeQuery.value"
                :placeholder="t.editor.searchTree"
                @keydown.enter.prevent="navigateSearch(1)"
              />
              <span v-if="activeSearchMatches" class="match-count">
                {{ activeSearchMatches }} {{ t.editor.searchMatches }}
              </span>
              <button type="button" class="search-step" :disabled="!activeSearchMatches" @click.prevent="navigateSearch(-1)">↑</button>
              <button type="button" class="search-step" :disabled="!activeSearchMatches" @click.prevent="navigateSearch(1)">↓</button>
            </label>
            <button
              class="mini-toggle"
              :class="{ active: workbench.sortOutputKeys.value }"
              :title="t.commands.sortKeys"
              :aria-label="t.commands.sortKeys"
              @click="workbench.sortOutputKeys.value = !workbench.sortOutputKeys.value"
            >
              <ArrowDownAZ :size="13" />
            </button>
            <IconButton
              :label="outputFolded ? t.commands.expandJson : t.commands.collapseJson"
              @click="toggleOutputFold"
            >
              <ArrowUpDown :size="14" />
            </IconButton>
            <IconButton :label="t.commands.collapseOutput" @click="outputCollapsed = true">
              <PanelRightClose :size="14" />
            </IconButton>
          </div>
        </header>

        <div class="path-bar">
          <span class="path-marker">PATH</span>
          <span class="path-value">{{ activeOutputPath() }}</span>
          <span v-if="workbench.viewMode.value === 'tree' && workbench.selectedNode.value" class="type-badge">
            {{ workbench.selectedNode.value.type }}
          </span>
        </div>

        <JsonEditor
          v-if="workbench.viewMode.value === 'json'"
          ref="outputEditorRef"
          :model-value="workbench.outputText.value"
          title=""
          :line-numbers="workbench.lineNumbers.value"
          :line-wrap="workbench.lineWrap.value"
        :font-size="workbench.fontSize.value"
        :search-query="workbench.outputQuery.value"
        @update:model-value="workbench.updateOutput"
      />
        <div v-else class="output-tree-view">
          <div class="tree-scroll-pane">
            <JsonTreeNode
              v-if="workbench.tree.value"
              :node="workbench.tree.value"
              :selected-id="workbench.selectedNodeId.value"
              :query="workbench.treeQuery.value"
              :expand-signal="treeExpandSignal"
              :collapse-signal="treeCollapseSignal"
              :reveal-id="treeRevealId"
              @select="selectNode"
              @action="handleTreeAction"
              @context="openTreeContext"
            />
            <p v-else class="empty-state">{{ t.editor.emptyTree }}</p>
          </div>

          <section class="node-details output-node-details">
            <header>
              <span>{{ t.editor.selectedNode }}</span>
              <span v-if="workbench.selectedNode.value" class="type-badge">
                {{ workbench.selectedNode.value.type }}
              </span>
            </header>
            <p class="node-path">{{ workbench.selectedNode.value?.path ?? t.editor.noNode }}</p>
            <pre v-if="workbench.selectedNode.value" class="node-preview">{{ selectedPreview }}</pre>
            <button
              v-if="workbench.selectedNode.value"
              class="copy-path"
              @click.stop="workbench.copy(workbench.selectedNode.value.path)"
            >
              <Clipboard :size="14" />
              {{ t.commands.copyPath }}
            </button>
            <button v-if="workbench.selectedNode.value" class="copy-path" @click.stop="workbench.copySelectedNode">
              <Copy :size="14" />
              {{ t.commands.copyValue }}
            </button>
            <button v-if="workbench.selectedNode.value" class="copy-path" @click.stop="workbench.extractSelectedNode">
              <FileUp :size="14" />
              {{ t.commands.extractNode }}
            </button>
            <button
              v-if="workbench.selectedNode.value"
              class="copy-path"
              @click.stop="handleTreeAction({ type: 'add', node: workbench.selectedNode.value })"
            >
              <Sparkles :size="14" />
              {{ t.commands.addNode }}
            </button>
            <button
              v-if="workbench.selectedNode.value && workbench.selectedNode.value.path !== '$'"
              class="copy-path danger-action"
              @click.stop="workbench.deleteNode"
            >
              <Eraser :size="14" />
              {{ t.commands.deleteNode }}
            </button>
          </section>
        </div>
      </section>

      <button v-if="outputCollapsed" class="collapsed-rail collapsed-rail-output" @click="outputCollapsed = false">
        <PanelRightOpen :size="16" />
        <span>Output</span>
      </button>

      <div
        v-if="contextMenu"
        class="tree-context-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <button @click="handleTreeAction({ type: 'copy', node: contextMenu.node })">
          <Copy :size="13" />
          {{ t.commands.copyValue }}
        </button>
        <button @click="handleTreeAction({ type: 'extract', node: contextMenu.node })">
          <FileUp :size="13" />
          {{ t.commands.extractNode }}
        </button>
        <button @click="handleTreeAction({ type: 'add', node: contextMenu.node })">
          <Sparkles :size="13" />
          {{ t.commands.addNode }}
        </button>
        <button
          v-if="contextMenu.node.path !== '$'"
          class="danger-action"
          @click="handleTreeAction({ type: 'delete', node: contextMenu.node })"
        >
          <Eraser :size="13" />
          {{ t.commands.deleteNode }}
        </button>
      </div>
    </main>

    <footer class="statusbar">
      <span :class="['status-dot', workbench.status.value]" />
      <span>{{ statusLabel }}</span>
      <span>{{ t.status.parseTime }} {{ workbench.result.value.parseTime.toFixed(2) }} ms</span>
      <span>{{ t.status.inputSize }} {{ formatBytes(workbench.input.value) }}</span>
      <span>{{ t.status.outputSize }} {{ formatBytes(workbench.output.value) }}</span>
      <span>{{ t.status.lines }} {{ workbench.inputLineCount.value }} / {{ workbench.outputLineCount.value }}</span>
      <span>{{ t.status.depth }} {{ workbench.result.value.stats.depth }}</span>
      <span>{{ t.status.indent }} {{ indentLabel }}</span>
      <span>{{ t.status.encoding }}</span>
      <span class="privacy"><ShieldCheck :size="13" /> {{ t.status.localOnly }}</span>
    </footer>

    <div v-if="workbench.notice.value" class="toast" :class="`toast-${workbench.noticeTone.value}`">
      {{ translateNotice(workbench.notice.value) }}
    </div>

    <SettingsPanel
      :open="preferences.settingsOpen.value"
      :t="t"
      :indent="workbench.indent.value"
      :trailing-newline="workbench.trailingNewline.value"
      :font-size="workbench.fontSize.value"
      :line-wrap="workbench.lineWrap.value"
      :line-numbers="workbench.lineNumbers.value"
      @close="preferences.settingsOpen.value = false"
      @update:indent="workbench.indent.value = $event"
      @update:trailing-newline="workbench.trailingNewline.value = $event"
      @update:font-size="workbench.fontSize.value = $event"
      @update:line-wrap="workbench.lineWrap.value = $event"
      @update:line-numbers="workbench.lineNumbers.value = $event"
    />
  </div>
</template>
