import { Braces, Binary, Clock3, Columns3, GitCompareArrows, MoreHorizontal } from '@lucide/vue'

/**
 * 平台级工具注册表。
 * 后续工具可以在这里增加路由或动作，不需要改动外壳布局。
 */
export const tools = [
  { key: 'formatter', path: '/json', icon: Braces },
  { key: 'timestamp', path: '/timestamp', icon: Clock3 },
  { key: 'compare', icon: GitCompareArrows, disabled: true },
  { key: 'converter', icon: Columns3, disabled: true },
  { key: 'encoders', icon: Binary, disabled: true },
  { key: 'more', icon: MoreHorizontal, disabled: true },
]
