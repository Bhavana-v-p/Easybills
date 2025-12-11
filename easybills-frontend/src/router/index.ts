import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';

// Import Views
import DashboardView from '../views/DashboardView.vue';
import AccountsDashboardView from '../views/AccountsDashboardView.vue';
import MyClaimsView from '../views/MyClaimsView.vue';
import UploadBillView from '../views/UploadBillView.vue';
import ProfileView from '../views/ProfileView.vue';
import LandingView from '../views/LandingView.vue'; // 👈 Import the new page

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LandingView // 👈 Show Landing Page, DO NOT Redirect
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, role: 'Faculty' }
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: AccountsDashboardView,
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

// Guard Logic
router.beforeEach(async (to, from, next) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If route is public (like Landing Page), let them in
  if (!to.meta.requiresAuth) return next();

  try {
    const res = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });
    
    if (res.data.success) {
      const role = res.data.data.role;

      // Role Checks
      if (to.meta.role === 'Accounts' && role !== 'Accounts') {
        return next('/dashboard');
      }
      if (role === 'Accounts' && (to.path === '/dashboard' || to.path === '/')) {
        return next('/accounts');
      }
      
      next(); // Allow access
    } else {
      // Login failed? Send to Landing Page
      next('/'); 
    }
  } catch (e) {
    // Network error or 401? Send to Landing Page
    next('/');
  }
});

export default router;