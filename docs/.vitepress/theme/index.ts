import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import type { App } from 'vue'
import Layout from './Layout.vue'
import PulpoButton from './components/PulpoButton.vue'
import PulpoHome from './components/PulpoHome.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }: { app: App }) {
    app.component('PulpoHome', PulpoHome)
    app.component('PulpoButton', PulpoButton)
  },
} satisfies Theme
