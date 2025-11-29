<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
 
const router = useRouter();
const user = ref<any>(null);
const loading = ref(true);
const uploading = ref(false);
 
// Placeholder avatar (initials or default image)
const defaultAvatar = 'https://ui-avatars.com/api/?background=667eea&color=fff&name=User';
 
// File upload state
const fileInput = ref<HTMLInputElement | null>(null);
const previewImage = ref<string | null>(null);
 
// Fetch user data
onMounted(async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await axios.get(`${apiUrl}/api/user/me`, {
      withCredentials: true
    });
    if (response.data.success) {
      user.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
  } finally {
    loading.value = false;
  }
});
 
// Navigation helper
const navigate = (path: string) => {
  router.push(path);
};
 
// Trigger hidden file input
const triggerFileInput = () => {
  fileInput.value?.click();
};
 
// Handle file selection
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    // Create local preview URL
    previewImage.value = URL.createObjectURL(file);
    // Here you would typically call your backend API to upload the file
    // uploadAvatar(file);
  }
};
 
// Mock Upload Function (Connect this to backend later)
const saveProfile = async () => {
  uploading.value = true;
  // Simulate network request
  setTimeout(() => {
    alert('Profile picture updated successfully! (Frontend Only)');
    uploading.value = false;
  }, 1000);
};
 
// Compute Display Name from Email (since Name field doesn't exist in DB yet)
const displayName = computed(() => {
  if (!user.value?.email) return 'Faculty Member';
  const namePart = user.value.email.split('@')[0];
  // Capitalize first letter
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
});
</script>
 
<template>
<div class="page-container">
<div class="sidebar">
<h2>EasyBills</h2>
<div class="menu-item" @click="navigate('/dashboard')">Dashboard</div>
<div class="menu-item" @click="navigate('/my-claims')">My Claims</div>
<div class="menu-item" @click="navigate('/upload-bill')">Upload Bill</div>
<div class="menu-item active" @click="navigate('/profile')">Profile</div>
<div class="menu-item" @click="navigate('/settings')">Settings</div>
</div>
 
    <div class="main">
<div class="topbar">
<h1>My Profile</h1>
</div>
 
      <div v-if="loading" class="loading">Loading profile...</div>
 
      <div v-else class="profile-card">
<div class="profile-header">
<div class="avatar-container" @click="triggerFileInput">
<img :src="previewImage || user?.avatar || defaultAvatar" alt="Profile" class="avatar-img" />
<div class="overlay">
<span>📷 Update</span>
</div>
</div>
<input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" style="display: none;" />
<div class="header-info">
<h2>{{ displayName }}</h2>
<span class="role-badge">{{ user?.role || 'User' }}</span>
</div>
</div>
 
        <div class="form-grid">
<div class="form-group">
<label>Full Name</label>
<input type="text" :value="displayName" disabled class="disabled-input" />
<small>Derived from email ID</small>
</div>
 
          <div class="form-group">
<label>Email Address</label>
<input type="email" :value="user?.email" disabled class="disabled-input" />
<small>Linked to BITS Login</small>
</div>
 
          <div class="form-group">
<label>Role</label>
<input type="text" :value="user?.role" disabled class="disabled-input" />
</div>
 
          <div class="form-group">
<label>Google ID</label>
<input type="text" :value="user?.googleId" disabled class="disabled-input" />
</div>
</div>
 
        <div class="actions">
<button class="save-btn" @click="saveProfile" :disabled="uploading">
            {{ uploading ? 'Saving...' : 'Save Changes' }}
</button>
</div>
 
      </div>
</div>
</div>
</template>
 
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
 
.page-container {
  font-family: 'Inter', sans-serif;
  background: #f5f6fa;
  display: flex;
  min-height: 100vh;
  width: 100%;
}
 
/* Sidebar Styles (Consistent) */
.sidebar {
  width: 260px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}
.sidebar h2 { font-size: 1.6rem; margin-bottom: 2rem; text-align: center; font-weight: 700; }
.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.7rem; cursor: pointer; transition: background 0.3s; }
.menu-item:hover { background: rgba(255, 255, 255, 0.2); }
.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }
 
/* Main Area */
.main { flex: 1; padding: 1.5rem 2rem; }
.topbar h1 { font-size: 1.8rem; color: #333; font-weight: 700; margin-bottom: 2rem; }
 
/* Profile Specific Styles */
.profile-card {
  background: white;
  padding: 2.5rem;
  border-radius: 1rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  max-width: 800px;
}
 
.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 2rem;
}
 
/* Avatar with Hover Effect */
.avatar-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border: 3px solid #f0f0f0;
}
 
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
 
.overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 0.8rem;
}
 
.avatar-container:hover .overlay {
  opacity: 1;
}
 
.header-info h2 { margin-bottom: 0.5rem; color: #333; }
.role-badge { 
  background: #eef2ff; color: #667eea; 
  padding: 0.3rem 0.8rem; border-radius: 20px; 
  font-size: 0.85rem; font-weight: 600; 
}
 
/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}
 
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}
 
.disabled-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #eee;
  border-radius: 0.5rem;
  background: #f9fafb;
  color: #666;
  font-family: inherit;
  cursor: not-allowed;
}
 
.form-group small {
  color: #999;
  font-size: 0.8rem;
  margin-top: 0.3rem;
  display: block;
}
 
.save-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: 0.3s;
}
 
.save-btn:hover:not(:disabled) {
  background: #5568d3;
}
 
.save-btn:disabled {
  background: #ccc;
}
 
@media(max-width: 768px) {
  .sidebar { display: none; }
  .form-grid { grid-template-columns: 1fr; }
  .profile-header { flex-direction: column; text-align: center; }
}
</style>