<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Ensure these components exist in your src/components folder
import TopNavBar from '../components/TopNavBar.vue';
import LogoutModal from '../components/LogoutModal.vue';

const router = useRouter();
const user = ref<any>(null);
const claims = ref<any[]>([]); // Store raw claims data
const loading = ref(true);
const showLogoutModal = ref(false);

// Search & Sort State
const searchQuery = ref('');
const sortOrder = ref('newest'); // 'newest' or 'oldest'

// Pagination State
const currentPage = ref(1);
const itemsPerPage = 10;

// Fetch Data
onMounted(async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    
    // 1. Get User Profile
    const userRes = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });
    if (userRes.data.success) user.value = userRes.data.data;

    // 2. Get All Claims
    // Note: Adjusted endpoint to match MyClaims view pattern if needed. 
    // If your backend uses /api/faculty/claims for dashboard, keep as is.
    const claimsRes = await axios.get(`${apiUrl}/api/faculty/claims`, { withCredentials: true });
    if (claimsRes.data.success) {
      claims.value = claimsRes.data.data;
    }
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
});

// Computed Property: Filtered & Sorted Claims
const processedClaims = computed(() => {
  let result = [...claims.value];

  // 1. Search Filter (by Claim ID)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(c => 
      String(c.id).toLowerCase().includes(query) || 
      // Optional: Search by category too
      c.category.toLowerCase().includes(query)
    );
  }

  // 2. Sorting
  result.sort((a, b) => {
    const dateA = new Date(a.dateIncurred).getTime();
    const dateB = new Date(b.dateIncurred).getTime();
    
    return sortOrder.value === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return result;
});

// Computed Property: Pagination (slicing the processed list)
const paginatedClaims = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return processedClaims.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(processedClaims.value.length / itemsPerPage));

// Helper Functions
const navigate = (path: string) => router.push(path);

// Logout function (Handles the popup confirmation)
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

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-GB', options).replace(/ /g, " ").replace("20", "'");
};

const getStatusColorClass = (status: string) => {
  switch(status.toLowerCase()) {
    case 'approved': return 'status-approved';
    case 'paid': return 'status-approved';
    case 'submitted': return 'status-pending';
    case 'pending': return 'status-pending';
    case 'rejected': return 'status-rejected';
    default: return 'status-draft';
  }
};
</script>

<template>
  <div class="dashboard-container">
    
    <div class="sidebar">
      <h2>EasyBills</h2>
      <div class="menu-item active" @click="navigate('/dashboard')">Dashboard</div>
      <div class="menu-item" @click="navigate('/my-claims')">My Claims</div>
      <div class="menu-item" @click="navigate('/upload-bill')">Upload Bill</div>
      <div class="menu-item" @click="navigate('/profile')">Profile</div>
      <div class="menu-item" @click="navigate('/settings')">Settings</div>
    </div>

    <div class="main">
      <TopNavBar pageTitle="Dashboard" @logout-request="showLogoutModal = true" />
      
      <div class="content-area">
        
        <div class="topbar">
          <div class="welcome-box">
            <h1>Dashboard Overview</h1>
            <p v-if="user" class="user-sub">
                Welcome back, {{ user.name || user.email }}
            </p>
          </div>
          
          <div class="status-legend">
            <span class="legend-item"><span class="dot green"></span> Disbursed</span>
            <span class="legend-item"><span class="dot purple"></span> Referred Back</span>
            <span class="legend-item"><span class="dot red"></span> Rejected</span>
            <span class="legend-item"><span class="dot orange"></span> Pending</span>
          </div>
        </div>

        <div class="controls-bar">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search Claim Number..." 
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>

          <div class="sort-box">
            <label>Sort By:</label>
            <select v-model="sortOrder" class="sort-select">
              <option value="newest">Recent to Oldest</option>
              <option value="oldest">Oldest to Recent</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-state">Loading your claims...</div>

        <div v-else class="claims-list-container">
          
          <div v-if="processedClaims.length === 0" class="no-data">
            No claims found matching your search.
          </div>

          <div v-for="claim in paginatedClaims" :key="claim.id" class="claim-card">
            <div :class="['corner-indicator', getStatusColorClass(claim.status)]"></div>

            <div class="claim-details">
              <div class="detail-col id-col">
                <span class="label">Claim Number :</span>
                <span class="value-highlight">#{{ claim.id }}</span>
              </div>

              <div class="detail-col info-col">
                <div class="row">
                  <span class="label">Category :</span>
                  <span class="value">{{ claim.category }}</span>
                </div>
                <div class="row">
                  <span class="label">Date :</span>
                  <span class="value">{{ formatDate(claim.dateIncurred || claim.date) }}</span>
                </div>
              </div>

              <div class="detail-col amount-col">
                <div class="row">
                  <span class="label">Amount :</span>
                  <span class="value">₹ {{ claim.amount }}</span>
                </div>
                <div class="row">
                  <span class="label">Approved :</span>
                  <span class="value">₹ 0.00</span>
                </div>
              </div>

              <div class="detail-col status-col">
                <div class="row">
                  <span class="label">Status :</span>
                  <span :class="['status-text', getStatusColorClass(claim.status)]">{{ claim.status }}</span>
                </div>
                <div class="row">
                  <span class="label">Pending With :</span>
                  <span class="value">{{ claim.status === 'submitted' ? 'Finance Team' : 'NA' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pagination-footer" v-if="totalPages > 1">
            <div class="page-info">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
            <div class="page-actions">
              <button @click="currentPage--" :disabled="currentPage === 1">Previous</button>
              <button @click="currentPage++" :disabled="currentPage === totalPages">Next</button>
            </div>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

/* GLOBAL RESET */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Full Page Container */
.dashboard-container {
  font-family: 'Inter', sans-serif;
  background: #f0f2f5;
  display: flex;
  height: 100vh;
  width: 100%; /* Changed from 100vw to avoid horizontal scroll */
  overflow: hidden; 
}

/* Fixed Sidebar */
.sidebar {
  width: 260px;
  min-width: 260px; /* Prevent shrinking */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  z-index: 10;
}
.sidebar h2 { font-size: 1.6rem; margin-bottom: 2rem; text-align: center; font-weight: 700; }
.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.7rem; cursor: pointer; transition: background 0.3s; }
.menu-item:hover { background: rgba(255, 255, 255, 0.2); }
.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }

/* Main Area */
.main {
  flex: 1; /* Takes all remaining width */
  display: flex;
  flex-direction: column;
  min-width: 0; /* Prevents flex items from overflowing horizontally */
}

/* Scrollable Content Area */
.content-area {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Header Sections */
.topbar { display: flex; justify-content: space-between; margin-bottom: 1.5rem; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
.welcome-box h1 { font-size: 1.8rem; color: #333; margin-bottom: 5px; }
.user-sub { color: #666; font-size: 0.9rem; }

/* Controls Bar */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  flex-wrap: wrap; /* Allow wrapping on small screens */
  gap: 1rem;
}

.search-box { position: relative; width: 300px; max-width: 100%; }
.search-input {
  width: 100%;
  padding: 0.6rem 1rem;
  padding-right: 2.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}
.search-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #888; }

.sort-box { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #555; }
.sort-select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem; color: #333; cursor: pointer; }

/* Legend */
.status-legend { display: flex; gap: 15px; font-size: 0.85rem; color: #555; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 5px; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.green { background: #2ecc71; } .purple { background: #9b59b6; } .red { background: #e74c3c; } .orange { background: #f39c12; }

/* Claims List */
.claims-list-container { display: flex; flex-direction: column; gap: 15px; width: 100%; }

.claim-card {
  background: white; border-radius: 8px; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex; position: relative; overflow: hidden;
  width: 100%;
  transition: transform 0.2s ease;
}

.claim-card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }

.corner-indicator {
  position: absolute; top: 0; right: 0; width: 0; height: 0;
  border-style: solid; border-width: 0 20px 20px 0;
  border-color: transparent #ccc transparent transparent;
}
.corner-indicator.status-approved { border-right-color: #2ecc71; }
.corner-indicator.status-pending { border-right-color: #f39c12; }
.corner-indicator.status-rejected { border-right-color: #e74c3c; }

.claim-details {
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Responsive Grid */
  width: 100%; 
  padding: 1.5rem; 
  align-items: center;
  gap: 1.5rem;
}

.detail-col { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; color: #333; }
.row { display: flex; gap: 8px; align-items: center; }
.label { color: #888; font-size: 0.85rem; } 
.value { color: #333; font-weight: 500; }
.value-highlight { color: #667eea; font-weight: 700; cursor: pointer; }

.status-text { font-weight: 600; text-transform: capitalize; }
.status-text.status-approved { color: #2ecc71; }
.status-text.status-pending { color: #f39c12; }
.status-text.status-rejected { color: #e74c3c; }

/* Pagination */
.pagination-footer { margin-top: 20px; display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid #ddd; }
.page-actions button { padding: 6px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; margin-left: 10px; transition: all 0.2s; }
.page-actions button:hover:not(:disabled) { background: #f9fafb; border-color: #ccc; }
.page-actions button:disabled { background: #f3f4f6; color: #aaa; cursor: not-allowed; }

/* Mobile Responsiveness */
@media(max-width: 768px) {
  .sidebar { display: none; }
  .claim-details { grid-template-columns: 1fr; gap: 1rem; }
  .content-area { padding: 1rem; }
  .controls-bar { flex-direction: column; align-items: stretch; }
  .search-box { width: 100%; }
}
</style>