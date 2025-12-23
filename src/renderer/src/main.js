// import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
// 导入路由模块
import router from './router'
// 导入Element Plus样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 导入LoadImg模块
import LoadImg from './assets/LoadImgs/LoadImg'
// 导入DICOM渲染器
import DICOMRenderer from './assets/Rendering/Rendering.js'

const app = createApp(App)
// 挂载LoadImg模块
app.config.globalProperties.$LoadImg = LoadImg
// 挂载DICOM渲染器
app.config.globalProperties.$DICOMRenderer = DICOMRenderer

app.use(ElementPlus)
app.use(router)
app.mount('#app')
