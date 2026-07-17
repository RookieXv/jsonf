export type TimestampInputType = 'auto' | 'timestamp' | 'datetime' | 'iso'

export function formatDateTime(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  )
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`
}

export function getTimezoneOffset(date: Date, timeZone: string): number {
  const value = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value
  if (!value || value === 'GMT') return 0
  const match = value.match(/GMT([+-])(\d{2}):(\d{2})/)
  if (!match) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3])
  return (match[1] === '+' ? 1 : -1) * minutes * 60_000
}

export function getTimezoneOffsetText(date: Date, timeZone: string): string {
  const offset = getTimezoneOffset(date, timeZone)
  const sign = offset >= 0 ? '+' : '-'
  const minutes = Math.abs(offset) / 60_000
  return `${sign}${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function parseInput(value: string, requestedType: TimestampInputType | string, timeZone: string): Date | null {
  const source = value.trim()
  if (!source) return null
  const numeric = /^\d+$/.test(source)
  const type =
    requestedType === 'auto'
      ? numeric
        ? 'timestamp'
        : source.includes('T') && /[zZ]|[+-]\d{2}:?\d{2}$/.test(source)
          ? 'iso'
          : 'datetime'
      : requestedType

  if (type === 'timestamp' && numeric) {
    let milliseconds: number
    if (source.length === 10) milliseconds = Number(source) * 1_000
    else if (source.length === 13) milliseconds = Number(source)
    else if (source.length === 16) milliseconds = Number(BigInt(source) / 1_000n)
    else if (source.length === 19) milliseconds = Number(BigInt(source) / 1_000_000n)
    else return null
    const date = new Date(milliseconds)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (type === 'iso') {
    const date = new Date(source)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const match = source.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/)
  if (!match) return null
  const utcGuess = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
    Number(match[6] ?? 0),
  )
  const firstOffset = getTimezoneOffset(new Date(utcGuess), timeZone)
  const date = new Date(utcGuess - firstOffset)
  const refinedOffset = getTimezoneOffset(date, timeZone)
  return refinedOffset === firstOffset ? date : new Date(utcGuess - refinedOffset)
}
