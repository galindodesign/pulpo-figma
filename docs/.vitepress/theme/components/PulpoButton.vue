<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    href: string
    variant?: 'primary' | 'secondary'
    size?: 'md' | 'nav'
    icon?: 'figma' | 'external' | 'mail' | 'arrow'
    external?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    external: undefined,
  },
)

const isExternal = computed(
  () => props.external ?? /^https?:\/\//.test(props.href),
)

const classes = computed(() => [
  'pulpo-btn',
  `pulpo-btn--${props.variant}`,
  props.size === 'nav' ? 'pulpo-btn--nav' : '',
  props.icon ? `pulpo-btn--icon-${props.icon}` : '',
].filter(Boolean).join(' '))
</script>

<template>
  <a
    :class="classes"
    :href="href"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener noreferrer' : undefined"
  >
    <span v-if="icon" class="pulpo-btn__icon" aria-hidden="true">
      <svg v-if="icon === 'figma'" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.8 19.6c1.77 0 3.2-1.43 3.2-3.2V13.2H6.8a3.2 3.2 0 1 0 0 6.4Z" fill="currentColor" />
        <path d="M3.6 10a3.2 3.2 0 0 1 3.2-3.2H10v6.4H6.8A3.2 3.2 0 0 1 3.6 10Z" fill="currentColor" opacity="0.85" />
        <path d="M16.4 10a3.2 3.2 0 1 1-6.4 0 3.2 3.2 0 0 1 6.4 0Z" fill="currentColor" opacity="0.7" />
        <path d="M3.6 3.6A3.2 3.2 0 0 1 6.8.4H10v6.4H6.8A3.2 3.2 0 0 1 3.6 3.6Z" fill="currentColor" opacity="0.55" />
        <path d="M10 .4h3.2a3.2 3.2 0 1 1 0 6.4H10V.4Z" fill="currentColor" opacity="0.4" />
      </svg>
      <svg v-else-if="icon === 'external'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </svg>
      <svg v-else-if="icon === 'mail'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
      <svg v-else-if="icon === 'arrow'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </span>
    <span class="pulpo-btn__label"><slot /></span>
  </a>
</template>
