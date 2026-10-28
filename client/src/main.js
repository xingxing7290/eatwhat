import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { provideGlobalConfig } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

import App from './App.vue'
import router from './router'

const savedColorTheme = localStorage.getItem('colorTheme') || 'cream'
document.documentElement.dataset.theme = savedColorTheme

const app = createApp(App)

app.use(createPinia())
app.use(router)
// Keep programmatic messages/dialogs localized while components are loaded on demand.
provideGlobalConfig({ locale: zhCn }, app, true)

app.mount('#app')
