const enabled = import.meta.env.DEV

/**
 * Small browser logger used as an application seam for diagnostics.
 * In production it stays quiet unless upgraded later to a real telemetry adapter.
 */
export const logger = {
  info(message, payload) {
    if (enabled) console.info(`[JSONF] ${message}`, payload ?? '')
  },
  warn(message, payload) {
    if (enabled) console.warn(`[JSONF] ${message}`, payload ?? '')
  },
  error(message, payload) {
    if (enabled) console.error(`[JSONF] ${message}`, payload ?? '')
  },
}
