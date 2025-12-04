<script setup lang="ts">

import { ref, onMounted, onUnmounted } from 'vue';

import axios from 'axios';
 
// Props allows us to pass a different title for each page

defineProps<{

  pageTitle: string

}>();
 
// Define events

const emit = defineEmits(['logout-request']);
 
const user = ref<any>(null);

const showDropdown = ref(false);

const dropdownRef = ref<HTMLElement | null>(null);
 
// Fetch User Data for the Badge

onMounted(async () => {

  try {

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const response = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });

    if (response.data.success) {

      user.value = response.data.data;

    }

  } catch (error) {

    console.error('User info load error', error);

  }

  // Close dropdown when clicking outside

  document.addEventListener('click', handleClickOutside);

});
 
onUnmounted(() => {

  document.removeEventListener('click', handleClickOutside);

});
 
// Toggle Dropdown

const toggleDropdown = (event: Event) => {

  event.stopPropagation();

  showDropdown.value = !showDropdown.value;

};
 
// Close if clicked outside

const handleClickOutside = (event: MouseEvent) => {

  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {

    showDropdown.value = false;

  }

};
 
// Logout Function

const logout = () => {

   showDropdown.value = false; // Close the dropdown

   emit('logout-request');    // Send signal up

};
 
// Helpers

const getInitials = (email: string) => {

  if (!email) return 'U';

  return email.substring(0, 2).toUpperCase();

};
 
const getNameFromEmail = (email: string) => {
    if (!email) return 'User';
    
    const parts = email.split('@');
    
    // Check if parts exist
    if (parts && parts.length > 0) {
        // @ts-ignore: Suppress strict undefined check for deployment
        const namePart = parts[0];
        
        // @ts-ignore: Suppress strict check
        return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    
    return 'User';
}
  
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
<span class="user-id-text" v-if="user">{{ user.googleId?.substring(0,8) || 'User' }}</span>
<div class="avatar-circle">

                {{ user ? getInitials(user.email) : 'GU' }}
</div>
</div>
 
        <div v-if="showDropdown" class="user-dropdown">
<div class="dropdown-header">
<h3>{{ user ? getNameFromEmail(user.email) : 'Guest User' }}</h3>
<span class="role">{{ user?.role || 'Faculty' }}</span>
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
 
.brand-section {

  display: flex;

  align-items: center;

  gap: 15px;

}
 
.logo-text {

  font-size: 1.5rem;

  font-weight: 800;

  letter-spacing: -0.5px;

}
 
.divider-vertical {

  width: 1px;

  height: 24px;

  background-color: rgba(255,255,255,0.3);

}
 
.page-title {

  font-size: 1.1rem;

  font-weight: 400;

  opacity: 0.9;

}
 
.user-controls {

  display: flex;

  align-items: center;

  gap: 15px;

}
 
.icon-btn {

  background: none;

  border: none;

  color: white;

  cursor: pointer;

  opacity: 0.8;

  padding: 5px;

  border-radius: 50%;

  transition: 0.2s;

  display: flex;

}
 
.icon-btn:hover {

  background: rgba(255,255,255,0.1);

  opacity: 1;

}
 
.divider-vertical.small {

    height: 30px;

    margin: 0 5px;

}
 
.profile-wrapper {

    position: relative;

}
 
.user-summary {

    display: flex;

    align-items: center;

    gap: 10px;

    cursor: pointer;

    padding: 5px 10px;

    border-radius: 30px;

    transition: 0.2s;

}
 
.user-summary:hover {

    background: rgba(255,255,255,0.1);

}
 
.user-id-text {

    font-size: 0.9rem;

    font-weight: 500;

}
 
.avatar-circle {

    width: 36px;

    height: 36px;

    background-color: rgba(255,255,255,0.2);

    border-radius: 50%;

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 0.85rem;

    font-weight: 600;

    border: 2px solid rgba(255,255,255,0.4);

}
 
.user-dropdown {

    position: absolute;

    top: 55px;

    right: 0;

    width: 240px;

    background: white;

    color: #333;

    border-radius: 8px;

    box-shadow: 0 10px 25px rgba(0,0,0,0.15);

    z-index: 100;

    animation: fadeIn 0.2s ease;

    border: 1px solid #eee;

}
 
.dropdown-header {

    padding: 15px;

    background-color: #f8f9fa;

    border-radius: 8px 8px 0 0;

}
 
.dropdown-header h3 {

    margin: 0;

    font-size: 1rem;

    font-weight: 700;

    color: #1e3a8a;

}
 
.dropdown-header .role {

    font-size: 0.85rem;

    color: #666;

    display: block;

    margin-top: 4px;

}
 
.dropdown-divider {

    height: 1px;

    background: #eee;

}
 
.logout-item {

    width: 100%;

    padding: 12px 15px;

    display: flex;

    justify-content: space-between;

    align-items: center;

    border: none;

    background: none;

    cursor: pointer;

    color: #333;

    font-size: 0.95rem;

    font-weight: 500;

    transition: 0.2s;

}
 
.logout-item:hover {

    background-color: #ffeaea;

    color: #d63031;

}
 
@keyframes fadeIn {

    from { opacity: 0; transform: translateY(-10px); }

    to { opacity: 1; transform: translateY(0); }

}
</style>
 
