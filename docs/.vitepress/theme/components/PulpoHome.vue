<script setup lang="ts">
import { withBase } from 'vitepress'
import { FIGMA_COMMUNITY_URL, PLUGIN_VERSION } from '../../../../site-constants'
import { DOCS_BTN } from '../docs-labels'
import DemoPreview from './DemoPreview.vue'
import PulpoButton from './PulpoButton.vue'
import PulpoIcon from './PulpoIcon.vue'
</script>

<template>
  <div class="pulpo-home">
    <section class="pulpo-hero">
      <PulpoIcon class="pulpo-hero__logo" :size="72" title="Pulpo" />
      <h1 class="pulpo-hero__title">Pulpo</h1>
      <p class="pulpo-hero__tagline">
        Experiments belong on the canvas, not in slides. Pulpo turns what you're testing into a flow your whole team can follow.
      </p>
      <p class="pulpo-hero__version">v{{ PLUGIN_VERSION }}</p>
      <div class="pulpo-hero__actions pulpo-btn-group">
        <PulpoButton :href="FIGMA_COMMUNITY_URL" icon="figma" external>
          {{ DOCS_BTN.INSTALL_FIGMA }}
        </PulpoButton>
        <PulpoButton :href="withBase('/GETTING_STARTED')" variant="secondary" icon="arrow">
          {{ DOCS_BTN.QUICK_START }}
        </PulpoButton>
      </div>
      <p class="pulpo-hero__contact">
        Questions or ideas?
        <a :href="withBase('/contact')">Contact us</a>
      </p>
    </section>

    <DemoPreview />

    <section class="pulpo-section">
      <h2 class="pulpo-section__title">Learn Pulpo</h2>
      <div class="pulpo-grid pulpo-grid--2">
        <a class="pulpo-card pulpo-card--link" :href="withBase('/GETTING_STARTED')">
          <h3 class="pulpo-card__title">{{ DOCS_BTN.QUICK_START }}</h3>
          <p class="pulpo-card__body">Install, fill the form, and create your first flow in five minutes.</p>
          <span class="pulpo-card__link">{{ DOCS_BTN.QUICK_START }}</span>
        </a>
        <a class="pulpo-card pulpo-card--link" :href="withBase('/USER_GUIDE')">
          <h3 class="pulpo-card__title">{{ DOCS_BTN.USER_GUIDE }}</h3>
          <p class="pulpo-card__body">Experiment, goals, journey, variants, resources, and refresh.</p>
          <span class="pulpo-card__link">{{ DOCS_BTN.USER_GUIDE }}</span>
        </a>
      </div>
    </section>
  </div>
</template>
