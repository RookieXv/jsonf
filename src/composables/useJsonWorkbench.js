import { computed, ref, watch } from 'vue'
import {
  analyzeJson,
  formatJsonValue,
  getNodePreview,
  repairJson,
  sampleJson,
  sortObjectKeys,
} from '../services/jsonService'
import { buildTree, flattenTree } from '../services/treeService'
import { logger } from '../utils/logger'
import { readStorage, removeStorage, writeStorage } from '../utils/storage'
import { matchesTreeNode } from '../utils/treeSearch'

const STORAGE_KEY = 'workbench'
const STORAGE_VERSION = 2
const HISTORY_LIMIT = 100

/**
 * JSON 格式化工具的主状态容器。
 * 这个 composable 相当于一个轻量的功能级 store。
 */
export function useJsonWorkbench() {
  const stored = readStorage(STORAGE_KEY, null)
  const hasCurrentPreferences = stored?.version === STORAGE_VERSION

  const input = ref(stored?.input ?? sampleJson)
  const outputText = ref(stored?.outputText ?? '')
  const viewMode = ref(hasCurrentPreferences ? (stored?.viewMode ?? 'tree') : 'tree')
  const preserveEscapes = ref(hasCurrentPreferences ? (stored?.preserveEscapes ?? false) : false)
  const autoFormat = ref(hasCurrentPreferences ? (stored?.autoFormat ?? true) : true)
  const indent = ref(stored?.indent ?? '2')
  const sortInputKeys = ref(stored?.sortInputKeys ?? false)
  const sortOutputKeys = ref(stored?.sortOutputKeys ?? stored?.sortKeys ?? false)
  const inputBeforeSort = ref(stored?.inputBeforeSort ?? '')
  const inputBeforeEscape = ref(stored?.inputBeforeEscape ?? '')
  const trailingNewline = ref(stored?.trailingNewline ?? false)
  const lineWrap = ref(hasCurrentPreferences ? (stored?.lineWrap ?? true) : true)
  const lineNumbers = ref(stored?.lineNumbers ?? true)
  const fontSize = ref(stored?.fontSize ?? 13)
  const treeQuery = ref('')
  const outputQuery = ref('')
  const selectedNodeId = ref(null)
  const notice = ref('')
  const noticeTone = ref('info')
  const validationTone = ref('')
  const undoStack = ref([])
  const redoStack = ref([])
  let restoringHistory = false

  const result = computed(() =>
    analyzeJson(input.value, {
      indent: indent.value,
      preserveEscapes: preserveEscapes.value,
      sortOutputKeys: sortOutputKeys.value,
    }),
  )

  watch(
    result,
    (value) => {
      // 自动格式化只更新 Output 区；Input 区除非用户执行命令，否则不主动改写。
      if (value.status === 'invalid') {
        validationTone.value = 'invalid'
        outputText.value = ''
        return
      }
      if (value.status === 'idle') {
        validationTone.value = ''
        return
      }
      if (value.status === 'valid' && validationTone.value === 'invalid') {
        validationTone.value = ''
      }
      if (value.status === 'valid' && autoFormat.value && !restoringHistory) {
        outputText.value = value.pretty
      }
    },
    { immediate: true },
  )

  watch(autoFormat, (enabled) => {
    if (enabled && result.value.status === 'valid' && !restoringHistory) {
      outputText.value = result.value.pretty
    }
  })

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const output = computed(() => outputText.value)

  const tree = computed(() => (result.value.status === 'valid' ? buildTree(result.value.parsed) : null))
  const flatNodes = computed(() => flattenTree(tree.value))
  const filteredNodes = computed(() => {
    const query = treeQuery.value.trim()
    if (!query) return flatNodes.value
    return flatNodes.value.filter((node) => matchesTreeNode(node, query))
  })

  const selectedNode = computed(
    () => flatNodes.value.find((node) => node.id === selectedNodeId.value) ?? tree.value,
  )

  const status = computed(() => {
    if (result.value.status === 'idle') return 'idle'
    return result.value.status
  })

  const outputLineCount = computed(() => countLines(output.value))
  const inputLineCount = computed(() => countLines(input.value))

  watch(
    [
      input,
      outputText,
      viewMode,
      preserveEscapes,
      autoFormat,
      indent,
      sortInputKeys,
      sortOutputKeys,
      trailingNewline,
      lineWrap,
      lineNumbers,
      fontSize,
    ],
    () => {
      writeStorage(STORAGE_KEY, {
        version: STORAGE_VERSION,
        input: input.value,
        outputText: outputText.value,
        viewMode: viewMode.value,
        preserveEscapes: preserveEscapes.value,
        autoFormat: autoFormat.value,
        indent: indent.value,
        sortInputKeys: sortInputKeys.value,
        sortOutputKeys: sortOutputKeys.value,
        inputBeforeSort: inputBeforeSort.value,
        inputBeforeEscape: inputBeforeEscape.value,
        trailingNewline: trailingNewline.value,
        lineWrap: lineWrap.value,
        lineNumbers: lineNumbers.value,
        fontSize: fontSize.value,
      })
    },
    { deep: true },
  )

  function format() {
    if (result.value.status !== 'valid') {
      markInvalidAction()
      return
    }
    pushUndoSnapshot()
    input.value = applyTrailingNewline(result.value.standardPretty)
    syncOutputFromInput()
    logger.info('format json', { bytes: input.value.length })
  }

  function minify() {
    if (result.value.status !== 'valid') {
      markInvalidAction()
      return
    }
    pushUndoSnapshot()
    input.value = applyTrailingNewline(result.value.minified)
    syncOutputFromInput()
    logger.info('minify json')
  }

  function escapeInput() {
    if (result.value.status !== 'valid') {
      markInvalidAction()
      return
    }
    if (inputBeforeEscape.value) {
      pushUndoSnapshot()
      input.value = inputBeforeEscape.value
      inputBeforeEscape.value = ''
      syncOutputFromInput()
      logger.info('restore escaped input')
      return
    }
    pushUndoSnapshot()
    inputBeforeEscape.value = input.value
    input.value = result.value.escaped
    syncOutputFromInput()
    logger.info('escape input json')
  }

  function validate() {
    pulseValidation(result.value.status)
    showNotice(result.value.status === 'valid' ? 'validate-success' : 'validate-failed', result.value.status)
    logger.info('validate json', { status: result.value.status })
  }

  function setPreserveEscapes(value) {
    if (preserveEscapes.value === value) return
    pushUndoSnapshot()
    preserveEscapes.value = value
  }

  function setAutoFormat(value) {
    if (autoFormat.value === value) return
    pushUndoSnapshot()
    autoFormat.value = value
  }

  function setIndent(value) {
    if (indent.value === value) return
    pushUndoSnapshot()
    indent.value = value
  }

  function setViewMode(value) {
    if (viewMode.value === value) return
    pushUndoSnapshot()
    viewMode.value = value
  }

  function toggleSortOutputKeys() {
    pushUndoSnapshot()
    sortOutputKeys.value = !sortOutputKeys.value
  }

  function sortInput() {
    if (result.value.status !== 'valid') {
      markInvalidAction()
      return
    }
    if (sortInputKeys.value && inputBeforeSort.value) {
      pushUndoSnapshot()
      input.value = inputBeforeSort.value
      inputBeforeSort.value = ''
      sortInputKeys.value = false
      logger.info('restore input order')
      return
    }
    pushUndoSnapshot()
    inputBeforeSort.value = input.value
    input.value = formatJsonValue(sortObjectKeys(result.value.rawParsed), indent.value)
    sortInputKeys.value = true
    logger.info('sort input keys')
  }

  function repair() {
    try {
      const repaired = repairJson(input.value)
      pushUndoSnapshot()
      input.value = repaired
      syncOutputFromInput()
      showNotice('repair')
      logger.info('repair json success')
    } catch (error) {
      showNotice('repair-failed')
      logger.warn('repair json failed', error)
    }
  }

  function markInvalidAction() {
    pulseValidation('invalid')
    showNotice('action-needs-valid-json', 'invalid')
  }

  function pulseValidation(status) {
    validationTone.value = status === 'valid' ? 'valid' : 'invalid'
    if (status === 'valid') {
      window.setTimeout(() => {
        if (validationTone.value === 'valid') validationTone.value = ''
      }, 3000)
    }
  }

  function sendInputToOutput() {
    if (result.value.status !== 'valid') {
      markInvalidAction()
      return
    }
    pushUndoSnapshot()
    syncOutputFromInput()
  }

  function sendOutputToInput() {
    if (!outputText.value) return
    pushUndoSnapshot()
    input.value = outputText.value
    logger.info('send output to input')
  }

  function swapInputOutput() {
    if (!outputText.value) return
    pushUndoSnapshot()
    const nextInput = outputText.value
    outputText.value = input.value
    input.value = nextInput
    logger.info('swap input and output')
  }

  async function copy(value = outputText.value) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    showNotice('copy')
  }

  async function copySelectedNode() {
    if (!selectedNode.value) return
    await copy(getNodePreview(selectedNode.value.value))
  }

  function addNode() {
    if (!selectedNode.value || result.value.status !== 'valid') return
    const next = structuredClone(result.value.rawParsed)
    const target = resolveNode(next, selectedNode.value.path)
    let newPath = ''

    // 容器节点新增子节点，标量节点新增相邻兄弟节点，让混合结构的编辑行为更可预期。
    if (Array.isArray(target)) {
      target.push(null)
      newPath = `${selectedNode.value.path}[${target.length - 1}]`
    } else if (target && typeof target === 'object') {
      const key = getAvailableKey(target)
      target[key] = null
      newPath = joinPath(selectedNode.value.path, key)
    } else {
      newPath = addSiblingNode(next, selectedNode.value.path)
      if (!newPath) return
    }

    pushUndoSnapshot()
    input.value = formatJsonValue(next, indent.value)
    selectedNodeId.value = newPath
    showNotice('node-added')
    logger.info('add node', { path: newPath })
  }

  function extractSelectedNode() {
    if (!selectedNode.value) return
    pushUndoSnapshot()
    outputText.value = formatJsonValue(selectedNode.value.value, indent.value)
    viewMode.value = 'json'
    showNotice('node-extracted')
    logger.info('extract node', { path: selectedNode.value.path })
  }

  function updateSelectedNodeValue(rawValue) {
    if (!selectedNode.value || selectedNode.value.children.length || result.value.status !== 'valid') return
    const next = structuredClone(result.value.rawParsed)
    const parsed = parseTreeDraft(rawValue, selectedNode.value.type)
    setByPath(next, selectedNode.value.path, parsed)
    pushUndoSnapshot()
    input.value = formatJsonValue(next, indent.value)
    logger.info('edit node value', { path: selectedNode.value.path })
  }

  function renameSelectedNodeKey(newKey) {
    if (!selectedNode.value || !newKey || selectedNode.value.path === '$' || result.value.status !== 'valid') return
    const next = structuredClone(result.value.rawParsed)
    const nextPath = renameKeyByPath(next, selectedNode.value.path, newKey)
    if (!nextPath) return
    pushUndoSnapshot()
    input.value = formatJsonValue(next, indent.value)
    selectedNodeId.value = nextPath
    logger.info('rename node key', { path: nextPath })
  }

  function deleteNode() {
    if (!selectedNode.value || selectedNode.value.path === '$' || result.value.status !== 'valid') return
    const next = structuredClone(result.value.rawParsed)
    const removed = deleteByPath(next, selectedNode.value.path)
    if (!removed) return
    pushUndoSnapshot()
    selectedNodeId.value = '$'
    input.value = formatJsonValue(next, indent.value)
    showNotice('node-deleted')
    logger.info('delete node', { path: selectedNode.value.path })
  }

  function clear() {
    pushUndoSnapshot()
    input.value = ''
    outputText.value = ''
    outputQuery.value = ''
    treeQuery.value = ''
    selectedNodeId.value = null
    inputBeforeEscape.value = ''
    inputBeforeSort.value = ''
    removeStorage(STORAGE_KEY)
    logger.info('clear workbench')
  }

  function loadText(text) {
    pushUndoSnapshot()
    input.value = text
    if (!autoFormat.value) outputText.value = ''
    logger.info('load text', { bytes: text.length })
  }

  function updateOutput(value) {
    outputText.value = value
  }

  function syncOutputFromInput() {
    outputText.value = result.value.status === 'valid' ? result.value.pretty : ''
  }

  function showNotice(message, tone = 'info') {
    notice.value = message
    noticeTone.value = tone
    window.setTimeout(() => {
      if (notice.value === message) notice.value = ''
    }, 1800)
  }

  function undo() {
    const snapshot = undoStack.value.pop()
    if (!snapshot) return false
    redoStack.value.push(captureSnapshot())
    applySnapshot(snapshot)
    showNotice('undo')
    logger.info('undo workbench')
    return true
  }

  function redo() {
    const snapshot = redoStack.value.pop()
    if (!snapshot) return false
    undoStack.value.push(captureSnapshot())
    applySnapshot(snapshot)
    showNotice('redo')
    logger.info('redo workbench')
    return true
  }

  return {
    input,
    outputText,
    output,
    viewMode,
    preserveEscapes,
    autoFormat,
    indent,
    sortInputKeys,
    sortOutputKeys,
    inputBeforeEscape,
    trailingNewline,
    lineWrap,
    lineNumbers,
    fontSize,
    treeQuery,
    outputQuery,
    selectedNodeId,
    selectedNode,
    tree,
    filteredNodes,
    result,
    status,
    notice,
    noticeTone,
    validationTone,
    canUndo,
    canRedo,
    inputLineCount,
    outputLineCount,
    format,
    minify,
    validate,
    setPreserveEscapes,
    setAutoFormat,
    setIndent,
    setViewMode,
    repair,
    escapeInput,
    sortInput,
    toggleSortOutputKeys,
    sendInputToOutput,
    sendOutputToInput,
    swapInputOutput,
    copy,
    copySelectedNode,
    addNode,
    extractSelectedNode,
    updateSelectedNodeValue,
    renameSelectedNodeKey,
    deleteNode,
    clear,
    loadText,
    updateOutput,
    showNotice,
    undo,
    redo,
  }

  function pushUndoSnapshot() {
    const snapshot = captureSnapshot()
    const last = undoStack.value[undoStack.value.length - 1]
    if (last && snapshotsEqual(last, snapshot)) return
    undoStack.value = [...undoStack.value.slice(-(HISTORY_LIMIT - 1)), snapshot]
    redoStack.value = []
  }

  function captureSnapshot() {
    return {
      input: input.value,
      outputText: outputText.value,
      viewMode: viewMode.value,
      preserveEscapes: preserveEscapes.value,
      autoFormat: autoFormat.value,
      indent: indent.value,
      sortInputKeys: sortInputKeys.value,
      sortOutputKeys: sortOutputKeys.value,
      inputBeforeSort: inputBeforeSort.value,
      inputBeforeEscape: inputBeforeEscape.value,
      treeQuery: treeQuery.value,
      outputQuery: outputQuery.value,
      selectedNodeId: selectedNodeId.value,
    }
  }

  function applySnapshot(snapshot) {
    restoringHistory = true
    input.value = snapshot.input
    outputText.value = snapshot.outputText
    viewMode.value = snapshot.viewMode
    preserveEscapes.value = snapshot.preserveEscapes
    autoFormat.value = snapshot.autoFormat
    indent.value = snapshot.indent
    sortInputKeys.value = snapshot.sortInputKeys
    sortOutputKeys.value = snapshot.sortOutputKeys
    inputBeforeSort.value = snapshot.inputBeforeSort
    inputBeforeEscape.value = snapshot.inputBeforeEscape
    treeQuery.value = snapshot.treeQuery
    outputQuery.value = snapshot.outputQuery
    selectedNodeId.value = snapshot.selectedNodeId
    queueMicrotask(() => {
      restoringHistory = false
    })
  }

  function snapshotsEqual(left, right) {
    return Object.keys(left).every((key) => left[key] === right[key])
  }
}

function addSiblingNode(root, path) {
  if (path === '$') return ''
  const parts = parsePath(path)
  const key = parts.pop()
  const parent = parts.reduce((current, part) => current?.[part], root)

  if (Array.isArray(parent) && typeof key === 'number') {
    parent.splice(key + 1, 0, null)
    return joinParsedPath(parts, key + 1)
  }

  if (parent && typeof parent === 'object') {
    const newKey = getAvailableKey(parent)
    parent[newKey] = null
    return joinParsedPath(parts, newKey)
  }

  return ''
}

function countLines(value) {
  if (!value) return 0
  return value.split(/\r\n|\r|\n/).length
}

function applyTrailingNewline(value) {
  return value
}


function resolveNode(root, path) {
  return parsePath(path).reduce((current, key) => current?.[key], root)
}

function deleteByPath(root, path) {
  const parts = parsePath(path)
  const key = parts.pop()
  const parent = parts.reduce((current, part) => current?.[part], root)

  if (Array.isArray(parent) && typeof key === 'number') {
    parent.splice(key, 1)
    return true
  }

  if (parent && typeof parent === 'object' && key in parent) {
    delete parent[key]
    return true
  }

  return false
}

function setByPath(root, path, value) {
  const parts = parsePath(path)
  const key = parts.pop()
  const parent = parts.reduce((current, part) => current?.[part], root)

  if (parent == null || key == null) return false
  parent[key] = value
  return true
}

function renameKeyByPath(root, path, newKey) {
  const parts = parsePath(path)
  const key = parts.pop()
  const parent = parts.reduce((current, part) => current?.[part], root)

  if (!parent || Array.isArray(parent) || key == null || !(key in parent) || newKey in parent) return ''

  // 按原插入顺序重建对象，避免重命名 key 后节点在树视图中跳位置。
  const entries = Object.entries(parent)
  Object.keys(parent).forEach((item) => delete parent[item])
  entries.forEach(([entryKey, value]) => {
    parent[entryKey === key ? newKey : entryKey] = value
  })

  return joinParsedPath(parts, newKey)
}

function parsePath(path) {
  const parts = []
  let index = 1

  // 解析 treeService 生成的 JSONPath 子集：$.safeKey、$["odd-key"] 和 $[0]。
  // 这里不引入完整 JSONPath 依赖，保持树编辑逻辑轻量。
  while (index < path.length) {
    if (path[index] === '.') {
      const nextBracket = path.indexOf('[', index + 1)
      const nextDot = path.indexOf('.', index + 1)
      const next = [nextBracket, nextDot].filter((item) => item !== -1).sort((a, b) => a - b)[0] ?? path.length
      parts.push(path.slice(index + 1, next))
      index = next
      continue
    }

    if (path[index] === '[') {
      const end = path.indexOf(']', index)
      const content = path.slice(index + 1, end)
      parts.push(content.startsWith('"') ? JSON.parse(content) : Number(content))
      index = end + 1
      continue
    }

    index += 1
  }

  return parts
}

function getAvailableKey(target) {
  let index = 1
  while (`newKey${index}` in target) index += 1
  return `newKey${index}`
}

function joinPath(path, key) {
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return `${path}.${key}`
  return `${path}[${JSON.stringify(key)}]`
}

function joinParsedPath(parts, key) {
  const parentPath = parts.reduce((path, part) => {
    if (typeof part === 'number') return `${path}[${part}]`
    return joinPath(path, part)
  }, '$')
  return joinPath(parentPath, key)
}

function parseTreeDraft(value, type) {
  // 树节点内联编辑拿到的是 textContent，这里在语义明确时转回原 JSON 类型。
  if (type === 'string') return stripQuotes(value)
  if (type === 'number') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? value : parsed
  }
  if (type === 'boolean') return value === 'true'
  if (type === 'null') return value === 'null' ? null : value

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function stripQuotes(value) {
  const trimmed = value.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return trimmed.slice(1, -1)
    }
  }
  return value
}
