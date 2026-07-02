import { Braces, Binary, Columns3, FileJson, GitCompareArrows, MoreHorizontal } from '@lucide/vue'

/**
 * Platform-level tool registry.
 * Future tools can be enabled by adding routes/actions here without changing the shell layout.
 */
export const tools = [
  { key: 'formatter', icon: Braces },
  { key: 'viewer', icon: FileJson, disabled: true },
  { key: 'compare', icon: GitCompareArrows, disabled: true },
  { key: 'converter', icon: Columns3, disabled: true },
  { key: 'encoders', icon: Binary, disabled: true },
  { key: 'more', icon: MoreHorizontal, disabled: true },
]
