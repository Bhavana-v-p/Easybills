<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import TopNavBar from '../components/TopNavBar.vue';
import LogoutModal from '../components/LogoutModal.vue';

const router = useRouter();
const user = ref<any>(null);
const loading = ref(true);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const showLogoutModal = ref(false);
const debugError = ref('');

// --- NEW VARIABLES FOR NAME EDITING ---
const isEditingName = ref(false);
const editedName = ref('');

// 1. Fetch User Data
const fetchUserProfile = async () => {
  loading.value = true;
  debugError.value = '';
  
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });

    if (response.data && response.data.success) {
      user.value = response.data.data; 
    } else {
      debugError.value = 'API returned success: false';
    }
  } catch (error: any) {
    console.error('Failed to load profile:', error);
    debugError.value = error.message || 'Network Error';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUserProfile();
});

// 2. Profile Picture Upload
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    await uploadProfilePicture(file);
  }
};

const uploadProfilePicture = async (file: File) => {
  if (!file) return;
  uploading.value = true;

  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const formData = new FormData();
    formData.append('picture', file);

    const res = await axios.post(`${apiUrl}/api/user/picture`, formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (res.data.success) {
      await fetchUserProfile();
      alert("Profile picture updated successfully!"); 
    }
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to upload profile picture.');
  } finally {
    uploading.value = false;
  }
};

// 3. Helper: Initials (Robust Version)
const userInitials = computed(() => {
  if (!user.value) return 'U';
  
  // If name exists, split it
  if (user.value.name) {
    const names = user.value.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
  
  // Fallback to Email if no name
  if (user.value.email) {
    return user.value.email.substring(0, 2).toUpperCase();
  }
  
  return 'U';
});

// --- 4. NAME EDITING FUNCTIONS ---
const startEditingName = () => {
  editedName.value = user.value.name || '';
  isEditingName.value = true;
};

const cancelEditingName = () => {
  isEditingName.value = false;
  editedName.value = '';
};

const saveName = async () => {
  if (!editedName.value.trim()) {
    alert("Name cannot be empty.");
    return;
  }

  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    // Sending PUT request to update name
    await axios.put(`${apiUrl}/api/user/me`, 
      { name: editedName.value }, 
      { withCredentials: true }
    );
    
    // Update local state immediately without reload
    user.value.name = editedName.value;
    isEditingName.value = false;
    alert("Name updated successfully!");
  } catch (error) {
    console.error('Failed to update name:', error);
    alert('Failed to update name. Please try again.');
  }
};

// 5. Navigation & Logout
const navigate = (path: string) => router.push(path);

const handleLogoutConfirm = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    await axios.get(`${apiUrl}/auth/logout`, { withCredentials: true });
    window.location.href = '/'; 
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
      <div class="menu-item" @click="navigate('/settings')">Settings</div>
    </div>

    <div class="main-content">
      <TopNavBar pageTitle="My Profile" @logout-request="showLogoutModal = true" />
      
      <div class="content-wrapper">
        
        <div v-if="loading" class="loading-state">Loading profile...</div>

        <div v-else-if="debugError" class="error-box">
           <h3>⚠️ Error Loading Profile</h3>
           <p>{{ debugError }}</p>
           <button @click="fetchUserProfile">Retry</button>
        </div>

        <div v-else-if="user" class="profile-card">
          
          <div class="avatar-section">
            <div class="avatar-wrapper" @click="triggerFileInput">
              <div class="avatar-circle">
                <img v-if="user.picture" :src="user.picture" alt="Profile" class="profile-img" />
                <span v-else class="initials">{{ userInitials }}</span>
              </div>
              <div class="edit-overlay">
                <span v-if="uploading">⏳</span>
                <span v-else>📷 Edit</span>
              </div>
            </div>
            
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden-input" 
              accept="image/*" 
              @change="handleFileChange"
            />

            <div class="name-container">
              <div v-if="!isEditingName" class="name-display">
                <h2 class="user-name">{{ user.name || 'Set Your Name' }}</h2>
                <button class="edit-icon-btn" @click="startEditingName" title="Edit Name">✏️</button>
              </div>

              <div v-else class="name-edit-form">
                <input type="text" v-model="editedName" class="name-input" placeholder="Enter Full Name" />
                <div class="edit-buttons">
                  <button @click="saveName" class="btn-save">Save</button>
                  <button @click="cancelEditingName" class="btn-cancel">Cancel</button>
                </div>
              </div>
            </div>

            <span class="role-badge">{{ user.role || 'User' }}</span>
          </div>

          <hr class="divider" />

          <div class="details-section">
            <div class="detail-group">
              <label>Email Address</label>
              <div class="info-box">{{ user.email || 'No Email' }}</div>
            </div>

             <div class="detail-group">
              <label>Account Status</label>
              <div class="info-box status-active">Active</div>
            </div>
          </div>

          <button class="logout-btn-large" @click="showLogoutModal = true">
            Logout
          </button>
        </div>

        <div v-else class="empty-state">
           No user data found. Please log in again.
        </div>

      </div>
    </div>

    <LogoutModal 
      v-if="showLogoutModal" 
      @close="showLogoutModal = false" 
      @confirm="handleLogoutConfirm" 
    />

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
  flex-direction: column; /* Stack debug box */
}

/* DEBUG BOX */
.error-box {
  background: #fee2e2;
  color: #b91c1c;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 500px;
  align-self: center;
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
  align-self: center;
}

.avatar-section { margin-bottom: 2rem; }
.avatar-wrapper { position: relative; width: 120px; height: 120px; margin: 0 auto 1rem; cursor: pointer; }
.avatar-circle {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; border: 4px solid #f3f4f6;
  color: white; font-weight: 700;
}
.profile-img { width: 100%; height: 100%; object-fit: cover; }
.initials { color: white; font-size: 2.5rem; font-weight: 700; }

.edit-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 600; opacity: 0; transition: opacity 0.2s; font-size: 0.9rem;
}
.avatar-wrapper:hover .edit-overlay { opacity: 1; }

.hidden-input { display: none; }

/* NAME EDITING STYLES */
.name-container { margin-bottom: 0.5rem; min-height: 40px; display: flex; justify-content: center; }
.name-display { display: flex; align-items: center; gap: 8px; }
.user-name { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0; }
.edit-icon-btn { background: none; border: none; cursor: pointer; font-size: 1rem; opacity: 0.5; transition: 0.2s; }
.edit-icon-btn:hover { opacity: 1; transform: scale(1.1); }

.name-edit-form { display: flex; flex-direction: column; gap: 8px; align-items: center; width: 100%; }
.name-input { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; width: 80%; text-align: center;}
.edit-buttons { display: flex; gap: 8px; }
.btn-save { background: #667eea; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
.btn-cancel { background: #f3f4f6; color: #374151; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }

.role-badge {
  display: inline-block; background: #eef2ff; color: #4f46e5;
  padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-top: 0.5rem; text-transform: uppercase;
}
.divider { border: 0; border-top: 1px solid #f3f4f6; margin: 2rem 0; }

.details-section { text-align: left; margin-bottom: 2rem; }
.detail-group { margin-bottom: 1.5rem; }
.detail-group label { display: block; font-size: 0.85rem; color: #6b7280; margin-bottom: 0.4rem; font-weight: 500; }
.info-box { background: #f9fafb; padding: 0.8rem 1rem; border-radius: 8px; color: #374151; font-weight: 500; border: 1px solid #e5e7eb; }
.status-active { color: #16a34a; background: #f0fdf4; border-color: #dcfce7; }

.logout-btn-large {
  width: 100%; padding: 1rem; background: white; border: 1px solid #fee2e2; color: #dc2626; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.logout-btn-large:hover { background: #fee2e2; }

@media(max-width: 768px) {
  .sidebar { display: none; }
  .content-wrapper { padding: 1rem; }
}
</style>