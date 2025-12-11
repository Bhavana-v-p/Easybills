<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import axios from 'axios';

// Props
defineProps<{
  pageTitle: string
}>();

// Events
const emit = defineEmits(['logout-request']);

// State
const user = ref<any>(null);
const showDropdown = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const loading = ref(true);

// 1. Fetch User Data
const fetchUserData = async () => {
  loading.value = true;
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });
    if (response.data.success) {
      user.value = response.data.data;
    }
  } catch (error) {
    console.error('User info load error', error);
  } finally {
    loading.value = false;
  }
};

// 2. Computed Helpers
const userInitials = computed(() => {
  if (!user.value) return 'GU';
  
  // Use Name if available
  if (user.value.name) {
    const names = user.value.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
  
  // Fallback to Email
  if (user.value.email) {
    return user.value.email.substring(0, 2).toUpperCase();
  }
  return 'U';
});

const displayName = computed(() => {
  if (!user.value) return 'Loading...';
  // Return Name if exists, otherwise Email
  return user.value.name || user.value.email || 'User';
});

// Lifecycle Hooks
onMounted(() => {
  fetchUserData();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Dropdown Logic
const toggleDropdown = (event: Event) => {
  event.stopPropagation();
  showDropdown.value = !showDropdown.value;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false;
  }
};

const logout = () => {
   showDropdown.value = false;
   emit('logout-request');
};
</script>

<template>
  <div class="top-nav-bar">
    <div class="brand-section">
      <h1 class="logo-text">EasyBills</h1>
      <div class="divider-vertical"></div>
      <span class="page-title">{{ pageTitle }}</span>
    </div>

    <div class="user-controls">
      <button class="icon-btn" title="Help">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      </button>

      <button class="icon-btn" title="Menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      <div class="divider-vertical small"></div>

      <div class="profile-wrapper" ref="dropdownRef">
        
        <div class="user-summary" @click="toggleDropdown">
          <span class="user-name-text" v-if="!loading">{{ displayName }}</span>
          
          <div class="avatar-circle">
            <img v-if="user?.picture" :src="user.picture" alt="Avatar" class="nav-profile-img" />
            <span v-else>{{ userInitials }}</span>
          </div>
        </div>

        <div v-if="showDropdown" class="user-dropdown">
          <div class="dropdown-header">
            <h3>{{ displayName }}</h3>
            <span class="role">{{ user?.role || 'User' }}</span>
            <span class="email-sub">{{ user?.email }}</span>
          </div>
          <div class="dropdown-divider"></div>
          <button class="logout-item" @click="logout">
            <span>Logout</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
/* Main Bar Styling */
.top-nav-bar {
  background: linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%);
  color: white;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.brand-section { display: flex; align-items: center; gap: 15px; }
.logo-text { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }
.divider-vertical { width: 1px; height: 24px; background-color: rgba(255,255,255,0.3); }
.page-title { font-size: 1.1rem; font-weight: 400; opacity: 0.9; }

.user-controls { display: flex; align-items: center; gap: 15px; }

.icon-btn {
  background: none; border: none; color: white; cursor: pointer;
  opacity: 0.8; padding: 5px; border-radius: 50%; transition: 0.2s; display: flex;
}
.icon-btn:hover { background: rgba(255,255,255,0.1); opacity: 1; }

.divider-vertical.small { height: 30px; margin: 0 5px; }

.profile-wrapper { position: relative; }

.user-summary {
  display: flex; align-items: center; gap: 12px; cursor: pointer;
  padding: 6px 12px; border-radius: 30px; transition: 0.2s;
  border: 1px solid transparent;
}
.user-summary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

.user-name-text { font-size: 0.95rem; font-weight: 600; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Avatar Styling */
.avatar-circle {
  width: 38px; height: 38px; background-color: rgba(255,255,255,0.2);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; font-weight: 700; border: 2px solid rgba(255,255,255,0.8);
  overflow: hidden; /* Ensures image stays circular */
}
.nav-profile-img { width: 100%; height: 100%; object-fit: cover; }

/* Dropdown */
.user-dropdown {
  position: absolute; top: 60px; right: 0; width: 260px;
  background: white; color: #333; border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15); z-index: 100;
  animation: fadeIn 0.2s ease; border: 1px solid #e5e7eb; overflow: hidden;
}

.dropdown-header { padding: 16px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.dropdown-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827; }
.dropdown-header .role { 
  display: inline-block; font-size: 0.75rem; font-weight: 700; 
  color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 12px; margin-top: 6px; text-transform: uppercase;
}
.email-sub { display: block; font-size: 0.85rem; color: #6b7280; margin-top: 4px; }

.dropdown-divider { height: 1px; background: #e5e7eb; }

.logout-item {
  width: 100%; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center;
  border: none; background: none; cursor: pointer; color: #4b5563;
  font-size: 0.95rem; font-weight: 500; transition: 0.2s;
}
.logout-item:hover { background-color: #fef2f2; color: #dc2626; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>