import { createRouter, createWebHashHistory } from 'vue-router'

// 导入您的组件
// 例如：import Home from '../views/Home.vue'

// 定义路由
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue') // 懒加载组件
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Setting.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(), // 使用hash模式，适合Electron应用
  routes
})

export default router
