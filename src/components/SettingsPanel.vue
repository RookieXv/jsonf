<script setup>
import { X } from '@lucide/vue'
import { clearJsonfStorage } from '../utils/storage'

defineProps({
  open: { type: Boolean, required: true },
  t: { type: Object, required: true },
  theme: { type: String, required: true },
  indent: { type: String, required: true },
  trailingNewline: { type: Boolean, required: true },
  fontSize: { type: Number, required: true },
  lineWrap: { type: Boolean, required: true },
  lineNumbers: { type: Boolean, required: true },
})

defineEmits([
  'close',
  'update:theme',
  'update:indent',
  'update:trailingNewline',
  'update:fontSize',
  'update:lineWrap',
  'update:lineNumbers',
])

function clearCache() {
  clearJsonfStorage()
  window.location.reload()
}
</script>

<template>
  <div v-if="open" class="settings-backdrop" @click.self="$emit('close')">
    <aside class="settings-panel" aria-label="settings">
      <header class="settings-header">
        <h2>{{ t.settings.title }}</h2>
        <button class="ghost-button" :aria-label="t.settings.close" @click="$emit('close')">
          <X :size="17" />
        </button>
      </header>

      <label class="setting-row">
        <span>{{ t.settings.theme }}</span>
        <select :value="theme" @change="$emit('update:theme', $event.target.value)">
          <option value="system">{{ t.settings.themeSystem }}</option>
          <option value="light">{{ t.settings.themeLight }}</option>
          <option value="dark">{{ t.settings.themeDark }}</option>
        </select>
      </label>

      <label class="setting-row">
        <span>{{ t.settings.indent }}</span>
        <select :value="indent" @change="$emit('update:indent', $event.target.value)">
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="tab">Tab</option>
        </select>
      </label>

      <label class="setting-row">
        <span>{{ t.settings.fontSize }}</span>
        <input
          type="range"
          min="12"
          max="18"
          :value="fontSize"
          @input="$emit('update:fontSize', Number($event.target.value))"
        />
      </label>

      <label class="toggle-row">
        <span>{{ t.settings.trailingNewline }}</span>
        <input
          type="checkbox"
          :checked="trailingNewline"
          @change="$emit('update:trailingNewline', $event.target.checked)"
        />
      </label>

      <label class="toggle-row">
        <span>{{ t.settings.lineWrap }}</span>
        <input type="checkbox" :checked="lineWrap" @change="$emit('update:lineWrap', $event.target.checked)" />
      </label>

      <label class="toggle-row">
        <span>{{ t.settings.lineNumbers }}</span>
        <input
          type="checkbox"
          :checked="lineNumbers"
          @change="$emit('update:lineNumbers', $event.target.checked)"
        />
      </label>

      <button class="danger-button" @click="clearCache">{{ t.settings.clearCache }}</button>
    </aside>
  </div>
</template>
