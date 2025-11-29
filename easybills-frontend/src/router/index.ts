import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'

// 👇 IMPORT YOUR DASHBOARD COMPONENT HERE

import DashboardView from '../views/DashboardView.vue'
 
const router = createRouter({

  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [

    {

      path: '/',

      name: 'home',

      component: HomeView

    },

    // 👇 ADD THIS NEW ROUTE BLOCK 👇

    {

      path: '/dashboard',

      name: 'dashboard',

      component: DashboardView

    }

  ]

})
 
export default router
 