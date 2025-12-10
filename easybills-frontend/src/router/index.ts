import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';

// Import Views
import DashboardView from '../views/DashboardView.vue';
// 👇 IMPORT THE NEW FILE
import AccountsDashboardView from '../views/AccountsDashboardView.vue'; 
import MyClaimsView from '../views/MyClaimsView.vue';
import UploadBillView from '../views/UploadBillView.vue';
import ProfileView from '../views/ProfileView.vue';
// import SettingsView from '../views/SettingsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard'
    },
    // Faculty Dashboard
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, role: 'Faculty' } 
    },
    // 👇 ACCOUNTS DASHBOARD ROUTE
    {
      path: '/accounts',
      name: 'accounts',
      component: AccountsDashboardView, // <--- MUST MATCH THE IMPORT ABOVE
      meta: { requiresAuth: true, role: 'Accounts' } 
    },
    {
      path: '/my-claims',
      name: 'my-claims',
      component: MyClaimsView,
      meta: { requiresAuth: true, role: 'Faculty' }
    },
    {
      path: '/upload-bill',
      name: 'upload-bill',
      component: UploadBillView,
      meta: { requiresAuth: true, role: 'Faculty' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    }
  ]
});

// ... keep your beforeEach guard exactly as it is ...

export default router;