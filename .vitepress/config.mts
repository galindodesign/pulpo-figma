import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Pulpo',
  description: 'Create professional experiment flow diagrams in Figma',
  base: '/growthlab-infigma/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/GETTING_STARTED' },
      { text: 'User Guide', link: '/USER_GUIDE' },
      { text: 'FAQ', link: '/FAQ' }
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Quick Start', link: '/GETTING_STARTED' }
        ]
      },
      {
        text: 'Guide',
        items: [
          { text: 'User Guide', link: '/USER_GUIDE' },
          { text: 'Features', link: '/features' },
          { text: 'Best Practices', link: '/best-practices' }
        ]
      },
      {
        text: 'Help',
        items: [
          { text: 'FAQ', link: '/FAQ' },
          { text: 'Troubleshooting', link: '/TROUBLESHOOTING' }
        ]
      }
    ],
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Built for Growth Teams',
      copyright: 'Copyright © 2026 Pulpo'
    }
  }
})
