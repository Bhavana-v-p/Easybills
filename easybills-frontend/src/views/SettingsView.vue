<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import TopNavBar from '../components/TopNavBar.vue';

const router = useRouter();
const loading = ref(true);
const user = ref<any>(null);

// SETTINGS STATE
const settings = ref({
  emailNotifications: true,
  dailySummary: false,
  darkMode: false,
  currency: 'INR'
});

// 1. Fetch User Data (Required for Sidebar Role Logic)
const fetchUserProfile = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });
    if (response.data.success) {
      user.value = response.data.data;
      
      // Load saved settings from LocalStorage (Simulation)
      const saved = localStorage.getItem('easybills_settings');
      if (saved) {
        settings.value = JSON.parse(saved);
      }
    }
  } catch (error) {
    console.error('Error loading user:', error);
  } finally {
    loading.value = false;
  }
};

// 2. Computed Role Helper
const isAccounts = computed(() => user.value?.role === 'Accounts');

// 3. Save Action
const saveSettings = () => {
  // Save to LocalStorage for now (Backend integration can be added later)
  localStorage.setItem('easybills_settings', JSON.stringify(settings.value));
  
  // Simulate API call
  setTimeout(() => {
    alert('Settings saved successfully!');
  }, 500);
};

// Navigation Helper
const navigate = (path: string) => router.push(path);

onMounted(() => fetchUserProfile());
</script>

<template>
  <div class="page-container">
    
    <div v-if="isAccounts" class="sidebar admin-sidebar">
      <h2>EasyBills <span class="badge">Admin</span></h2>
      <div class="menu-item" @click="navigate('/accounts')">Dashboard</div>
      <div class="menu-item" @click="navigate('/profile')">Profile</div>
      <div class="menu-item active">Settings</div>
      
      <div class="menu-footer">
        <div class="menu-item back-link" @click="navigate('/dashboard')">
           User View ↗
        </div>
      </div>
    </div>

    <div v-else class="sidebar faculty-sidebar">
      <h2>EasyBills</h2>
      <div class="menu-item" @click="navigate('/dashboard')">Dashboard</div>
      <div class="menu-item" @click="navigate('/my-claims')">My Claims</div>
      <div class="menu-item" @click="navigate('/upload-bill')">Upload Bill</div>
      <div class="menu-item" @click="navigate('/profile')">Profile</div>
      <div class="menu-item active">Settings</div>
    </div>

    <div class="main-content">
      <TopNavBar pageTitle="Application Settings" />
      
      <div class="content-wrapper">
        <div v-if="loading" class="loading">Loading...</div>
        
        <div v-else class="settings-card">
          <h3>Preferences</h3>
          
          <div class="setting-group">
            <div class="setting-text">
              <h4>Email Notifications</h4>
              <p>Receive updates when your claim status changes.</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="settings.emailNotifications">
              <span class="slider round"></span>
            </label>
          </div>

          <div class="divider"></div>

          <div class="setting-group">
            <div class="setting-text">
              <h4>Dark Mode (Beta)</h4>
              <p>Switch to a darker theme for low-light environments.</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="settings.darkMode">
              <span class="slider round"></span>
            </label>
          </div>

          <div class="divider"></div>

          <div class="setting-group">
            <div class="setting-text">
              <h4>Default Currency</h4>
              <p>Select your preferred currency for display.</p>
            </div>
            <select v-model="settings.currency" class="select-box">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <div class="actions">
            <button class="btn-save" @click="saveSettings">Save Changes</button>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* GLOBAL LAYOUT */
.page-container { display: flex; height: 100vh; width: 100%; font-family: 'Inter', sans-serif; background: #f5f6fa; overflow: hidden; }

/* SIDEBAR STYLES */
.sidebar { width: 260px; min-width: 260px; color: white; padding: 2rem 1.5rem; display: flex; flex-direction: column; }
.sidebar h2 { margin-bottom: 2rem; text-align: center; font-weight: 700; font-size: 1.6rem; }
.badge { font-size: 0.7rem; background: #fbbf24; color: #1e3a8a; padding: 2px 6px; border-radius: 4px; vertical-align: middle; margin-left: 5px; }
.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s; }
.menu-item:hover { background: rgba(255, 255, 255, 0.2); }
.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }
.menu-footer { margin-top: auto; }
.back-link { color: #93c5fd; font-size: 0.85rem; }

/* THEMES */
.faculty-sidebar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.admin-sidebar { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); }

/* MAIN CONTENT */
.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.content-wrapper { padding: 2rem; width: 100%; max-width: 800px; margin: 0 auto; }

/* SETTINGS CARD */
.settings-card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.settings-card h3 { margin-top: 0; margin-bottom: 1.5rem; color: #1e293b; }

.setting-group { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; }
.setting-text h4 { margin: 0 0 0.3rem 0; color: #334155; font-size: 1rem; }
.setting-text p { margin: 0; color: #64748b; font-size: 0.85rem; }

.divider { height: 1px; background: #f1f5f9; margin: 0.5rem 0; }

.select-box { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; width: 100px; }

.actions { margin-top: 2rem; text-align: right; }
.btn-save { background: #2563eb; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-save:hover { background: #1d4ed8; }

/* TOGGLE SWITCH CSS */
.switch { position: relative; display: inline-block; width: 50px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; }
.slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
input:checked + .slider { background-color: #2563eb; }
input:checked + .slider:before { transform: translateX(24px); }
.slider.round { border-radius: 34px; }
.slider.round:before { border-radius: 50%; }

@media(max-width: 768px) {
  .sidebar { display: none; }
}
</style>