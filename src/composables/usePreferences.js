import { computed, ref, watchEffect } from 'vue'
import { messages } from '../config/i18n'
import { readStorage, writeStorage } from '../utils/storage'

const STORAGE_KEY = 'preferences'

/**
 * 工具平台外壳共享的用户偏好设置。
 */
export function usePreferences() {
  const stored = readStorage(STORAGE_KEY, {})
  const language = ref(stored.language ?? 'zh-CN')
  const theme = ref(stored.theme ?? 'light')
  const settingsOpen = ref(false)
  const t = computed(() => messages[language.value] ?? messages['zh-CN'])

  watchEffect(() => {
    writeStorage(STORAGE_KEY, {
      language: language.value,
      theme: theme.value,
    })
    document.documentElement.dataset.theme = theme.value
    document.documentElement.lang = language.value
  })

  function cycleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return {
    language,
    theme,
    settingsOpen,
    t,
    cycleTheme,
  }
}
