# EasyBills - Frontend Integration Guide

This guide helps you integrate the EasyBills Vue.js frontend with the Express backend, following Figma UI/UX designs.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│     Vue.js Frontend (Port 5173)         │
│  - Figma-based UI/UX Components         │
│  - Vuex/Pinia State Management          │
│  - Vue Router for Navigation             │
└────────────────┬────────────────────────┘
                 │
                 │ CORS-enabled HTTP/HTTPS
                 │ Session Cookies (credentials: include)
                 │
┌────────────────▼────────────────────────┐
│   Express Backend (Port 3000)           │
│  - Passport Google OAuth 2.0            │
│  - Session-based Authentication         │
│  - RESTful API Endpoints                 │
│  - Firebase Cloud Storage Integration   │
└─────────────────────────────────────────┘
                 │
                 │
┌────────────────▼────────────────────────┐
│     PostgreSQL Database                 │
│  - Claims with JSONB Audit Trails       │
│  - User Accounts & Roles                │
│  - Email Notification Logs              │
└─────────────────────────────────────────┘
```

## Backend Setup for Frontend Development

### 1. Environment Configuration

Create `.env` file in backend root:

```bash
# Database
PG_DATABASE=easybills_db
PG_USER=postgres
PG_PASSWORD=your_secure_password
PG_HOST=localhost

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173  # Vue.js Vite dev server

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
GOOGLE_ALLOWED_DOMAIN=bits-pilani.ac.in

# Session
SESSION_SECRET=your_random_secret_key_change_in_production

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@easybills.com

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-key.json
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Backend Development Server

```bash
# Development with auto-reload (requires nodemon)
npm run dev

# Or standard Node
npm start
```

Server runs on `http://localhost:3000`

---

## Frontend Setup (Vue.js + Vite)

### 1. Create Vue 3 Project with Vite

```bash
npm create vue@latest easybills-frontend -- --typescript --router --pinia
cd easybills-frontend
npm install
```

### 2. Install Required Dependencies

```bash
npm install axios pinia vue-router
npm install -D tailwindcss postcss autoprefixer  # For Figma design implementation
npm install -D sass  # If using SCSS
```

### 3. Configure Axios for Backend Integration

Create `src/api/axios.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: Include session cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = `${API_BASE_URL}/auth/google`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 4. Create Environment Variables

Create `.env.development`:
```
VITE_API_BASE_URL=http://localhost:3000
```

Create `.env.production`:
```
VITE_API_BASE_URL=https://api.easybills.example.com
```

### 5. Start Vue.js Development Server

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## State Management with Pinia

### 1. User Store

Create `src/stores/userStore.ts`:

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/api/axios';

export const useUserStore = defineStore('user', () => {
  const user = ref<any>(null);
  const isAuthenticated = computed(() => !!user.value);

  async function fetchUser() {
    try {
      const { data } = await apiClient.get('/api/user/me');
      user.value = data.data;
    } catch (error) {
      user.value = null;
      throw error;
    }
  }

  async function login() {
    window.location.href = `${apiClient.defaults.baseURL}/auth/google`;
  }

  async function logout() {
    try {
      await apiClient.get('/api/user/logout');
      user.value = null;
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return { user, isAuthenticated, fetchUser, login, logout };
});
```

### 2. Claims Store

Create `src/stores/claimsStore.ts`:

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/api/axios';

interface Claim {
  id: number;
  category: string;
  amount: number;
  description: string;
  dateIncurred: string;
  status: string;
  documents: any[];
  auditTrail: any[];
  createdAt: string;
}

export const useClaimsStore = defineStore('claims', () => {
  const claims = ref<Claim[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchClaims(filters = {}) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await apiClient.get('/api/faculty/claims', { params: filters });
      claims.value = data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch claims';
    } finally {
      loading.value = false;
    }
  }

  async function submitClaim(claimData: any) {
    try {
      const { data } = await apiClient.post('/api/faculty/claims', claimData);
      claims.value.unshift(data.data);
      return data;
    } catch (err: any) {
      throw err.response?.data || { error: 'Failed to submit claim' };
    }
  }

  async function updateClaimStatus(claimId: number, status: string, notes: string) {
    try {
      const { data } = await apiClient.put(
        `/api/finance/claims/${claimId}/status`,
        { status, notes }
      );
      // Update local claim
      const claim = claims.value.find(c => c.id === claimId);
      if (claim) {
        claim.status = status;
      }
      return data;
    } catch (err: any) {
      throw err.response?.data || { error: 'Failed to update status' };
    }
  }

  async function uploadDocument(claimId: number, file: File) {
    const formData = new FormData();
    formData.append('document', file);
    
    try {
      const { data } = await apiClient.post(
        `/api/faculty/claims/${claimId}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    } catch (err: any) {
      throw err.response?.data || { error: 'Failed to upload document' };
    }
  }

  return {
    claims,
    loading,
    error,
    fetchClaims,
    submitClaim,
    updateClaimStatus,
    uploadDocument
  };
});
```

---

## Vue Router Setup

Create `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    component: () => import('@/pages/LoginPage.vue')
  },
  {
    path: '/dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/claims',
    component: () => import('@/pages/ClaimsListPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/claims/new',
    component: () => import('@/pages/SubmitClaimPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/claims/:id',
    component: () => import('@/pages/ClaimDetailPage.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Auth guard
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    // Try to fetch user
    try {
      await userStore.fetchUser();
      next();
    } catch {
      // Not authenticated, redirect to login
      next('/login');
    }
  } else {
    next();
  }
});

export default router;
```

---

## Figma to Vue Component Mapping

When implementing Figma designs, follow these patterns:

### Button Component

```vue
<template>
  <button
    :class="[
      'px-4 py-2 rounded-lg font-medium transition-colors',
      {
        'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
        'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
        'bg-red-600 text-white hover:bg-red-700': variant === 'danger'
      }
    ]"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
}>();

defineEmits<{
  click: []
}>();
</script>
```

### Form Input Component

```vue
<template>
  <div class="mb-4">
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <p v-if="error" class="text-sm text-red-500 mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  modelValue: string;
}>();

defineEmits<{
  'update:modelValue': [value: string]
}>();
</script>
```

### Modal Component

```vue
<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
      <div class="flex justify-between items-center p-6 border-b">
        <h2 class="text-xl font-semibold">{{ title }}</h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      <div class="p-6">
        <slot />
      </div>
      <div class="flex justify-end gap-3 p-6 border-t">
        <button @click="close" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
          Cancel
        </button>
        <button @click="confirm" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isOpen = ref(false);

const props = defineProps<{
  title: string;
}>();

const emit = defineEmits<{
  confirm: []
}>();

const open = () => { isOpen.value = true; };
const close = () => { isOpen.value = false; };
const confirm = () => { emit('confirm'); close(); };

defineExpose({ open, close });
</script>
```

---

## Common Workflows

### 1. Submit Claim Workflow

```vue
<template>
  <form @submit.prevent="submitClaim">
    <FormInput
      id="category"
      label="Category"
      v-model="form.category"
      required
    />
    <FormInput
      id="amount"
      label="Amount"
      type="number"
      v-model="form.amount"
      required
    />
    <FormInput
      id="description"
      label="Description"
      v-model="form.description"
      required
    />
    <FormInput
      id="dateIncurred"
      label="Date Incurred"
      type="date"
      v-model="form.dateIncurred"
      required
    />
    <Button variant="primary" type="submit" :disabled="loading">
      {{ loading ? 'Submitting...' : 'Submit Claim' }}
    </Button>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useClaimsStore } from '@/stores/claimsStore';
import FormInput from '@/components/FormInput.vue';
import Button from '@/components/Button.vue';

const claimsStore = useClaimsStore();
const loading = ref(false);

const form = reactive({
  category: '',
  amount: '',
  description: '',
  dateIncurred: ''
});

async function submitClaim() {
  loading.value = true;
  try {
    await claimsStore.submitClaim(form);
    alert('Claim submitted successfully!');
    // Reset form or redirect
  } catch (error: any) {
    alert(error.error || 'Failed to submit claim');
  } finally {
    loading.value = false;
  }
}
</script>
```

### 2. Display Claims List with Filters

```vue
<template>
  <div>
    <div class="mb-6 flex gap-4">
      <FormInput
        id="statusFilter"
        label="Filter by Status"
        v-model="filters.status"
      />
      <Button @click="fetchClaims" variant="secondary">
        Apply Filters
      </Button>
    </div>

    <div v-if="loading" class="text-center py-8">Loading claims...</div>

    <div v-else-if="claims.length === 0" class="text-center py-8 text-gray-500">
      No claims found
    </div>

    <div v-else class="space-y-4">
      <ClaimCard
        v-for="claim in claims"
        :key="claim.id"
        :claim="claim"
        @view="viewClaim"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useClaimsStore } from '@/stores/claimsStore';
import FormInput from '@/components/FormInput.vue';
import Button from '@/components/Button.vue';
import ClaimCard from '@/components/ClaimCard.vue';

const claimsStore = useClaimsStore();
const loading = ref(false);
const filters = reactive({ status: '' });

const claims = computed(() => claimsStore.claims);

async function fetchClaims() {
  loading.value = true;
  try {
    await claimsStore.fetchClaims(filters);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchClaims();
});
</script>
```

---

## Deployment Checklist

### Backend (Express)

- [ ] Set `NODE_ENV=production`
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Enable HTTPS in CORS configuration
- [ ] Use environment variables for all secrets
- [ ] Set `secure: true` in session cookie
- [ ] Implement rate limiting middleware
- [ ] Add request logging middleware
- [ ] Set up monitoring/error tracking (e.g., Sentry)
- [ ] Run database migrations
- [ ] Test all API endpoints
- [ ] Configure reverse proxy (nginx)

### Frontend (Vue.js)

- [ ] Update API endpoint to production URL
- [ ] Build production bundle: `npm run build`
- [ ] Test all workflows in production mode
- [ ] Enable analytics
- [ ] Set up error tracking
- [ ] Configure CDN for static assets
- [ ] Implement PWA (optional)
- [ ] Add security headers via `.htaccess` or nginx config
- [ ] SSL certificate configured
- [ ] Test OAuth flow with production credentials

---

## Testing Integration

### API Testing

Use Postman or curl to test endpoints:

```bash
# Get authenticated user
curl -X GET http://localhost:3000/api/user/me \
  -H "Cookie: connect.sid=your_session_id"

# Submit claim
curl -X POST http://localhost:3000/api/faculty/claims \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your_session_id" \
  -d '{
    "category":"Travel",
    "amount":5000,
    "description":"Conference",
    "dateIncurred":"2025-01-15"
  }'
```

### Frontend Testing

Use Vue Test Utils and Vitest:

```bash
npm install -D vitest @vue/test-utils
npm run test:unit
```

---

## Support & Documentation

- **API Docs**: See `API_REFERENCE.md`
- **Backend Instructions**: See `.github/copilot-instructions.md`
- **Figma Design**: [Link to your Figma project]
- **Database Schema**: See `models/`

For questions or issues, contact the development team.
