<script setup>
import {
  BookOpen,
  Calculator,
  Check,
  Clock3,
  Code2,
  Copy,
  ExternalLink,
  History,
  List,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  SunMedium,
  TimerReset,
  Trash2,
} from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatDateTime, getTimezoneOffsetText, parseInput } from '../services/timestampService'

const props = defineProps({
  language: { type: String, default: 'zh-CN' },
})

const LOCALES = {
  'zh-CN': {
    current: '当前时间戳', realtime: '实时', seconds: '秒', milliseconds: '毫秒', pause: '暂停', resume: '继续', copy: '复制',
    smart: '智能转换', calculator: '时间计算', batch: '批量转换', inputTime: '输入时间', inputPlaceholder: '支持时间戳、日期时间或 ISO 8601',
    inputType: '输入类型', auto: '自动识别', unix: 'Unix 时间戳', datetime: '日期时间', parseTimezone: '解析时区', useNow: '当前时间', convert: '转换',
    detected: '已识别', waiting: '等待输入', unknown: '未知格式', timestamp10: '10 位秒时间戳', timestamp13: '13 位毫秒时间戳', timestamp16: '16 位微秒时间戳', timestamp19: '19 位纳秒时间戳',
    localTime: '本地时间', utc: 'UTC', iso: 'ISO 8601', unixSeconds: 'Unix 秒', unixMilliseconds: 'Unix 毫秒',
    zones: '多时区对照', zonesText: '同一时刻快速校对跨时区接口。', offset: '时间偏移', offsetText: '用于缓存 TTL、过期时间和定时任务。',
    knowledge: '时间戳知识', knowledgeSubtitle: '概念、北京时间与时区数据', knowledgeTag: '知识模块', intro: '时间戳，是从 1970 年 1 月 1 日（UTC/GMT 的午夜）开始所经过的秒数（不考虑闰秒），用于表示一个时间点。它对机器友好，但不便于人类阅读；本工具可在时间戳与可读日期时间之间双向转换。', epoch: 'Unix Epoch', machineTime: '机器时间', readableTime: '可读时间',
    beijing: '北京时间 · 夏令时', dst: '1986 年至 1991 年，中国曾连续六年实行夏令时。通常从 4 月中旬第一个星期日 02:00 开始，到 9 月中旬第一个星期日 02:00 结束；1986 年例外，从 5 月 4 日开始，到 9 月 14 日结束。', dstNote: '实施期间时钟调快 1 小时；1992 年 4 月 5 日后不再实行。',
    jdk: 'JDK 的夏令时问题', jdkText: '夏令时由政令决定，规则可能变化，JDK 需要把历次时区规则维护在时区数据库中。不同版本对 Asia/Shanghai 历史切换点的记录曾存在差异：早期数据认为发生在 00:00，后续修正为 02:00。',
    codeTitle: '获取当前时间戳', codeSubtitle: '选择语言，复制可直接使用的代码', codeTag: '代码模块', copyCode: '复制代码', localOnly: '全部在浏览器本地计算', precision: '支持秒、毫秒、微秒、纳秒',
    calculationBase: '以当前转换结果为基准进行偏移计算', operation: '操作', add: '增加', subtract: '减少', value: '数值', unit: '单位', minute: '分钟', hour: '小时', day: '天', calcResult: '计算结果',
    batchHint: '每行输入一条时间戳或日期时间', batchResult: '转换结果', copyAll: '复制全部', invalid: '无法识别输入，请检查时间格式或时间戳位数。', copied: '已复制到剪贴板', copyFailed: '复制失败，请手动复制', cannotParse: '无法识别',
    fillInput: '填入输入框', history: '历史', historyTitle: '最近转换', historyEmpty: '暂无历史记录', historyHint: '点击记录可一键回填输入、类型与时区', clearHistory: '清空历史', delete: '删除', restored: '已回填历史记录', copiedAll: '已复制完整结果', shortcutHint: '⌘/Ctrl + Enter 转换 · ⌘/Ctrl + C 复制结果',
  },
  'zh-TW': {
    current: '目前時間戳', realtime: '即時', seconds: '秒', milliseconds: '毫秒', pause: '暫停', resume: '繼續', copy: '複製',
    smart: '智慧轉換', calculator: '時間計算', batch: '批次轉換', inputTime: '輸入時間', inputPlaceholder: '支援時間戳、日期時間或 ISO 8601',
    inputType: '輸入類型', auto: '自動識別', unix: 'Unix 時間戳', datetime: '日期時間', parseTimezone: '解析時區', useNow: '目前時間', convert: '轉換',
    detected: '已識別', waiting: '等待輸入', unknown: '未知格式', timestamp10: '10 位秒時間戳', timestamp13: '13 位毫秒時間戳', timestamp16: '16 位微秒時間戳', timestamp19: '19 位奈秒時間戳',
    localTime: '本地時間', utc: 'UTC', iso: 'ISO 8601', unixSeconds: 'Unix 秒', unixMilliseconds: 'Unix 毫秒',
    zones: '多時區對照', zonesText: '同一時刻快速核對跨時區介面。', offset: '時間偏移', offsetText: '適用於快取 TTL、過期時間和排程任務。',
    knowledge: '時間戳知識', knowledgeSubtitle: '概念、北京時間與時區資料', knowledgeTag: '知識模組', intro: '時間戳是從 1970 年 1 月 1 日（UTC/GMT 的午夜）開始所經過的秒數（不考慮閏秒），用於表示一個時間點。它對機器友好，但不便於人類閱讀；本工具可在時間戳與可讀日期時間之間雙向轉換。', epoch: 'Unix Epoch', machineTime: '機器時間', readableTime: '可讀時間',
    beijing: '北京時間 · 夏令時', dst: '1986 年至 1991 年，中國曾連續六年實行夏令時。通常從 4 月中旬第一個星期日 02:00 開始，到 9 月中旬第一個星期日 02:00 結束；1986 年例外，從 5 月 4 日開始，到 9 月 14 日結束。', dstNote: '實施期間時鐘調快 1 小時；1992 年 4 月 5 日後不再實行。',
    jdk: 'JDK 的夏令時問題', jdkText: '夏令時由政令決定，規則可能變化，JDK 需要把歷次時區規則維護在時區資料庫中。不同版本對 Asia/Shanghai 歷史切換點的記錄曾存在差異：早期資料認為發生在 00:00，後續修正為 02:00。',
    codeTitle: '取得目前時間戳', codeSubtitle: '選擇語言，複製可直接使用的程式碼', codeTag: '程式碼模組', copyCode: '複製程式碼', localOnly: '全部在瀏覽器本地計算', precision: '支援秒、毫秒、微秒、奈秒',
    calculationBase: '以目前轉換結果為基準進行偏移計算', operation: '操作', add: '增加', subtract: '減少', value: '數值', unit: '單位', minute: '分鐘', hour: '小時', day: '天', calcResult: '計算結果',
    batchHint: '每行輸入一條時間戳或日期時間', batchResult: '轉換結果', copyAll: '複製全部', invalid: '無法識別輸入，請檢查時間格式或時間戳位數。', copied: '已複製到剪貼簿', copyFailed: '複製失敗，請手動複製', cannotParse: '無法識別',
    fillInput: '填入輸入框', history: '歷史', historyTitle: '最近轉換', historyEmpty: '暫無歷史記錄', historyHint: '點擊記錄可一鍵回填輸入、類型與時區', clearHistory: '清空歷史', delete: '刪除', restored: '已回填歷史記錄', copiedAll: '已複製完整結果', shortcutHint: '⌘/Ctrl + Enter 轉換 · ⌘/Ctrl + C 複製結果',
  },
  en: {
    current: 'Current timestamp', realtime: 'Live', seconds: 'Seconds', milliseconds: 'Milliseconds', pause: 'Pause', resume: 'Resume', copy: 'Copy',
    smart: 'Smart convert', calculator: 'Time math', batch: 'Batch convert', inputTime: 'Input time', inputPlaceholder: 'Timestamp, date time, or ISO 8601',
    inputType: 'Input type', auto: 'Auto detect', unix: 'Unix timestamp', datetime: 'Date time', parseTimezone: 'Parse timezone', useNow: 'Current time', convert: 'Convert',
    detected: 'Detected', waiting: 'Waiting for input', unknown: 'Unknown format', timestamp10: '10-digit seconds timestamp', timestamp13: '13-digit milliseconds timestamp', timestamp16: '16-digit microseconds timestamp', timestamp19: '19-digit nanoseconds timestamp',
    localTime: 'Local time', utc: 'UTC', iso: 'ISO 8601', unixSeconds: 'Unix seconds', unixMilliseconds: 'Unix milliseconds',
    zones: 'Multi-timezone view', zonesText: 'Validate cross-timezone APIs at a glance.', offset: 'Time offset', offsetText: 'Useful for cache TTLs, expiry times, and scheduled jobs.',
    knowledge: 'Timestamp knowledge', knowledgeSubtitle: 'Concepts, Beijing time, and timezone data', knowledgeTag: 'Knowledge', intro: 'A timestamp is the number of seconds elapsed since 1970-01-01 00:00:00 UTC/GMT, ignoring leap seconds. It is machine-friendly but hard to read; this tool converts between timestamps and human-readable date times.', epoch: 'Unix Epoch', machineTime: 'Machine time', readableTime: 'Readable time',
    beijing: 'Beijing time · DST', dst: 'China observed daylight saving time for six years from 1986 to 1991. It generally started at 02:00 on the first Sunday in mid-April and ended at 02:00 on the first Sunday in mid-September; 1986 was an exception, running from May 4 to September 14.', dstNote: 'Clocks advanced by one hour during the period; DST was not used after April 5, 1992.',
    jdk: 'JDK daylight-saving data', jdkText: 'DST rules are policy decisions that can change, so JDK records historical timezone rules in its timezone database. Different releases once recorded the Asia/Shanghai historical switch differently: 00:00 in earlier data and 02:00 in later corrections.',
    codeTitle: 'Get the current timestamp', codeSubtitle: 'Choose a language and copy ready-to-use code', codeTag: 'Code', copyCode: 'Copy code', localOnly: 'Computed locally in your browser', precision: 'Seconds, milliseconds, microseconds, nanoseconds',
    calculationBase: 'Offset from the current conversion result', operation: 'Operation', add: 'Add', subtract: 'Subtract', value: 'Value', unit: 'Unit', minute: 'Minutes', hour: 'Hours', day: 'Days', calcResult: 'Result',
    batchHint: 'Enter one timestamp or date time per line', batchResult: 'Results', copyAll: 'Copy all', invalid: 'Input could not be recognized. Check the format or timestamp length.', copied: 'Copied to clipboard', copyFailed: 'Copy failed. Please copy manually.', cannotParse: 'Could not parse',
    fillInput: 'Fill input', history: 'History', historyTitle: 'Recent conversions', historyEmpty: 'No conversion history yet', historyHint: 'Select a record to restore its input, type, and timezone', clearHistory: 'Clear history', delete: 'Delete', restored: 'History entry restored', copiedAll: 'Full result copied', shortcutHint: '⌘/Ctrl + Enter converts · ⌘/Ctrl + C copies the result',
  },
}

const TIME_ZONES = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai · UTC+08:00' },
  { value: 'UTC', label: 'UTC · UTC+00:00' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
]

const LANGUAGE_SNIPPETS = {
  JavaScript: 'Math.round(new Date() / 1000)',
  Java: `// pure java
System.currentTimeMillis() / 1000

// java >= 8
Instant.now().getEpochSecond()`,
  Python: `import time
time.time()

import arrow
arrow.utcnow().timestamp`,
  Go: `import (
  "time"
)
int64(time.Now().Unix())`,
  Swift: 'NSDate().timeIntervalSince1970',
  C: `#include <sys/time.h>

struct timeval tv;
gettimeofday(&tv, NULL);
// 秒：tv.tv_sec
// 毫秒：tv.tv_sec * 1000LL + tv.tv_usec / 1000`,
  'Objective-C': '[[NSDate date] timeIntervalSince1970]',
  MySQL: 'SELECT unix_timestamp(now())',
  SQLite: "SELECT strftime('%s', 'now')",
  Erlang: 'calendar:datetime_to_gregorian_seconds(calendar:universal_time())-719528*24*3600.',
  PHP: `<?php
// pure php
time();

// carbon php
use Carbon\\Carbon;
Carbon::now()->timestamp;`,
  Ruby: 'Time.now.to_i',
  Shell: 'date +%s',
  Groovy: '(new Date().time / 1000).longValue()',
  Lua: 'os.time()',
  '.NET/C#': 'DateTimeOffset.UtcNow.ToUnixTimeSeconds();',
  Dart: '(new DateTime.now().millisecondsSinceEpoch / 1000).truncate()',
}

const mode = ref('convert')
const timestampInput = ref(String(Math.floor(Date.now() / 1000)))
const inputType = ref('auto')
const timezone = ref('Asia/Shanghai')
const conversionDate = ref(new Date())
const conversionError = ref('')
const liveDate = ref(new Date())
const liveUnit = ref('s')
const livePaused = ref(false)
const notice = ref('')
const offsetDirection = ref('add')
const offsetAmount = ref(30)
const offsetUnit = ref('minute')
const batchInput = ref('1784192400\n1784196000\n2026-07-16 17:00:00')
const selectedLanguage = ref('JavaScript')
const historyRecords = ref([])
const historyOpen = ref(false)
let timerId = null
let noticeTimer = null
const HISTORY_STORAGE_KEY = 'jsonf-timestamp-history-v1'

const copy = computed(() => LOCALES[props.language] ?? LOCALES['zh-CN'])

const detectedType = computed(() => {
  const value = timestampInput.value.trim()
  if (!value) return copy.value.waiting
  if (inputType.value !== 'auto') return inputType.value === 'timestamp' ? copy.value.unix : inputType.value === 'datetime' ? copy.value.datetime : 'ISO 8601'
  if (/^\d{19}$/.test(value)) return copy.value.timestamp19
  if (/^\d{16}$/.test(value)) return copy.value.timestamp16
  if (/^\d{13}$/.test(value)) return copy.value.timestamp13
  if (/^\d{10}$/.test(value)) return copy.value.timestamp10
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return copy.value.datetime
  return copy.value.unknown
})

const liveTimestamp = computed(() => {
  const value = liveDate.value.getTime()
  return liveUnit.value === 'ms' ? String(value) : String(Math.floor(value / 1000))
})

const localDateTime = computed(() => formatDateTime(conversionDate.value, timezone.value))
const utcDateTime = computed(() => formatDateTime(conversionDate.value, 'UTC'))
const isoDateTime = computed(() => `${formatDateTime(conversionDate.value, timezone.value).replace(' ', 'T')}${getTimezoneOffsetText(conversionDate.value, timezone.value)}`)
const unixSeconds = computed(() => String(Math.floor(conversionDate.value.getTime() / 1000)))
const unixMilliseconds = computed(() => String(conversionDate.value.getTime()))
const languageNames = Object.keys(LANGUAGE_SNIPPETS)
const selectedSnippet = computed(() => LANGUAGE_SNIPPETS[selectedLanguage.value])
const offsetDate = computed(() => {
  const date = new Date(conversionDate.value)
  const multiplier = { minute: 60_000, hour: 3_600_000, day: 86_400_000 }[offsetUnit.value]
  const delta = Math.max(0, Number(offsetAmount.value) || 0) * multiplier
  return new Date(date.getTime() + (offsetDirection.value === 'add' ? delta : -delta))
})
const batchResults = computed(() =>
  batchInput.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const date = parseInput(line, inputType.value, timezone.value)
      return date ? `${line}  →  ${formatDateTime(date, timezone.value)}` : `${line}  →  ${copy.value.cannotParse}`
    })
    .join('\n'),
)

const fullResults = computed(() => [
  `${copy.value.localTime}: ${localDateTime.value}`,
  `UTC: ${utcDateTime.value}`,
  `ISO 8601: ${isoDateTime.value}`,
  `${copy.value.unixSeconds}: ${unixSeconds.value}`,
  `${copy.value.unixMilliseconds}: ${unixMilliseconds.value}`,
].join('\n'))

function convert() {
  const parsed = parseInput(timestampInput.value, inputType.value, timezone.value)
  if (!parsed) {
    conversionError.value = copy.value.invalid
    return
  }
  conversionDate.value = parsed
  conversionError.value = ''
  saveHistory(parsed)
}

function useCurrentTime() {
  const now = Date.now()
  timestampInput.value = liveUnit.value === 'ms' ? String(now) : String(Math.floor(now / 1000))
  inputType.value = 'timestamp'
  convert()
}

function toggleHistory() {
  historyOpen.value = !historyOpen.value
}

function saveHistory(date) {
  const record = {
    id: `${Date.now()}-${timestampInput.value}`,
    input: timestampInput.value.trim(),
    inputType: inputType.value,
    timezone: timezone.value,
    timestamp: date.getTime(),
    createdAt: Date.now(),
  }
  const next = [record, ...historyRecords.value.filter((item) => !(item.input === record.input && item.inputType === record.inputType && item.timezone === record.timezone))].slice(0, 50)
  historyRecords.value = next
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next))
}

function restoreHistory(record) {
  mode.value = 'convert'
  timestampInput.value = record.input
  inputType.value = record.inputType
  timezone.value = record.timezone
  conversionDate.value = new Date(record.timestamp)
  conversionError.value = ''
  historyOpen.value = false
  notice.value = copy.value.restored
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => (notice.value = ''), 1800)
  // eslint-disable-next-line no-undef
  inputRef.value?.focus()
}

function deleteHistory(id) {
  historyRecords.value = historyRecords.value.filter((item) => item.id !== id)
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyRecords.value))
}

function clearHistory() {
  historyRecords.value = []
  localStorage.removeItem(HISTORY_STORAGE_KEY)
}

function formatHistoryTime(value) {
  return new Intl.DateTimeFormat(props.language === 'en' ? 'en-GB' : props.language, {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value))
}

function isTextEditingTarget(target) {
  const element = target instanceof Element ? target : null
  return Boolean(element && (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName) || element.closest('[contenteditable="true"]')))
}

function hasSelectedText() {
  return Boolean(window.getSelection()?.toString())
}

function handleShortcut(event) {
  if (event.key === 'Escape' && historyOpen.value) {
    historyOpen.value = false
    return
  }

  const command = event.metaKey || event.ctrlKey
  if (!command || hasSelectedText()) return

  if (event.key === 'Enter') {
    event.preventDefault()
    if (mode.value === 'convert') convert()
    else if (mode.value === 'calculator') copyText(`${formatDateTime(offsetDate.value, timezone.value)} · ${Math.floor(offsetDate.value.getTime() / 1000)}`)
    else copyText(batchResults.value)
    return
  }

  if (isTextEditingTarget(event.target)) return

  if (event.key.toLowerCase() === 'c') {
    event.preventDefault()
    if (event.shiftKey) {
      copyText(fullResults.value, copy.value.copiedAll)
    } else if (mode.value === 'calculator') {
      copyText(`${formatDateTime(offsetDate.value, timezone.value)} · ${Math.floor(offsetDate.value.getTime() / 1000)}`)
    } else if (mode.value === 'batch') {
      copyText(batchResults.value)
    } else {
      copyText(localDateTime.value)
    }
  }
}

async function copyText(value, successMessage = copy.value.copied) {
  try {
    await navigator.clipboard.writeText(value)
    notice.value = successMessage
  } catch {
    notice.value = copy.value.copyFailed
  }
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => (notice.value = ''), 1800)
}

function setLiveUnit(unit) {
  liveUnit.value = unit
}

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) ?? '[]')
    if (Array.isArray(saved)) historyRecords.value = saved.filter((item) => item?.input && item?.timezone && Number.isFinite(item?.timestamp)).slice(0, 50)
  } catch {
    historyRecords.value = []
  }
  timerId = window.setInterval(() => {
    if (!livePaused.value) liveDate.value = new Date()
  }, 1_000)
  window.addEventListener('keydown', handleShortcut)
})

onBeforeUnmount(() => {
  window.clearInterval(timerId)
  window.clearTimeout(noticeTimer)
  window.removeEventListener('keydown', handleShortcut)
})
</script>

<template>
  <main class="timestamp-tool">
    <div class="timestamp-page">
      <section class="timestamp-live-card">
        <div class="timestamp-live-head">
          <span class="timestamp-chip timestamp-chip--live"><span class="timestamp-live-dot" />{{ copy.current }} · {{ copy.realtime }}</span>
          <div class="timestamp-inline-actions">
            <button class="timestamp-unit timestamp-unit--seconds" :class="{ active: liveUnit === 's' }" @click="setLiveUnit('s')">{{ copy.seconds }}</button>
            <button class="timestamp-unit timestamp-unit--milliseconds" :class="{ active: liveUnit === 'ms' }" @click="setLiveUnit('ms')">{{ copy.milliseconds }}</button>
            <button class="timestamp-text-action" :class="livePaused ? 'timestamp-live-control--resume' : 'timestamp-live-control--pause'" @click="livePaused = !livePaused"><Pause v-if="!livePaused" :size="14" /><Play v-else :size="14" />{{ livePaused ? copy.resume : copy.pause }}</button>
            <button class="timestamp-text-action timestamp-live-control--copy" @click="copyText(liveTimestamp)"><Copy :size="14" />{{ copy.copy }}</button>
            <button class="timestamp-text-action timestamp-live-control--history" @click="toggleHistory"><History :size="14" />{{ copy.history }}<span v-if="historyRecords.length" class="timestamp-history-count">{{ historyRecords.length }}</span></button>
          </div>
        </div>
        <div class="timestamp-live-value-wrap">
          <strong class="timestamp-live-value">{{ liveTimestamp }}</strong>
          <span class="timestamp-live-unit-badge" :class="`timestamp-live-unit-badge--${liveUnit}`">{{ liveUnit === 'ms' ? copy.milliseconds : copy.seconds }}</span>
        </div>
        <span class="timestamp-live-date">{{ formatDateTime(liveDate, timezone) }} · {{ timezone }} · {{ getTimezoneOffsetText(liveDate, timezone) }}</span>
      </section>

      <nav class="timestamp-mode-tabs" :aria-label="copy.current">
        <button :class="{ active: mode === 'convert' }" @click="mode = 'convert'"><Sparkles :size="15" />{{ copy.smart }}</button>
        <button :class="{ active: mode === 'calculator' }" @click="mode = 'calculator'"><Calculator :size="15" />{{ copy.calculator }}</button>
        <button :class="{ active: mode === 'batch' }" @click="mode = 'batch'"><List :size="15" />{{ copy.batch }}</button>
      </nav>

      <section v-if="mode === 'convert'" class="timestamp-workbench">
        <div class="timestamp-form-grid">
          <label class="timestamp-field timestamp-field--wide">{{ copy.inputTime }}
            <input v-model="timestampInput" :placeholder="copy.inputPlaceholder" @keydown.enter.prevent="convert" />
          </label>
          <label class="timestamp-field">{{ copy.inputType }}
            <select v-model="inputType"><option value="auto">{{ copy.auto }}</option><option value="timestamp">{{ copy.unix }}</option><option value="datetime">{{ copy.datetime }}</option><option value="iso">ISO 8601</option></select>
          </label>
          <label class="timestamp-field">{{ copy.parseTimezone }}
            <select v-model="timezone"><option v-for="zone in TIME_ZONES" :key="zone.value" :value="zone.value">{{ zone.label }}</option></select>
          </label>
        </div>
        <div class="timestamp-convert-actions">
          <span class="timestamp-chip">{{ copy.detected }}: {{ detectedType }}</span>
          <div class="timestamp-inline-actions"><span class="timestamp-shortcut-hint">{{ copy.shortcutHint }}</span><button class="timestamp-secondary-action" @click="useCurrentTime"><TimerReset :size="15" />{{ copy.useNow }}</button><button class="timestamp-primary-action" @click="convert"><Sparkles :size="15" />{{ copy.convert }}</button></div>
        </div>
        <p v-if="conversionError" class="timestamp-error">{{ conversionError }}</p>
        <div v-else class="timestamp-results">
          <div class="timestamp-result-row"><span>{{ copy.localTime }}</span><strong>{{ localDateTime }}</strong><button :aria-label="`${copy.copy} ${copy.localTime}`" @click="copyText(localDateTime)"><Copy :size="15" /></button></div>
          <div class="timestamp-result-row"><span>{{ copy.utc }}</span><code>{{ utcDateTime }}</code><button :aria-label="`${copy.copy} UTC`" @click="copyText(utcDateTime)"><Copy :size="15" /></button></div>
          <div class="timestamp-result-row"><span>{{ copy.iso }}</span><code>{{ isoDateTime }}</code><button :aria-label="`${copy.copy} ISO 8601`" @click="copyText(isoDateTime)"><Copy :size="15" /></button></div>
          <div class="timestamp-result-row"><span>{{ copy.unixSeconds }}</span><code>{{ unixSeconds }}</code><button :aria-label="`${copy.copy} ${copy.unixSeconds}`" @click="copyText(unixSeconds)"><Copy :size="15" /></button></div>
          <div class="timestamp-result-row"><span>{{ copy.unixMilliseconds }}</span><code>{{ unixMilliseconds }}</code><button :aria-label="`${copy.copy} ${copy.unixMilliseconds}`" @click="copyText(unixMilliseconds)"><Copy :size="15" /></button></div>
        </div>
      </section>

      <section v-else-if="mode === 'calculator'" class="timestamp-workbench timestamp-calculator">
        <div class="timestamp-section-label"><TimerReset :size="17" />{{ copy.calculationBase }}</div>
        <div class="timestamp-calculator-controls">
          <label class="timestamp-field">{{ copy.operation }}<select v-model="offsetDirection"><option value="add">{{ copy.add }}</option><option value="subtract">{{ copy.subtract }}</option></select></label>
          <label class="timestamp-field">{{ copy.value }}<input v-model.number="offsetAmount" type="number" min="0" /></label>
          <label class="timestamp-field">{{ copy.unit }}<select v-model="offsetUnit"><option value="minute">{{ copy.minute }}</option><option value="hour">{{ copy.hour }}</option><option value="day">{{ copy.day }}</option></select></label>
        </div>
        <div class="timestamp-calculator-result"><span>{{ copy.calcResult }}</span><strong>{{ formatDateTime(offsetDate, timezone) }}</strong><code>{{ Math.floor(offsetDate.getTime() / 1000) }}</code><button :aria-label="`${copy.copy} ${copy.calcResult}`" @click="copyText(`${formatDateTime(offsetDate, timezone)} · ${Math.floor(offsetDate.getTime() / 1000)}`)"><Copy :size="15" /></button></div>
      </section>

      <section v-else class="timestamp-workbench timestamp-batch">
        <div class="timestamp-section-label"><List :size="17" />{{ copy.batchHint }}</div>
        <textarea v-model="batchInput" :aria-label="copy.batchHint" />
        <div class="timestamp-batch-result"><div><span>{{ copy.batchResult }}</span><button class="timestamp-text-action" @click="copyText(batchResults)"><Copy :size="14" />{{ copy.copyAll }}</button></div><pre>{{ batchResults }}</pre></div>
      </section>

      <div class="timestamp-feature-grid">
        <section class="timestamp-feature-card timestamp-feature-card--blue"><span class="timestamp-chip">{{ copy.zones }}</span><strong>Shanghai {{ formatDateTime(conversionDate, 'Asia/Shanghai').slice(11) }} · London {{ formatDateTime(conversionDate, 'Europe/London').slice(11) }} · New York {{ formatDateTime(conversionDate, 'America/New_York').slice(11) }}</strong><p>{{ copy.zonesText }}</p></section>
        <section class="timestamp-feature-card timestamp-feature-card--amber"><span class="timestamp-chip">{{ copy.offset }}</span><strong>{{ offsetDirection === 'add' ? '+' : '−' }} {{ offsetAmount }} {{ offsetUnit === 'minute' ? copy.minute : offsetUnit === 'hour' ? copy.hour : copy.day }} → {{ formatDateTime(offsetDate, timezone).slice(11) }}</strong><p>{{ copy.offsetText }}</p></section>
      </div>

      <section class="timestamp-section">
        <header class="timestamp-section-head"><div><span class="timestamp-section-icon timestamp-section-icon--teal"><BookOpen :size="18" /></span><div><h2>{{ copy.knowledge }}</h2><p>{{ copy.knowledgeSubtitle }}</p></div></div><span class="timestamp-chip">{{ copy.knowledgeTag }}</span></header>
        <article class="timestamp-knowledge-intro"><p>{{ copy.intro }}</p><div class="timestamp-timeline"><div><strong>1970-01-01</strong><span>{{ copy.epoch }}</span></div><i /><div><strong>{{ unixSeconds }}</strong><span>{{ copy.machineTime }}</span></div><i /><div><strong>{{ localDateTime }}</strong><span>{{ copy.readableTime }}</span></div></div></article>
        <div class="timestamp-knowledge-grid">
          <article class="timestamp-info-card timestamp-info-card--amber"><div class="timestamp-info-title"><span class="timestamp-section-icon timestamp-section-icon--amber"><SunMedium :size="18" /></span><strong>{{ copy.beijing }}</strong></div><p>{{ copy.dst }}</p><div class="timestamp-year-line"><span>1986</span><i /><span>1991</span></div><small>{{ copy.dstNote }}</small></article>
          <article class="timestamp-info-card timestamp-info-card--violet"><div class="timestamp-info-title"><span class="timestamp-section-icon timestamp-section-icon--violet"><Clock3 :size="18" /></span><strong>{{ copy.jdk }}</strong></div><p>{{ copy.jdkText }}</p><a href="https://www.oracle.com/java/technologies/tzdata-versions.html" target="_blank" rel="noreferrer"><ExternalLink :size="14" />Timezone Data Versions in the JRE Software</a></article>
        </div>
      </section>

      <section class="timestamp-section">
        <header class="timestamp-section-head"><div><span class="timestamp-section-icon timestamp-section-icon--violet"><Code2 :size="18" /></span><div><h2>{{ copy.codeTitle }}</h2><p>{{ copy.codeSubtitle }}</p></div></div><span class="timestamp-chip">{{ copy.codeTag }}</span></header>
        <div class="timestamp-code-layout">
          <div class="timestamp-language-grid"><button v-for="language in languageNames" :key="language" :class="{ active: selectedLanguage === language }" @click="selectedLanguage = language">{{ language }}</button></div>
          <article class="timestamp-code-card"><header><strong>{{ selectedLanguage }}</strong><button class="timestamp-primary-action" @click="copyText(selectedSnippet)"><Copy :size="15" />{{ copy.copyCode }}</button></header><pre><code>{{ selectedSnippet }}</code></pre></article>
        </div>
      </section>

      <footer class="timestamp-footer"><span><ShieldCheck :size="15" />{{ copy.localOnly }}</span><span>{{ copy.precision }}</span></footer>
    </div>
    <Transition name="timestamp-history">
      <aside v-if="historyOpen" class="timestamp-history-panel" :aria-label="copy.historyTitle">
        <header>
          <div><History :size="18" /><div><strong>{{ copy.historyTitle }}</strong><span>{{ copy.historyHint }}</span></div></div>
          <button v-if="historyRecords.length" class="timestamp-text-action timestamp-history-clear" @click="clearHistory"><Trash2 :size="14" />{{ copy.clearHistory }}</button>
        </header>
        <div v-if="historyRecords.length" class="timestamp-history-list">
          <article v-for="record in historyRecords" :key="record.id" class="timestamp-history-item">
            <button class="timestamp-history-restore" @click="restoreHistory(record)">
              <strong>{{ record.input }}</strong>
              <span>{{ formatDateTime(new Date(record.timestamp), record.timezone) }}</span>
              <small>{{ record.timezone }} · {{ formatHistoryTime(record.createdAt) }}</small>
            </button>
            <button class="timestamp-history-delete" :aria-label="copy.delete" @click="deleteHistory(record.id)"><Trash2 :size="14" /></button>
          </article>
        </div>
        <p v-else class="timestamp-history-empty">{{ copy.historyEmpty }}</p>
      </aside>
    </Transition>
    <Transition name="timestamp-notice"><div v-if="notice" class="timestamp-notice"><Check :size="15" />{{ notice }}</div></Transition>
  </main>
</template>
