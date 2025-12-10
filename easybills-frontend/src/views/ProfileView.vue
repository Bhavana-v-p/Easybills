<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Ensure TopNavBar exists or remove if not used
import TopNavBar from '../components/TopNavBar.vue';

const router = useRouter();
const user = ref<any>(null);
const loading = ref(true);

// Fetch User Data
onMounted(async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });
    
    if (response.data.success) {
      user.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  } finally {
    loading.value = false;
  }
});

// Helper: Get Initials from Name
const userInitials = computed(() => {
  if (!user.value || !user.value.name) return 'U';
  const names = user.value.name.split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return names[0][0].toUpperCase();
});

// Helper: Navigation
const navigate = (path: string) => router.push(path);

// Logout Logic
const handleLogout = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    await axios.get(`${apiUrl}/auth/logout`, { withCredentials: true });
    window.location.href = '/'; // Redirect to landing page
  } catch (error) {
    console.error('Logout failed', error);
    window.location.href = '/';
  }
};
</script>

<template>
  <div class="page-container">
    
    <div class="sidebar">
      <h2>EasyBills</h2>
      <div class="menu-item" @click="navigate('/dashboard')">Dashboard</div>
      <div class="menu-item" @click="navigate('/my-claims')">My Claims</div>
      <div class="menu-item" @click="navigate('/upload-bill')">Upload Bill</div>
      <div class="menu-item active" @click="navigate('/profile')">Profile</div>
      </div>

    <div class="main-content">
      <TopNavBar pageTitle="My Profile" />
      
      <div class="content-wrapper">
        
        <div v-if="loading" class="loading-state">Loading profile...</div>

        <div v-else-if="user" class="profile-card">
          
          <div class="avatar-section">
            <div class="avatar-circle">
              <img v-if="user.picture" :src="user.picture" alt="Profile" class="profile-img" />
              <span v-else class="initials">{{ userInitials }}</span>
            </div>
            <h2 class="user-name">{{ user.name }}</h2>
            <span class="role-badge">{{ user.role }}</span>
          </div>

          <hr class="divider" />

          <div class="details-section">
            
            <div class="detail-group">
              <label>Email Address</label>
              <div class="info-box">{{ user.email }}</div>
            </div>

            <div class="detail-group">
              <label>Google ID</label>
              <div class="info-box code-font">{{ user.googleId }}</div>
            </div>

             <div class="detail-group">
              <label>Account Status</label>
              <div class="info-box status-active">Active</div>
            </div>

          </div>

          <button class="logout-btn-large" @click="handleLogout">
            Logout
          </button>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* GLOBAL LAYOUT */
.page-container {
  display: flex;
  height: 100vh;
  width: 100%;
  font-family: 'Inter', sans-serif;
  background: #f5f6fa;
  overflow: hidden;
}

/* SIDEBAR */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}

.sidebar h2 { margin-bottom: 2rem; text-align: center; font-weight: 700; font-size: 1.6rem; }
.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s; }
.menu-item:hover { background: rgba(255, 255, 255, 0.2); }
.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }

/* MAIN CONTENT */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.content-wrapper {
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 80%;
}

/* PROFILE CARD */
.profile-card {
  background: white;
  width: 100%;
  max-width: 500px;
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  text-align: center;
}

/* AVATAR */
.avatar-section { margin-bottom: 2rem; }
.avatar-circle {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 4px solid #f3f4f6;
}

.profile-img { width: 100%; height: 100%; object-fit: cover; }
.initials { color: white; font-size: 2.5rem; font-weight: 700; }

.user-name { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0; }
.role-badge {
  display: inline-block;
  background: #eef2ff;
  color: #4f46e5;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 0.5rem;
  text-transform: uppercase;
}

.divider { border: 0; border-top: 1px solid #f3f4f6; margin: 2rem 0; }

/* DETAILS */
.details-section { text-align: left; margin-bottom: 2rem; }
.detail-group { margin-bottom: 1.5rem; }
.detail-group label { display: block; font-size: 0.85rem; color: #6b7280; margin-bottom: 0.4rem; font-weight: 500; }

.info-box {
  background: #f9fafb;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  border: 1px solid #e5e7eb;
}

.code-font { font-family: monospace; letter-spacing: 0.5px; color: #666; }
.status-active { color: #16a34a; background: #f0fdf4; border-color: #dcfce7; }

/* LOGOUT BUTTON */
.logout-btn-large {
  width: 100%;
  padding: 1rem;
  background: white;
  border: 1px solid #fee2e2;
  color: #dc2626;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.logout-btn-large:hover { background: #fee2e2; }

@media(max-width: 768px) {
  .sidebar { display: none; }
  .content-wrapper { padding: 1rem; }
}
</style>