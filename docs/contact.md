---
layout: page
---

<script setup>
import {
  FEEDBACK_EMAIL,
  GITHUB_ISSUES_URL,
  GITHUB_NEW_BUG_URL,
  GITHUB_NEW_FEATURE_URL,
} from '../site-constants'
</script>

# Contact & feedback

We're building Pulpo with growth teams — tell us what you need.

<div class="pulpo-feedback-grid">

<div class="pulpo-feedback-card" id="questions">

### Ask a question

Most answers are already in the docs. Start with [FAQ](/FAQ) and [Troubleshooting](/TROUBLESHOOTING).

<a class="pulpo-btn pulpo-btn--secondary" href="/FAQ">Browse FAQ</a>

<template v-if="FEEDBACK_EMAIL">
  <p style="margin-top: 16px;">
    <a class="pulpo-btn pulpo-btn--secondary" :href="'mailto:' + FEEDBACK_EMAIL">Email us</a>
  </p>
</template>

</div>

<div class="pulpo-feedback-card" id="bug-report">

### Report a bug

Found something broken? Open a GitHub issue with steps to reproduce, your Figma editor, and the Pulpo version.

<a class="pulpo-btn pulpo-btn--primary" :href="GITHUB_NEW_BUG_URL" target="_blank" rel="noopener noreferrer">Report a bug</a>

</div>

<div class="pulpo-feedback-card" id="feature-request">

### Request a feature

Tell us what problem you're solving and who would benefit. Check [existing issues](https://github.com/galindolala1990/growthlab-infigma/issues) first and add a 👍 if it's already there.

<a class="pulpo-btn pulpo-btn--primary" :href="GITHUB_NEW_FEATURE_URL" target="_blank" rel="noopener noreferrer">Request a feature</a>

</div>

</div>

<p style="margin-top: 32px; font-size: 14px; color: var(--vp-c-text-3);">
  All issues: <a :href="GITHUB_ISSUES_URL">GitHub Issues</a>
</p>
