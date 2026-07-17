<script setup>
import { ArrowRight, Braces, Clock3, ShieldCheck, Zap } from '@lucide/vue'
import { useRouter } from 'vue-router'

defineProps({
  copy: { type: Object, required: true },
})

const router = useRouter()

const homeTools = [
  { key: 'formatter', path: '/json', icon: Braces },
  { key: 'timestamp', path: '/timestamp', icon: Clock3 },
]
</script>

<template>
  <main class="home-page">
    <section class="home-hero">
      <div class="home-eyebrow"><Zap :size="14" /> {{ copy.eyebrow }}</div>
      <h1>{{ copy.title }}</h1>
      <p>{{ copy.subtitle }}</p>
      <div class="home-trust-list">
        <span><ShieldCheck :size="15" /> {{ copy.localOnly }}</span>
        <span><Zap :size="15" /> {{ copy.fast }}</span>
      </div>
    </section>

    <section class="home-tool-grid" aria-label="tools">
      <button v-for="tool in homeTools" :key="tool.key" class="home-tool-card" @click="router.push(tool.path)">
        <span class="home-tool-icon"><component :is="tool.icon" :size="24" /></span>
        <span class="home-tool-content">
          <strong>{{ copy[`${tool.key}Title`] }}</strong>
          <span>{{ copy[`${tool.key}Description`] }}</span>
        </span>
        <span class="home-tool-action">{{ copy.available }} <ArrowRight :size="15" /></span>
      </button>
    </section>
  </main>
</template>
