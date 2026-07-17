import { describe, expect, it } from 'vitest'
import { formatDateTime, getTimezoneOffsetText, parseInput } from './timestampService'

describe('时间戳核心服务', () => {
  it('解析秒、毫秒、微秒和纳秒时间戳', () => {
    expect(parseInput('0'.padStart(10, '0'), 'auto', 'UTC')?.getTime()).toBe(0)
    expect(parseInput('1735689600000', 'auto', 'UTC')?.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    expect(parseInput('1735689600000000', 'auto', 'UTC')?.getTime()).toBe(1735689600000)
    expect(parseInput('1735689600000000000', 'auto', 'UTC')?.getTime()).toBe(1735689600000)
  })

  it('按指定时区解析无偏移日期时间', () => {
    const date = parseInput('2026-07-17 10:30:00', 'datetime', 'Asia/Shanghai')

    expect(date?.toISOString()).toBe('2026-07-17T02:30:00.000Z')
    expect(formatDateTime(date!, 'Asia/Shanghai')).toBe('2026-07-17 10:30:00')
    expect(getTimezoneOffsetText(date!, 'Asia/Shanghai')).toBe('+08:00')
  })

  it('拒绝不支持的时间戳位数和日期格式', () => {
    expect(parseInput('12345678901', 'auto', 'UTC')).toBeNull()
    expect(parseInput('not-a-date', 'auto', 'UTC')).toBeNull()
  })
})
