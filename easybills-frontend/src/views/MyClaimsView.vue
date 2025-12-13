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

// ✅ Helper to format Claim ID (e.g., EB00004/25)
const formatClaimId = (id: number, dateStr: string) => {
  if (!id) return '---';
  const date = dateStr ? new Date(dateStr) : new Date();
  const year = date.getFullYear().toString().slice(-2); // Get last 2 digits (e.g., '25')
  return `EB${id.toString().padStart(5, '0')}/${year}`;
};

// Navigation helper
const navigate = (path: string) => {
  router.push(path);
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// Logout Logic
const handleLogoutConfirm = async () => {
   const apiUrl = import.meta.env.VITE_API_BASE_URL;
   try {
       await axios.get(`${apiUrl}/auth/logout`, { withCredentials: true });
   } catch (e) { console.error(e); }
   window.location.href = '/'; 
};

// Fetch claims on load
onMounted(async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await axios.get(`${apiUrl}/api/faculty/claims`, { // Ensure route matches backend
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

        <div class="table-card">
          <div v-if="loading" class="loading">Loading your claims...</div>
          
          <div v-else class="table-responsive">
            <table class="claims-table">
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
                  
                  <td class="id-cell">
                    {{ formatClaimId(claim.id, claim.createdAt) }}
                  </td>

                  <td>{{ formatDate(claim.dateIncurred || claim.date) }}</td>
                  <td>{{ claim.category }}</td>
                  <td class="desc-cell">{{ claim.description }}</td>
                  <td class="amount">₹{{ claim.amount }}</td>
                  <td>
                    <span :class="['status', claim.status ? claim.status.toLowerCase().replace(' ', '_') : 'pending']">
                      {{ claim.status ? claim.status.replace('_', ' ') : 'Pending' }}
                    </span>
                  </td>
                </tr>
                <tr v-if="claims.length === 0">
                  <td colspan="6" style="text-align: center; padding: 2rem;">No claims found.</td>
                </tr>
              </tbody>
            </table>
          </div>
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

/* GLOBAL RESET */
*, *::before, *::after { box-sizing: border-box; }

.page-container {
  display: flex; height: 100vh; width: 100%;
  font-family: 'Inter', sans-serif; background: #f5f6fa; overflow: hidden; 
}

/* SIDEBAR */
.sidebar {
  width: 260px; min-width: 260px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; padding: 2rem 1.5rem;
  display: flex; flex-direction: column;
}
.sidebar h2 { font-size: 1.6rem; margin-bottom: 2rem; text-align: center; font-weight: 700; }
.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.7rem; cursor: pointer; transition: background 0.3s; }
.menu-item:hover { background: rgba(255, 255, 255, 0.2); }
.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }

/* MAIN CONTENT */
.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; }
.content-wrapper { padding: 2rem; width: 100%; }
.topbar { margin-bottom: 1.5rem; }
.topbar h1 { font-size: 1.8rem; color: #111827; font-weight: 700; }

/* TABLE CARD */
.table-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 1.5rem; width: 100%; }
.table-responsive { width: 100%; overflow-x: auto; }
.claims-table { width: 100%; border-collapse: collapse; min-width: 600px; }

th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; white-space: nowrap; }
.desc-cell { white-space: normal; max-width: 300px; }
th { background: #f9fafb; font-weight: 600; color: #6b7280; font-size: 0.9rem; }
.amount { font-weight: bold; color: #111827; }
.id-cell { font-weight: 600; color: #4f46e5; } /* Added specific style for ID */

/* STATUS BADGES */
.status { padding: 0.4rem 0.8rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 600; text-transform: capitalize; display: inline-block; }
.submitted { background: #e2e6ea; color: #495057; }
.approved { background: #dcfce7; color: #166534; }
.pending_payment { background: #fef3c7; color: #92400e; } /* Matches backend status */
.rejected { background: #fee2e2; color: #991b1b; }
.disbursed { background: #d1e7dd; color: #0f5132; }
.referred_back { background: #e0f2fe; color: #075985; }
.draft { background: #f3f4f6; color: #4b5563; }

/* Hide Sidebar on Mobile */
@media(max-width: 768px) {
  .sidebar { display: none; }
  .content-wrapper { padding: 1rem; }
}
</style>