import { createRouter, createWebHistory } from 'vue-router'

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
    path: '/patientList',
    name: 'PatientList',
    component: () => import('../views/PatientList.vue')
  },
  {
    path: '/showImg',
    name: 'ShowImg',
    component: () => import('../views/ShowImg.vue'),
    props: true // 允许传递参数到组件
  },
  {
    path: '/imgPage',
    name: 'ImgPage',
    component: () => import('../views/ImgPage.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用history模式
  routes
})

export default router
