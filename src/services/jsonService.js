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
 * Parse and transform JSON in one place so components stay presentation-focused.
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
    const pretty = formatJson(sorted, options.indent, options.preserveEscapes, input)
    const minified = JSON.stringify(sorted)
    const escaped = escapeJsonOutput(pretty)
    const raw = options.preserveEscapes ? preserveRawEscapes(input, pretty) : pretty
    const parseTime = performance.now() - startedAt

    return buildResult({
      input,
      status: 'valid',
      parsed: sorted,
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
    parsed: null,
    pretty: '',
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
  const formatted = JSON.stringify(value, null, indent === 'tab' ? '\t' : Number(indent))
  return preserveEscapes ? preserveKnownEscapes(originalInput, formatted) : formatted
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
  // JSON.stringify already keeps required backslash and quote escapes.
  // This mode must never invent new unicode escapes when the input did not use them.
  if (!/\\u[0-9a-fA-F]{4}/.test(input)) return fallback
  return fallback
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
  if (!/^".*"$/.test(trimmed)) return value

  try {
    const parsed = JSON.parse(trimmed)
    return typeof parsed === 'string' ? parsed : value
  } catch {
    return value
  }
}
