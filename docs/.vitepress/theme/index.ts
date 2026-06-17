import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import type { App } from 'vue'
import Layout from './Layout.vue'
import PulpoHome from './components/PulpoHome.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }: { app: App }) {
    app.component('PulpoHome', PulpoHome)
  },
} satisfies Theme
