import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { messages } from '../config/i18n'
import { readStorage, writeStorage } from '../utils/storage'

const STORAGE_KEY = 'preferences'

/**
 * 工具平台外壳共享的用户偏好设置。
 */
export function usePreferences() {
  const stored = readStorage(STORAGE_KEY, {})
  const language = ref(stored.language ?? 'zh-CN')
  const theme = ref(['system', 'light', 'dark'].includes(stored.theme) ? stored.theme : 'system')
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const systemTheme = ref(mediaQuery.matches ? 'dark' : 'light')
  const settingsOpen = ref(false)
  const t = computed(() => messages[language.value] ?? messages['zh-CN'])
  const appliedTheme = computed(() => theme.value === 'system' ? systemTheme.value : theme.value)

  function syncSystemTheme(event = mediaQuery) {
    systemTheme.value = event.matches ? 'dark' : 'light'
  }

  onMounted(() => {
    mediaQuery.addEventListener('change', syncSystemTheme)
  })

  onBeforeUnmount(() => mediaQuery.removeEventListener('change', syncSystemTheme))

  watchEffect(() => {
    writeStorage(STORAGE_KEY, {
      language: language.value,
      theme: theme.value,
    })
    document.documentElement.dataset.theme = appliedTheme.value
    document.documentElement.lang = language.value
  })

  function cycleTheme() {
    theme.value = appliedTheme.value === 'light' ? 'dark' : 'light'
  }

  return {
    language,
    theme,
    appliedTheme,
    settingsOpen,
    t,
    cycleTheme,
  }
}
