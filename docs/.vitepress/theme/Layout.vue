<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import InstallCta from './components/InstallCta.vue'
import PulpoIcon from './components/PulpoIcon.vue'

const { Layout: DefaultLayout } = DefaultTheme
</script>

<template>
  <DefaultLayout>
    <template #nav-bar-title-before>
      <PulpoIcon class="vp-nav-pulpo-icon" :size="28" />
    </template>
    <template #nav-bar-content-after>
      <InstallCta />
    </template>
  </DefaultLayout>
</template>
