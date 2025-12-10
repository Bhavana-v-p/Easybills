<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import TopNavBar from '../components/TopNavBar.vue';
import LogoutModal from '../components/LogoutModal.vue';

const router = useRouter();

// State
const claims = ref<any[]>([]);
const loading = ref(true);
const showLogoutModal = ref(false);

// Navigation helper
const navigate = (path: string) => {
  router.push(path);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Logout Logic
const handleLogoutConfirm = async () => {
   const apiUrl = import.meta.env.VITE_API_BASE_URL;
   try {
       await axios.get(`${apiUrl}/auth/logout`, { withCredentials: true });
   } catch (e) { console.error(e); }
   window.location.href = '/'; // Redirect to home/login
};

// Fetch claims on load
onMounted(async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    // Assuming backend route is /api/claims/my-claims based on previous context, 
    // but keeping your provided path if that's what your backend expects:
    // If your backend expects /api/faculty/claims, keep it. 
    // If it expects /api/claims/my-claims, switch it here.
    const response = await axios.get(`${apiUrl}/api/claims/my-claims`, {
      withCredentials: true 
    });

    if (response.data.success) {
      claims.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching claims:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page-container">
    
    <div class="sidebar">
      <h2>EasyBills</h2>
      <div class="menu-item" @click="navigate('/dashboard')">Dashboard</div>
      <div class="menu-item active" @click="navigate('/my-claims')">My Claims</div>
      <div class="menu-item" @click="navigate('/upload-bill')">Upload Bill</div>
      <div class="menu-item" @click="navigate('/profile')">Profile</div>
      <div class="menu-item" @click="navigate('/settings')">Settings</div>
    </div>

    <div class="main-content">
      <TopNavBar pageTitle="My Claims" @logout-request="showLogoutModal = true" />
      
      <div class="content-wrapper">
        <div class="topbar">
          <h1>My Claims History</h1>
        </div>

        <div class="table-container">
          <div v-if="loading" class="loading">Loading your claims...</div>
          
          <table v-else>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="claim in claims" :key="claim.id">
                <td>#{{ claim.id }}</td>
                <td>{{ formatDate(claim.dateIncurred || claim.date) }}</td>
                <td>{{ claim.category }}</td>
                <td>{{ claim.description }}</td>
                <td class="amount">₹{{ claim.amount }}</td>
                <td>
                  <span :class="['status', claim.status.toLowerCase().replace(' ', '-')]">
                    {{ claim.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="claims.length === 0">
                <td colspan="6" style="text-align: center;">No claims found.</td>
              </tr>
            </tbody>
          </table>
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

.page-container {
  display: flex; /* Sidebar and Main sit side-by-side */
  height: 100vh;
  width: 100vw;
  font-family: 'Inter', sans-serif;
  background: #f5f6fa;
  overflow: hidden; /* Prevents double scrollbars */
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

.sidebar h2 {
  font-size: 1.6rem;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 700;
}

.menu-item {
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  margin-bottom: 0.7rem;
  cursor: pointer;
  transition: background 0.3s;
}

.menu-item:hover { background: rgba(255, 255, 255, 0.2); }
.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }

/* MAIN CONTENT - The Fix */
.main-content {
  flex: 1; /* Forces it to take ALL remaining width */
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Scroll ONLY the content, not the sidebar */
}

.content-wrapper {
  padding: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.topbar { margin-bottom: 2rem; }
.topbar h1 { font-size: 1.8rem; color: #333; font-weight: 700; }

/* TABLE STYLES */
.table-container {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  overflow-x: auto;
}

table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.9rem; text-align: left; border-bottom: 1px solid #eee; }
th { background: #f0f1f5; font-weight: 600; }

.amount { font-weight: bold; color: #667eea; }

/* Status Badges */
.status { padding: 0.4rem 0.8rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 600; text-transform: capitalize; }
.submitted { background: #e2e6ea; color: #495057; }
.approved { background: #d4edda; color: #155724; }
.pending { background: #fff3cd; color: #d39e00; }
.rejected { background: #f8d7da; color: #721c24; }
.paid { background: #d1e7dd; color: #0f5132; }

@media(max-width: 768px) {
  .sidebar { display: none; }
}
</style>