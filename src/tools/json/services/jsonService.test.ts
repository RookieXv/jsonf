import { describe, expect, it } from 'vitest'
import { analyzeJson, getErrorLocation, repairJson } from './jsonService'

describe('JSON 核心服务', () => {
  it('按原有规则格式化并统计有效 JSON', () => {
    const result = analyzeJson('{"b":1,"a":{"ok":true}}', {
      indent: '2',
      preserveEscapes: false,
      sortOutputKeys: true,
    })

    expect(result.status).toBe('valid')
    expect(result.pretty).toBe('{\n  "a": {\n    "ok": true\n  },\n  "b": 1\n}')
    expect(result.stats).toMatchObject({ depth: 3, keys: 3, objects: 2, scalars: 2 })
  })

  it('修复常见的非标准 JSON', () => {
    expect(JSON.parse(repairJson("{name: 'jsonf', enabled: true,}"))).toEqual({
      name: 'jsonf',
      enabled: true,
    })
  })

  it('将字符位置换算成行列', () => {
    expect(getErrorLocation('{\n  "a": 1,\n}', 12)).toEqual({ line: 3, column: 1 })
  })
})
