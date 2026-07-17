import { jsonrepair } from 'jsonrepair'

const DEFAULT_SAMPLE = {
  project: 'jsonf',
  description: 'Advanced JSON formatter workstation',
  features: ['format', 'minify', 'validate', 'repair', 'tree-inspector'],
  meta: {
    localOnly: true,
    preserveEscapes: 'line\\nbreak and quoted "value"',
  },
}

export const sampleJson = JSON.stringify(DEFAULT_SAMPLE, null, 2)

/**
 * 集中解析和转换 JSON，让组件只负责界面展示。
 */
export function analyzeJson(input, options) {
  const startedAt = performance.now()
  const trimmed = input.trim()

  if (!trimmed) {
    return buildResult({ input, status: 'idle', parseTime: 0 })
  }

  try {
    const parsed = JSON.parse(trimmed)
    const normalized = options.preserveEscapes ? parsed : unwrapEscapedStrings(parsed)
    const sorted = options.sortOutputKeys ? sortObjectKeys(normalized) : normalized
    // raw* 结果服务 Input 命令；展示结果服务 Output/树，避免展示型反转义污染原始输入区。
    const standardPretty = stringifyJson(parsed, options.indent)
    const pretty = formatJson(sorted, options.indent, options.preserveEscapes, input)
    const minified = JSON.stringify(parsed)
    const escaped = escapeJsonOutput(standardPretty)
    const raw = options.preserveEscapes ? preserveRawEscapes(input, pretty) : pretty
    const parseTime = performance.now() - startedAt

    return buildResult({
      input,
      status: 'valid',
      rawParsed: parsed,
      parsed: sorted,
      standardPretty,
      pretty,
      minified,
      escaped,
      raw,
      parseTime,
      stats: collectStats(sorted),
    })
  } catch (error) {
    const normalizedError = normalizeParseError(error, input)
    const location = getErrorLocation(input, normalizedError.position)
    return buildResult({
      input,
      status: 'invalid',
      error: {
        ...normalizedError,
        line: location?.line ?? null,
        column: location?.column ?? null,
      },
      parseTime: performance.now() - startedAt,
    })
  }
}

export function repairJson(input) {
  return jsonrepair(input)
}

export function getOutputByMode(result, mode) {
  if (result.status !== 'valid') return ''
  return result[mode] ?? result.pretty
}

export function getNodePreview(value) {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

function buildResult(partial) {
  const base = {
    status: 'idle',
    rawParsed: null,
    parsed: null,
    pretty: '',
    standardPretty: '',
    minified: '',
    raw: '',
    escaped: '',
    error: null,
    parseTime: 0,
    stats: {
      depth: 0,
      keys: 0,
      arrays: 0,
      objects: 0,
      scalars: 0,
    },
  }
  return { ...base, ...partial }
}

export function formatJsonValue(value, indent = '2') {
  return JSON.stringify(value, null, indent === 'tab' ? '\t' : Number(indent))
}

export function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map(sortObjectKeys)
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        acc[key] = sortObjectKeys(value[key])
        return acc
      }, {})
  }
  return value
}

function formatJson(value, indent, preserveEscapes, originalInput) {
  const formatted = stringifyJson(value, indent)
  return preserveEscapes ? preserveKnownEscapes(originalInput, formatted) : loosenNestedJsonStrings(formatted)
}

function stringifyJson(value, indent) {
  return JSON.stringify(value, null, indent === 'tab' ? '\t' : Number(indent))
}

function preserveRawEscapes(input, fallback) {
  return preserveKnownEscapes(input, fallback)
}

function escapeJsonOutput(value) {
  return JSON.stringify(value)
}

function collectStats(value) {
  const stats = {
    depth: 0,
    keys: 0,
    arrays: 0,
    objects: 0,
    scalars: 0,
  }

  walk(value, 1)
  return stats

  function walk(node, depth) {
    stats.depth = Math.max(stats.depth, depth)

    if (Array.isArray(node)) {
      stats.arrays += 1
      node.forEach((item) => walk(item, depth + 1))
      return
    }

    if (node && typeof node === 'object') {
      stats.objects += 1
      const keys = Object.keys(node)
      stats.keys += keys.length
      keys.forEach((key) => walk(node[key], depth + 1))
      return
    }

    stats.scalars += 1
  }
}

function normalizeParseError(error, input) {
  const message = error instanceof Error ? error.message : String(error)
  const match = message.match(/position\s+(\d+)/i)
  const tokenMatch = message.match(/Unexpected token '(.+?)'/i)
  // 各浏览器的 JSON.parse 错误信息并不完全一致；没有数字位置时尝试用 token 回退定位。
  const position = match ? Number(match[1]) : findTokenPosition(input, tokenMatch?.[1])

  return {
    message,
    position,
    line: null,
    column: null,
  }
}

function findTokenPosition(input, token) {
  if (!token) return null
  const position = input.indexOf(token)
  return position >= 0 ? position : null
}

export function getErrorLocation(input, position) {
  if (typeof position !== 'number') return null
  const before = input.slice(0, position)
  const lines = before.split(/\r\n|\r|\n/)
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}

function preserveKnownEscapes(input, fallback) {
  const escapedStrings = collectEscapedStringLiterals(input)
  if (!escapedStrings.size) return fallback
  return replaceStringLiterals(fallback, escapedStrings)
}

function collectEscapedStringLiterals(input) {
  const literals = new Map()
  let index = 0

  while (index < input.length) {
    if (input[index] !== '"') {
      index += 1
      continue
    }

    const end = findStringEnd(input, index)
    if (end < 0) break

    const token = input.slice(index, end + 1)
    const inner = token.slice(1, -1)
    if (hasEscapedDisplay(token)) {
      try {
        const parsed = JSON.parse(token)
        if (typeof parsed === 'string' && !literals.has(parsed)) {
          literals.set(parsed, inner)
        }
      } catch {
        // Invalid string tokens are ignored; JSON.parse will report the real input error elsewhere.
      }
    }

    index = end + 1
  }

  return literals
}

function replaceStringLiterals(value, literals) {
  let output = ''
  let index = 0

  while (index < value.length) {
    if (value[index] !== '"') {
      output += value[index]
      index += 1
      continue
    }

    const end = findStringEnd(value, index)
    if (end < 0) {
      output += value.slice(index)
      break
    }

    const token = value.slice(index, end + 1)
    output += restoreStringLiteral(token, literals)
    index = end + 1
  }

  return output
}

function restoreStringLiteral(token, literals) {
  try {
    const parsed = JSON.parse(token)
    const preserved = literals.get(parsed)
    return typeof preserved === 'string' ? `"${preserved}"` : token
  } catch {
    return token
  }
}

function loosenNestedJsonStrings(value) {
  let output = ''
  let index = 0

  while (index < value.length) {
    if (value[index] !== '"') {
      output += value[index]
      index += 1
      continue
    }

    const end = findStringEnd(value, index)
    if (end < 0) {
      output += value.slice(index)
      break
    }

    const token = value.slice(index, end + 1)
    output += loosenStringToken(token)
    index = end + 1
  }

  return output
}

function findStringEnd(value, start) {
  let escaped = false

  for (let index = start + 1; index < value.length; index += 1) {
    const char = value[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '"') return index
  }

  return -1
}

function loosenStringToken(token) {
  try {
    const parsed = JSON.parse(token)
    if (typeof parsed !== 'string') return token
    if (!hasEscapedDisplay(token) && !isNestedJsonString(parsed)) return token
    return `"${escapeLooseDisplayString(parsed)}"`
  } catch {
    return token
  }
}

function hasEscapedDisplay(token) {
  return /\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})/.test(token)
}

function isNestedJsonString(value) {
  const trimmed = value.trim()
  const looksLikeJson =
    (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))

  if (!looksLikeJson) return false

  try {
    JSON.parse(trimmed)
    return true
  } catch {
    return false
  }
}

function escapeLooseDisplayString(value) {
  return decodeLooseTextEscapes(value)
}

function decodeLooseTextEscapes(value) {
  return decodeHtmlEntities(value)
    .replace(/\\\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\\n/g, '\n')
    .replace(/\\\\r/g, '\r')
    .replace(/\\r/g, '\r')
    .replace(/\\\r/g, '\r')
    .replace(/\\\\t/g, '\t')
    .replace(/\\t/g, '\t')
    .replace(/\\\\b/g, '\b')
    .replace(/\\b/g, '\b')
    .replace(/\\\\f/g, '\f')
    .replace(/\\f/g, '\f')
    .replace(/\\\\(["\\/])/g, '$1')
    .replace(/\\(["\\/])/g, '$1')
}

function decodeHtmlEntities(value) {
  let decoded = value

  for (let index = 0; index < 3; index += 1) {
    const next = decodeHtmlEntityPass(decoded)
    if (next === decoded) return decoded
    decoded = next
  }

  return decoded
}

function decodeHtmlEntityPass(value) {
  return value
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
}

function unwrapEscapedStrings(value) {
  if (Array.isArray(value)) return value.map(unwrapEscapedStrings)
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = unwrapEscapedStrings(value[key])
      return acc
    }, {})
  }
  if (typeof value !== 'string') return value

  const trimmed = value.trim()
  if (!/^".*"$/.test(trimmed)) return decodeLooseTextEscapes(value)

  try {
    // API 日志中常见大 JSON 里嵌着 "\"hello\"" 这类字符串；这里只解包合法的 JSON 字符串字面量。
    const parsed = JSON.parse(trimmed)
    return typeof parsed === 'string' ? decodeLooseTextEscapes(parsed) : decodeLooseTextEscapes(value)
  } catch {
    return decodeLooseTextEscapes(value)
  }
}
