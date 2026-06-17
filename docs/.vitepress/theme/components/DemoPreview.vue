<script setup lang="ts">
import { withBase } from 'vitepress'
import { DEMO_VIDEO_URL, FIGMA_COMMUNITY_URL } from '../../../../site-constants'

function embedUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.includes('youtube.com/watch')) {
    const id = new URL(trimmed).searchParams.get('v')
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : trimmed
  }
  if (trimmed.includes('youtu.be/')) {
    const id = trimmed.split('youtu.be/')[1]?.split('?')[0]
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : trimmed
  }
  return trimmed
}

const videoEmbed = embedUrl(DEMO_VIDEO_URL)
</script>

<template>
  <section class="pulpo-section pulpo-demo">
    <h2 class="pulpo-section__title">See what Pulpo generates</h2>
    <p class="pulpo-section__subtitle">
      One form in the plugin → a readable experiment diagram on the canvas.
    </p>

    <div v-if="videoEmbed" class="pulpo-demo__video">
      <iframe
        :src="videoEmbed"
        title="Pulpo demo video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
    </div>

    <figure v-else class="pulpo-figure">
      <img
        :src="withBase('/images/experiment-flow.png?v=7')"
        alt="Example experiment journey with variants on the Figma canvas"
        loading="lazy"
      />
    </figure>

    <p style="text-align: center; margin-top: 20px;">
      <a class="pulpo-btn pulpo-btn--primary" :href="FIGMA_COMMUNITY_URL" target="_blank" rel="noopener noreferrer">
        Install in Figma
      </a>
      <a class="pulpo-btn pulpo-btn--secondary" style="margin-left: 12px;" :href="withBase('/GETTING_STARTED')">
        Quick start
      </a>
    </p>
  </section>
</template>

<style scoped>
.pulpo-demo__video {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
}

.pulpo-demo__video iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
