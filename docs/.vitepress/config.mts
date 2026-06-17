import { defineConfig } from 'vitepress'
import {
  DOCS_SITE_URL,
  FIGMA_COMMUNITY_URL,
  GITHUB_REPO_URL,
  PLUGIN_VERSION,
} from '../../site-constants'

export default defineConfig({
  title: 'Pulpo',
  description: 'Create professional experiment flow diagrams in Figma',
  base: '/pulpo-figma/',
  ignoreDeadLinks: true,
  srcExclude: [
    'GITBOOK_CONTENT_DESIGN.md',
    'README.md',
  ],
  head: [
    ['link', { rel: 'icon', href: '/pulpo-icon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'icon', href: '/pulpo-icon.png', type: 'image/png', sizes: '62x62' }],
    ['meta', { property: 'og:title', content: 'Pulpo — Experiment flows for Figma' }],
    ['meta', { property: 'og:description', content: 'Experiments belong on the canvas, not in slides.' }],
    ['meta', { property: 'og:image', content: `${DOCS_SITE_URL}pulpo-icon.png` }],
    ['meta', { property: 'og:url', content: DOCS_SITE_URL }],
  ],
  themeConfig: {
    siteTitle: 'Pulpo',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick start', link: '/GETTING_STARTED' },
      { text: 'Guide', link: '/USER_GUIDE' },
      { text: 'Help', link: '/FAQ' },
    ],
    sidebar: {
      '/dev/': [
        {
          text: 'Developer',
          items: [
            { text: 'Overview', link: '/dev/' },
            { text: 'Figma Plugin API', link: '/dev/figma-api' },
            { text: 'Manifest', link: '/dev/manifest' },
            { text: 'Messaging', link: '/dev/messaging' },
            { text: 'UX guidelines', link: '/dev/ux-guidelines' },
            { text: 'Release checklist', link: '/dev/release-checklist' },
            { text: 'Email notifications', link: '/dev/notifications' },
          ],
        },
      ],
      '/': [
        {
          text: 'Start here',
          items: [
            { text: 'Overview', link: '/' },
            { text: 'Quick start', link: '/GETTING_STARTED' },
          ],
        },
        {
          text: 'Use Pulpo',
          items: [
            { text: 'User guide', link: '/USER_GUIDE' },
            { text: 'Experiment details', link: '/guide/experiment' },
            { text: 'Goals & metrics', link: '/guide/goals' },
            { text: 'Journey mapping', link: '/guide/journey' },
            { text: 'Variants', link: '/guide/variants' },
            { text: 'Resources', link: '/guide/resources' },
            { text: 'Refresh vs create', link: '/guide/refresh' },
            { text: 'Examples', link: '/examples/' },
            { text: 'Best practices', link: '/best-practices' },
            { text: 'Glossary', link: '/glossary' },
          ],
        },
        {
          text: 'Help',
          items: [
            { text: 'FAQ', link: '/FAQ' },
            { text: 'Troubleshooting', link: '/TROUBLESHOOTING' },
            { text: 'Contact', link: '/contact' },
            { text: "What's new", link: '/changelog' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: GITHUB_REPO_URL },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: `Pulpo v${PLUGIN_VERSION} · Built for growth teams · <a href="/dev/">Developer docs</a>`,
      copyright: 'Copyright © 2026 Pulpo',
    },
  },
})
