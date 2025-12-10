<script setup lang="ts">

import { ref, onMounted, computed } from 'vue';

import axios from 'axios';

import { useRouter } from 'vue-router';

// Import the new modal

import LogoutModal from '../components/LogoutModal.vue';
import TopNavBar from '../components/TopNavBar.vue';
 
const router = useRouter();

const user = ref<any>(null);

const loading = ref(true);

const uploading = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);

const showLogoutModal = ref(false); // State for popup
 
// Fetch User Data

onMounted(async () => {

  try {

    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const response = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });

    if (response.data.success) user.value = response.data.data;

  } catch (error) {

    console.error(error);

  } finally {

    loading.value = false;

  }

});
 
// Profile Picture Logic

const defaultAvatar = 'https://ui-avatars.com/api/?background=6366f1&color=fff&name=User';
 
const handleFileChange = async (event: Event) => {

  const target = event.target as HTMLInputElement;

  if (target.files && target.files[0]) {

    uploading.value = true;

    const file = target.files[0];

    // Simulate upload (Replace with real API call later)

    setTimeout(() => {

      const reader = new FileReader();

      reader.onload = (e) => {

        if(user.value) user.value.picture = e.target?.result; // Update locally

        alert("Profile picture updated permanently!"); 

      };

      reader.readAsDataURL(file);

      uploading.value = false;

    }, 1500);

  }

};
 
// Logout Logic

const confirmLogout = async () => {

   const apiUrl = import.meta.env.VITE_API_BASE_URL;

   try {

       await axios.get(`${apiUrl}/auth/logout`, { withCredentials: true });

   } catch (e) { console.error(e); }

   window.location.href = 'http://localhost:3000/landing.html';

};
 
const navigate = (path: string) => router.push(path);
</script>
 
<template>
<div class="page-container">
<div class="sidebar">
  <div class="main-content">
      <div class="main" style="padding: 0;"> <TopNavBar pageTitle="Profile" />
<h2>EasyBills</h2>
<div class="menu-item" @click="navigate('/dashboard')">Dashboard</div>
<div class="menu-item" @click="navigate('/my-claims')">My Claims</div>
<div class="menu-item" @click="navigate('/upload-bill')">Upload Bill</div>
<div class="menu-item active" @click="navigate('/profile')">Profile</div>
<div class="menu-item" @click="navigate('/settings')">Settings</div>
</div>
 
    <div class="main-centered">
<div v-if="loading">Loading...</div>
 
      <div v-else class="profile-card">
<div class="avatar-wrapper">
<img :src="user?.picture || defaultAvatar" class="avatar-img" />
<button class="edit-btn" @click="fileInput?.click()">

            ✎
</button>
<input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" hidden />
</div>
 
        <h2 class="user-name">{{ user?.email?.split('@')[0] }}</h2>
<span class="user-role">{{ user?.role || 'Faculty' }}</span>
 
        <div class="info-grid">
<div class="info-row">
<span class="label">Email</span>
<span class="value">{{ user?.email }}</span>
</div>
<div class="info-row">
<span class="label">Google ID</span>
<span class="value">{{ user?.googleId }}</span>
</div>
</div>
 
        <div class="actions">
<button class="logout-btn" @click="showLogoutModal = true">Logout</button>
</div>
 
      </div>
</div>
 
    <LogoutModal 

      v-if="showLogoutModal" 

      @close="showLogoutModal = false" 

      @confirm="confirmLogout" 

    />
 
  </div>
</template>
 
<style scoped>

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
 
.page-container {

  display: flex; height: 100vh; font-family: 'Inter', sans-serif; background: #f5f6fa;

}
 
/* Sidebar (Same as others) */

.sidebar { width: 260px; min-width: 260px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem 1.5rem; }

.sidebar h2 { font-size: 1.6rem; margin-bottom: 2rem; text-align: center; font-weight: 700; }

.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s; }

.menu-item:hover { background: rgba(255, 255, 255, 0.2); }

.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }
 
/* Centered Layout */

.main-centered {

  flex: 1;

  display: flex;

  justify-content: center;

  align-items: center; /* Center Vertically */

}
 
.profile-card {

  background: white;

  padding: 3rem;

  border-radius: 16px;

  box-shadow: 0 10px 30px rgba(0,0,0,0.08);

  width: 450px;

  text-align: center;

}
 
.avatar-wrapper {

  position: relative;

  width: 120px; height: 120px;

  margin: 0 auto 1.5rem;

}
 
.avatar-img {

  width: 100%; height: 100%;

  border-radius: 50%;

  object-fit: cover;

  border: 4px solid #f3f4f6;

}
 
.edit-btn {

  position: absolute; bottom: 0; right: 0;

  background: #6366f1; color: white;

  border: none; width: 32px; height: 32px; border-radius: 50%;

  cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;

}
 
.user-name { font-size: 1.5rem; color: #111827; margin-bottom: 0.2rem; }

.user-role { color: #6b7280; font-size: 0.9rem; background: #f3f4f6; padding: 4px 12px; border-radius: 20px; }
 
.info-grid { margin: 2rem 0; text-align: left; }

.info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }

.label { color: #6b7280; font-weight: 500; }

.value { color: #111827; font-weight: 600; }
 
.logout-btn {

  width: 100%;

  padding: 0.8rem;

  background: #fff;

  border: 2px solid #ef4444;

  color: #ef4444;

  font-weight: 600;

  border-radius: 8px;

  cursor: pointer;

  transition: 0.2s;

}

.logout-btn:hover { background: #ef4444; color: white; }
</style>
 