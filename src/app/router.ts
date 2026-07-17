import { createRouter, createWebHistory } from 'vue-router'

const routePlaceholder = { template: '' }

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/json' },
    { path: '/json', name: 'formatter', component: routePlaceholder, meta: { tool: 'formatter' } },
    { path: '/timestamp', name: 'timestamp', component: routePlaceholder, meta: { tool: 'timestamp' } },
    { path: '/:pathMatch(.*)*', redirect: '/json' },
  ],
})
