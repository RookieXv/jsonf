import { computed, ref, watch } from 'vue'
import { readStorage, writeStorage } from '../utils/storage'

const STORAGE_KEY = 'panel-widths'
const DEFAULT = [48, 52]

/**
 * 管理工作区的两列可拖拽宽度。
 * 宽度按比例保存，避免窗口尺寸变化后布局失真。
 */
export function useResizablePanels() {
  const widths = ref(readStorage(STORAGE_KEY, DEFAULT))
  const normalizedWidths = computed(() => (widths.value.length === 2 ? widths.value : DEFAULT))
  const gridTemplateColumns = computed(() => `${normalizedWidths.value[0]}fr 42px 8px ${normalizedWidths.value[1]}fr`)

  watch(widths, (value) => writeStorage(STORAGE_KEY, value.slice(0, 2)), { deep: true })

  function startResize(index, event) {
    const startX = event.clientX
    const start = [...widths.value]
    const total = start[0] + start[1]

    const handleMove = (moveEvent) => {
      const delta = ((moveEvent.clientX - startX) / window.innerWidth) * total
      const next = [...start]
      next[index] = clamp(start[index] + delta, 18, 60)
      next[index + 1] = clamp(start[index + 1] - delta, 24, 76)

      if (next[index] + next[index + 1] !== start[index] + start[index + 1]) return
      widths.value = next
    }

    const stop = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', stop)
      document.body.classList.remove('is-resizing')
    }

    document.body.classList.add('is-resizing')
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', stop)
  }

  return {
    widths: normalizedWidths,
    gridTemplateColumns,
    startResize,
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}
