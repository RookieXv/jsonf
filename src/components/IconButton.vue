<script setup>
defineProps({
  label: { type: String, required: true },
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <button class="icon-button" :class="{ active }" :data-tooltip="label" :aria-label="label" :disabled="disabled">
    <slot />
    <span v-if="$slots.label" class="icon-button__label"><slot name="label" /></span>
  </button>
</template>
