// import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
// 导入路由模块
import router from './router'
// 导入Element Plus样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
