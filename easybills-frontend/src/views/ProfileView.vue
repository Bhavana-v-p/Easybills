<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Import the new components
import TopNavBar from '../components/TopNavBar.vue';
import LogoutModal from '../components/LogoutModal.vue';
 
const router = useRouter();
const user = ref<any>(null);
const loading = ref(true);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
 
// State for Logout Modal
const showLogoutModal = ref(false);
 
onMounted(async () => {
  await fetchUserProfile();
});
 
const fetchUserProfile = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });
    if (response.data.success) {
      user.value = response.data.data;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  } finally {
    loading.value = false;
  }
};
 
// Trigger hidden file input click
const triggerFileInput = () => {
    fileInput.value?.click();
};
 
// Handle file selection and immediate upload
const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
 
    const file = target.files[0];
    // Basic validation
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert("Please select a JPG or PNG image.");
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
         alert("Image size should be less than 5MB.");
         return;
    }
 
    uploading.value = true;
 
    try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const formData = new FormData();
        formData.append('picture', file);
 
        const response = await axios.post(`${apiUrl}/api/user/picture`, formData, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
 
        if (response.data.success) {
            // Update local user state right away to show new pic
            user.value.picture = response.data.data.pictureUrl;
        }
 
    } catch (error) {
        console.error("Failed to upload picture:", error);
        alert("Failed to upload profile picture.");
    } finally {
        uploading.value = false;
        // Reset input so selecting same file works again
        if (fileInput.value) fileInput.value.value = '';
    }
};
 
// Final Logout Action (called by modal confirmation)
const handleLogoutConfirm = async () => {
   const apiUrl = import.meta.env.VITE_API_BASE_URL;
   // Call backend logout endpoint
   try {
       await axios.get(`${apiUrl}/auth/logout`, { withCredentials: true });
   } catch (e) { console.error(e); }
   // Force redirect
   window.location.href = 'http://localhost:3000/landing.html';
};
 
const navigate = (path: string) => router.push(path);
// Helpers
const getInitials = (email: string) => email ? email.substring(0, 2).toUpperCase() : 'U';
const getNameFromEmail = (email: string) => {
    if (!email) return 'User';
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}
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
      
      <div class="content-padded centered-layout">
        <div v-if="loading" class="loading">Loading profile...</div>
        
        <div v-else-if="user" class="profile-card centered">
          
          <div class="profile-pic-wrapper" @click="triggerFileInput">
            <div class="avatar-large">
                <img v-if="user.picture" :src="user.picture" alt="Profile" class="profile-img" />
                <span v-else>{{ getInitials(user.email) }}</span>
            </div>
            <div class="pic-overlay">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                <span>Change</span>
            </div>
            <input type="file" ref="fileInput" class="hidden-input" accept="image/png, image/jpeg" @change="handleFileChange">
          </div>
          <p v-if="uploading" class="uploading-text">Uploading new picture...</p>
 
          <h2 class="user-name">{{ getNameFromEmail(user.email) }}</h2>
          <span class="user-role">{{ user.role }}</span>
 
          <div class="details-grid centered-details">
            <div class="detail-item">
              <label>Email Address</label>
              <p>{{ user.email }}</p>
            </div>
            <div class="detail-item">
               <label>Department</label>
               <p>{{ user.department || 'Computer Science' }}</p>
            </div>
            <div class="detail-item">
              <label>Google ID</label>
              <p class="mono">{{ user.googleId }}</p>
            </div>
             <div class="detail-item">
              <label>Account Status</label>
              <span class="status-badge active">Active</span>
            </div>
          </div>
 
          <button class="btn-profile-logout" @click="showLogoutModal = true">
              Log Out
          </button>
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
/* Import Font and Shared Styles */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
 
.page-container {
  display: flex; height: 100vh; width: 100%; font-family: 'Inter', sans-serif; background: #f5f6fa;
}
.sidebar { width: 260px; min-width: 260px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem 1.5rem; display: flex; flex-direction: column; }
.sidebar h2 { margin-bottom: 2rem; text-align: center; font-weight: 700; font-size: 1.6rem; }
.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s; font-size: 1rem; }
.menu-item:hover { background: rgba(255, 255, 255, 0.2); }
.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }
.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.content-padded { padding: 2rem; flex: 1; overflow-y: auto; }
 
/* ----- NEW CENTERED LAYOUT STYLES ----- */
 
.centered-layout {
    display: flex;
    justify-content: center;
    align-items: flex-start; /* Starts at top, but centered horizontally */
    padding-top: 3rem;
}
 
.profile-card.centered {
  background: white;
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  max-width: 500px; /* Fixed width for the centered card */
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center; /* Center items horizontally inside card */
  text-align: center;
}
 
/* Profile Picture & Upload Styles */
.profile-pic-wrapper {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 1.5rem;
    cursor: pointer;
    border-radius: 50%;
    overflow: hidden; /* Ensures overlay matches circle */
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
 
.avatar-large {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 3rem; font-weight: 700; color: #555;
}
 
.profile-img {
    width: 100%; height: 100%; object-fit: cover;
}
 
/* Hover Overlay */
.pic-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5);
    color: white;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s;
    gap: 5px;
}
 
.profile-pic-wrapper:hover .pic-overlay {
    opacity: 1;
}
 
.hidden-input { display: none; }
.uploading-text { color: #667eea; font-size: 0.9rem; margin-top: -1rem; margin-bottom: 1rem; }
 
/* Text Styles */
.user-name { margin: 0 0 0.5rem 0; color: #111827; font-size: 1.5rem; }
.user-role { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 2rem; }
 
/* Details Grid Centered */
.details-grid.centered-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    text-align: left; /* Keep labels left aligned for readability */
    padding: 0 1rem;
    margin-bottom: 2rem;
}
 
.detail-item label { display: block; font-size: 0.85rem; color: #6b7280; margin-bottom: 0.3rem; font-weight: 500; }
.detail-item p { margin: 0; color: #1f2937; font-size: 1rem; font-weight: 500; word-break: break-all; }
.mono { font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
.status-badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }
 
/* Big Red Logout Button */
.btn-profile-logout {
    width: 80%;
    padding: 1rem;
    background-color: #fff;
    border: 2px solid #dc2626;
    color: #dc2626;
    font-size: 1rem;
    font-weight: 700;
    border-radius: 12px;
    cursor: pointer;
    transition: 0.2s;
}
 
.btn-profile-logout:hover {
    background-color: #dc2626;
    color: white;
}
 
@media(max-width: 768px) { .sidebar { display: none; } .content-padded { padding: 1rem; } .profile-card.centered { padding: 2rem 1.5rem; } }
</style>