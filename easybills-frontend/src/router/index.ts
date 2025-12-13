import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';

// Import Views
import DashboardView from '../views/DashboardView.vue';
import AccountsDashboardView from '../views/AccountsDashboardView.vue';
import MyClaimsView from '../views/MyClaimsView.vue';
import UploadBillView from '../views/UploadBillView.vue';
import ProfileView from '../views/ProfileView.vue';
import SettingsView from '../views/SettingsView.vue'; // 👈 IMPORT SETTINGS VIEW
import LandingView from '../views/LandingView.vue';
import EditClaimView from '../views/EditClaimView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LandingView
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
    },
    // 👇 ADD NEW ROUTE FOR SETTINGS
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/edit-claim/:id',
      name: 'edit-claim',
      component: EditClaimView,
      meta: { requiresAuth: true, role: 'Faculty' }
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
      
      // Prevent Accounts from seeing Faculty Dashboard (redirect to their own)
      if (role === 'Accounts' && to.path === '/dashboard') {
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