/**
 * 将 JSON 值转换成适合渲染的树模型。
 * 模型刻意保持简单，方便后续复用到搜索、复制和对比工具。
 */
export function buildTree(value, key = '$', path = '$') {
  const type = getJsonType(value)
  const node = {
    id: path,
    key,
    path,
    type,
    value,
    label: String(key),
    summary: getSummary(value, type),
    children: [],
  }

  if (type === 'object') {
    node.children = Object.keys(value).map((childKey) => buildTree(value[childKey], childKey, joinPath(path, childKey)))
  }

  if (type === 'array') {
    node.children = value.map((item, index) => buildTree(item, index, `${path}[${index}]`))
  }

  return node
}

export function flattenTree(node) {
  if (!node) return []
  return [node, ...node.children.flatMap(flattenTree)]
}

export function getJsonType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function getSummary(value, type) {
  if (type === 'object') return `{${Object.keys(value).length}}`
  if (type === 'array') return `[${value.length}]`
  if (type === 'string') return `"${value}"`
  return String(value)
}

function joinPath(path, key) {
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return `${path}.${key}`
  return `${path}[${JSON.stringify(key)}]`
}
