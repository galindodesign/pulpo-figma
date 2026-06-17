<script setup lang="ts">
import { FIGMA_COMMUNITY_URL } from '../../../../site-constants'
import { DOCS_BTN } from '../docs-labels'
import PulpoButton from './PulpoButton.vue'
</script>

<template>
  <PulpoButton
    :href="FIGMA_COMMUNITY_URL"
    variant="primary"
    size="nav"
    icon="figma"
    external
  >
    {{ DOCS_BTN.INSTALL_FIGMA }}
  </PulpoButton>
</template>
