const PREFIX = 'jsonf:'

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
}

export function removeStorage(key) {
  localStorage.removeItem(`${PREFIX}${key}`)
}

export function clearJsonfStorage() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .forEach((key) => localStorage.removeItem(key))
}
