import { createRouter, createWebHistory } from 'vue-router'
// Import the new view
import LoginView from '../views/LoginView.vue' 
import DashboardView from '../views/DashboardView.vue'
import MyClaimsView from '../views/MyClaimsView.vue'
import UploadBillView from '../views/UploadBillView.vue'
import ProfileView from '../views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 👇 CHANGE THIS: Make Login the default home page
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    { path: '/dashboard', name: 'dashboard', component: DashboardView },
    { path: '/my-claims', name: 'my-claims', component: MyClaimsView },
    { path: '/upload-bill', name: 'upload-bill', component: UploadBillView },
    { path: '/profile', name: 'profile', component: ProfileView }
  ]
})

export default router