---
title: Contact & feedback
---

<script setup>
import {
  FEEDBACK_EMAIL,
  GITHUB_ISSUES_URL,
  GITHUB_NEW_BUG_URL,
  GITHUB_NEW_FEATURE_URL,
} from '../site-constants'
</script>

<div class="pulpo-contact">

# Contact & feedback

<p class="pulpo-contact__intro">Questions, bugs, and ideas — pick the option that fits.</p>

<div class="pulpo-feedback-grid">

<div class="pulpo-feedback-card" id="questions">

### Ask a question

Most answers are already in the docs. Start with [FAQ](/FAQ) and [Troubleshooting](/TROUBLESHOOTING).

<div class="pulpo-feedback-card__actions">
  <a class="pulpo-btn pulpo-btn--secondary" href="/FAQ">Browse FAQ</a>
  <a
    v-if="FEEDBACK_EMAIL"
    class="pulpo-btn pulpo-btn--secondary"
    :href="'mailto:' + FEEDBACK_EMAIL"
  >Email us</a>
</div>

</div>

<div class="pulpo-feedback-card" id="bug-report">

### Report a bug

Found something broken? Open a GitHub issue with steps to reproduce, your Figma editor, and the Pulpo version.

<div class="pulpo-feedback-card__actions">
  <a class="pulpo-btn pulpo-btn--primary" :href="GITHUB_NEW_BUG_URL" target="_blank" rel="noopener noreferrer">Report a bug</a>
</div>

</div>

<div class="pulpo-feedback-card" id="feature-request">

### Request a feature

Tell us what problem you're solving and who would benefit. Check [existing issues](https://github.com/galindodesign/pulpo-figma/issues) first and add a 👍 if it's already there.

<div class="pulpo-feedback-card__actions">
  <a class="pulpo-btn pulpo-btn--primary" :href="GITHUB_NEW_FEATURE_URL" target="_blank" rel="noopener noreferrer">Request a feature</a>
</div>

</div>

</div>

<p class="pulpo-contact__footer">
  All issues: <a :href="GITHUB_ISSUES_URL">GitHub Issues</a>
</p>

</div>
