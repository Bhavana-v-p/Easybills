import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DashboardView from '../views/DashboardView.vue'
import MyClaimsView from '../views/MyClaimsView.vue'
import UploadBillView from '../views/UploadBillView.vue'
import ProfileView from '../views/ProfileView.vue'
// 1. Import Admin View
import AccountsDashboardView from '../views/AccountsDashboardView.vue'
 
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/dashboard', name: 'dashboard', component: DashboardView },
    { path: '/my-claims', name: 'my-claims', component: MyClaimsView },
    { path: '/upload-bill', name: 'upload-bill', component: UploadBillView },
    { path: '/profile', name: 'profile', component: ProfileView },
    // 2. Add Admin Route
    { 
      path: '/admin', 
      name: 'admin', 
      component: AccountsDashboardView 
    }
  ]
})
 
export default router