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
import { DOCS_BTN } from './.vitepress/theme/docs-labels'
</script>

<div class="pulpo-contact">

# Contact & feedback

<p class="pulpo-contact__intro">Questions, bugs, and ideas — pick the option that fits.</p>

::: tip From the Figma plugin
On the **intro screen**, use **Contact & feedback**. While editing an experiment, use **Contact** in the form footer (next to the version). Both open this page.
:::

<div class="pulpo-feedback-grid">

<div class="pulpo-feedback-card" id="questions">

### Ask a question

Most answers are already in the docs. Start with [FAQ](/FAQ) and [Troubleshooting](/TROUBLESHOOTING).

<div class="pulpo-feedback-card__actions">
  <PulpoButton href="/FAQ" variant="secondary" icon="arrow">{{ DOCS_BTN.BROWSE_FAQ }}</PulpoButton>
  <PulpoButton
    v-if="FEEDBACK_EMAIL"
    :href="'mailto:' + FEEDBACK_EMAIL"
    variant="secondary"
    icon="mail"
  >{{ DOCS_BTN.EMAIL_US }}</PulpoButton>
</div>

</div>

<div class="pulpo-feedback-card" id="bug-report">

### Report a bug

Found something broken? Open a GitHub issue with steps to reproduce, your Figma editor, and the Pulpo version.

<div class="pulpo-feedback-card__actions">
  <PulpoButton :href="GITHUB_NEW_BUG_URL" icon="external">{{ DOCS_BTN.REPORT_BUG }}</PulpoButton>
</div>

</div>

<div class="pulpo-feedback-card" id="feature-request">

### Request a feature

Tell us what problem you're solving and who would benefit. Check <a :href="GITHUB_ISSUES_URL">existing issues</a> first and add a 👍 if it's already there.

<div class="pulpo-feedback-card__actions">
  <PulpoButton :href="GITHUB_NEW_FEATURE_URL" icon="external">{{ DOCS_BTN.REQUEST_FEATURE }}</PulpoButton>
</div>

</div>

</div>

<p class="pulpo-contact__footer">
  All issues: <a :href="GITHUB_ISSUES_URL">GitHub Issues</a>
</p>

</div>
