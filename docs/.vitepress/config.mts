import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Growthlab Builder',
  description: 'Figma plugin to visually build and manage experiment flows',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/GETTING_STARTED' },
      { text: 'User Guide', link: '/USER_GUIDE' },
      { text: 'FAQ', link: '/FAQ' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/GETTING_STARTED' },
          { text: 'Features', link: '/features' },
          { text: 'User Guide', link: '/USER_GUIDE' },
          { text: 'Best Practices', link: '/best-practices' },
          { text: 'Troubleshooting', link: '/TROUBLESHOOTING' },
          { text: 'FAQ', link: '/FAQ' },
        ],
      },
      {
        text: 'Developer',
        items: [
          { text: 'Figma Plugin API', link: '/dev/figma-api' },
          { text: 'Manifest', link: '/dev/manifest' },
          { text: 'Messaging', link: '/dev/messaging' },
          { text: 'Release Checklist', link: '/dev/release-checklist' },
          { text: 'UX Guidelines', link: '/dev/ux-guidelines' },
        ],
      },
    ],
    socialLinks: [],
  },
})
