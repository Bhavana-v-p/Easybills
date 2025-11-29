import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DashboardView from '../views/DashboardView.vue'
import MyClaimsView from '../views/MyClaimsView.vue' // Import the file you made
 
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/dashboard', name: 'dashboard', component: DashboardView },
 
    // This is where the slash goes! Inside the code:
    { 
      path: '/my-claims', 
      name: 'my-claims', 
      component: MyClaimsView 
    }
  ]
})
 
export default router