<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
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
    
    const userRes = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });
    if (userRes.data.success) user.value = userRes.data.data;
 
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
 
// Logout function
const logout = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    
    // 1. Call backend to destroy session
    await axios.get(`${apiUrl}/auth/logout`, { withCredentials: true });
    
    // 2. Redirect to the landing page explicitly
    // (We use window.location because landing.html is a static file outside the Vue router)
    window.location.href = 'http://localhost:3000/landing.html';
    
  } catch (error) {
    console.error('Logout failed', error);
    // Force redirect even if the API call fails
    window.location.href = 'http://localhost:3000/landing.html';
  }
};
 
const formatDate = (dateString: string) => {
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
 
    <div class="main-content">
      <TopNavBar pageTitle="Dashboard" @logout-request="showLogoutModal = true" />
      
      <div class="topbar">
        <div class="welcome-box">
          <h1>Dashboard</h1>
          <p v-if="user" class="user-sub">Welcome back, {{ user.email }}</p>
        </div>
        
        <div class="status-legend">
          <span class="legend-item"><span class="dot green"></span> Disbursed</span>
          <span class="legend-item"><span class="dot purple"></span> Referred Back</span>
          <span class="legend-item"><span class="dot red"></span> Rejected</span>
          <span class="legend-item"><span class="dot orange"></span> Pending</span>
        </div>
        
        <button class="logout-btn" @click="logout">Logout</button>
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
              <a href="#" class="claim-link">{{ claim.id }}</a>
            </div>
 
            <div class="detail-col info-col">
              <div class="row">
                <span class="label">Expense Category :</span>
                <span class="value">{{ claim.category }}</span>
              </div>
              <div class="row">
                <span class="label">Submitted On :</span>
                <span class="value">{{ formatDate(claim.dateIncurred) }}</span>
              </div>
            </div>
 
            <div class="detail-col amount-col">
              <div class="row">
                <span class="label">Claimed Amount :</span>
                <span class="value">INR {{ claim.amount }}</span>
              </div>
              <div class="row">
                <span class="label">Approved Amount :</span>
                <span class="value">0.00</span>
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
 
    <LogoutModal
        v-if="showLogoutModal"
        @close="showLogoutModal = false"
        @confirm="handleLogoutConfirm"
    />
  </div>
</template>
 
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
 
/* Full Page Container - Forces Side-by-Side */
.dashboard-container {
  display: flex;          /* Enables Flexbox */
  height: 100vh;          /* Full Viewport Height */
  width: 100vw;           /* Full Viewport Width */
  overflow: hidden;       /* Prevent outer scrollbars */
  font-family: 'Inter', sans-serif;
  background: #f9fafb;    /* Light grey background */
}
 
/* Sidebar - Fixed Width */
.sidebar {
  width: 260px;           /* Fixed width like Gemini sidebar */
  flex-shrink: 0;         /* Prevent shrinking */
  background: white;      /* White background */
  border-right: 1px solid #e5e7eb; /* Subtle separator line */
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}
 
.sidebar h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4f46e5;
  margin-bottom: 2rem;
  padding-left: 0.5rem;
}
 
.menu-item {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  color: #4b5563;
  font-weight: 500;
  transition: all 0.2s;
}
 
.menu-item:hover {
  background-color: #f3f4f6;
  color: #111827;
}
 
.menu-item.active {
  background-color: #e0e7ff; /* Light indigo active state */
  color: #4338ca;
}
 
/* Main Content - Fills Remaining Space */
.main {
  flex-grow: 1;           /* Take up all remaining width */
  display: flex;
  flex-direction: column;
  overflow: hidden;       /* Contain scrolling inside main */
}
 
/* Scrollable Content Area */
.content-area {
  flex-grow: 1;
  overflow-y: auto;       /* Scroll ONLY the content, not the sidebar */
  padding: 2rem;
}
 
/* Mobile Responsive */
@media (max-width: 768px) {
  .sidebar { display: none; } /* Hide sidebar on mobile */
  .dashboard-container { flex-direction: column; }
}
</style>