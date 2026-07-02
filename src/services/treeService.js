/**
 * Convert JSON values to a render-friendly tree model.
 * The model is intentionally plain so it can later power search, copy, and compare tools.
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
    node.children = Object.keys(value).map((childKey) =>
      buildTree(value[childKey], childKey, joinPath(path, childKey)),
    )
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
  if (type === 'string') return `"${truncate(value, 42)}"`
  return String(value)
}

function truncate(value, max) {
  return value.length > max ? `${value.slice(0, max)}...` : value
}

function joinPath(path, key) {
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return `${path}.${key}`
  return `${path}[${JSON.stringify(key)}]`
}
