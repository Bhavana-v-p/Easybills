<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import TopNavBar from '../components/TopNavBar.vue';

const router = useRouter();
const claims = ref<any[]>([]);
const loading = ref(true);
const selectedYear = ref(new Date().getFullYear());

// --- FILTER & SORT STATE ---
const filters = ref({
  status: 'all',
  category: 'all',
  startDate: '',
  endDate: '',
  sortBy: 'recent' // 'recent' or 'oldest'
});

// Navigation helper
const navigate = (path: string) => router.push(path);

// Fetch All Claims
const fetchClaims = async () => {
  loading.value = true;
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await axios.get(`${apiUrl}/api/faculty/claims`, {
      withCredentials: true,
      params: { limit: 1000 } 
    });
    if (response.data.success) {
      claims.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching claims:', error);
  } finally {
    loading.value = false;
  }
};

// --- STATISTICS LOGIC ---
const stats = computed(() => {
  const currentYear = selectedYear.value;
  const claimsThisYear = claims.value.filter(c => {
    const d = new Date(c.dateIncurred || c.createdAt);
    return d.getFullYear() === parseInt(currentYear.toString());
  });

  return {
    pendingApproval: claims.value.filter(c => c.status === 'submitted').length,
    referredBack: claims.value.filter(c => c.status === 'more_info').length,
    pendingPayment: claims.value.filter(c => c.status === 'approved').length,
    rejected: claims.value.filter(c => c.status === 'rejected').length, 
    disbursedCount: claims.value.filter(c => c.status === 'paid').length,
    disbursedAmount: claimsThisYear
              .filter(c => c.status === 'paid')
              .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  };
});

// --- FILTERING & SORTING LOGIC ---
const filteredClaims = computed(() => {
  let result = [...claims.value];

  // 1. Filter by Status
  if (filters.value.status !== 'all') {
    result = result.filter(c => c.status.toLowerCase() === filters.value.status.toLowerCase());
  }

  // 2. Filter by Category
  if (filters.value.category !== 'all') {
    result = result.filter(c => c.category === filters.value.category);
  }

  // 3. Filter by Date Range
  if (filters.value.startDate) {
    const start = new Date(filters.value.startDate);
    result = result.filter(c => new Date(c.dateIncurred || c.date) >= start);
  }
  if (filters.value.endDate) {
    const end = new Date(filters.value.endDate);
    // Set end date to end of day to include the full day
    end.setHours(23, 59, 59, 999); 
    result = result.filter(c => new Date(c.dateIncurred || c.date) <= end);
  }

  // 4. Sort (Recent vs Oldest)
  result.sort((a, b) => {
    const dateA = new Date(a.dateIncurred || a.date).getTime();
    const dateB = new Date(b.dateIncurred || b.date).getTime();
    return filters.value.sortBy === 'recent' ? dateB - dateA : dateA - dateB;
  });

  return result;
});

// Helper: Get unique categories for dropdown
const uniqueCategories = computed(() => {
  const cats = claims.value.map(c => c.category).filter(Boolean);
  return [...new Set(cats)];
});

// Quick Filter from Stats Cards
const applyQuickFilter = (status: string) => {
  filters.value.status = status;
  // Reset other filters for clarity when clicking a card
  filters.value.category = 'all';
  filters.value.startDate = '';
  filters.value.endDate = '';
};

const clearFilters = () => {
  filters.value = {
    status: 'all',
    category: 'all',
    startDate: '',
    endDate: '',
    sortBy: 'recent'
  };
};

// Update Status Logic
const updateStatus = async (claimId: number, newStatus: string) => {
  let reason = "Updated by Accounts";
  
  if (newStatus === 'rejected') {
    reason = prompt("Enter reason for rejection:") || "";
    if (!reason) return; 
  } else if (newStatus === 'more_info') {
    reason = prompt("Enter query for faculty:") || "";
    if (!reason) return;
  }

  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    await axios.put(`${apiUrl}/api/finance/claims/${claimId}/status`, 
      { status: newStatus, notes: reason },
      { withCredentials: true }
    );
    const claim = claims.value.find(c => c.id === claimId);
    if (claim) claim.status = newStatus;
    alert(`Claim #${claimId} status updated to ${newStatus}`);
  } catch (error) {
    alert('Failed to update status.');
  }
};

const formatDate = (dateString: string) => {
  if(!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

onMounted(() => {
  fetchClaims();
});
</script>

<template>
  <div class="page-container">
    
    <div class="sidebar admin-sidebar">
      <h2>EasyBills <span class="badge">Admin</span></h2>
      <div class="menu-item active" @click="navigate('/accounts')">Dashboard</div>
      <div class="menu-item" @click="navigate('/profile')">Profile</div>
      <div class="menu-item" @click="navigate('/settings')">Settings</div>
      
      <div class="menu-footer">
        <div class="menu-item back-link" @click="navigate('/dashboard')">
           User View ↗
        </div>
      </div>
    </div>

    <div class="main-content">
      <TopNavBar pageTitle="Accounts Dashboard" />
      
      <div class="content-wrapper">
        
        <div class="stats-grid">
          <div class="stat-card blue" @click="applyQuickFilter('submitted')">
            <div class="stat-icon">📥</div>
            <div class="stat-info">
              <h3>{{ stats.pendingApproval }}</h3>
              <p>Pending Approval</p>
            </div>
          </div>

          <div class="stat-card orange" @click="applyQuickFilter('more_info')">
            <div class="stat-icon">↩️</div>
            <div class="stat-info">
              <h3>{{ stats.referredBack }}</h3>
              <p>Referred Back</p>
            </div>
          </div>

          <div class="stat-card yellow" @click="applyQuickFilter('approved')">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
              <h3>{{ stats.pendingPayment }}</h3>
              <p>Pending Payment</p>
            </div>
          </div>

          <div class="stat-card red" @click="applyQuickFilter('rejected')">
            <div class="stat-icon">❌</div>
            <div class="stat-info">
              <h3>{{ stats.rejected }}</h3>
              <p>Rejected</p>
            </div>
          </div>

          <div class="stat-card green" @click="applyQuickFilter('paid')">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <h3>{{ stats.disbursedCount }}</h3>
              <p>Disbursed</p>
            </div>
          </div>

          <div class="stat-card purple year-card">
            <div class="stat-header">
              <div class="stat-icon">💰</div>
              <select v-model="selectedYear" class="year-select" @click.stop>
                <option :value="2025">2025</option>
                <option :value="2024">2024</option>
                <option :value="2023">2023</option>
              </select>
            </div>
            <div class="stat-info">
              <h3>₹{{ stats.disbursedAmount.toLocaleString() }}</h3>
              <p>Total ({{ selectedYear }})</p>
            </div>
          </div>
        </div>

        <div class="table-section">
          
          <div class="filter-bar">
            <div class="filter-group">
              <label>Status:</label>
              <select v-model="filters.status">
                <option value="all">All Statuses</option>
                <option value="submitted">Pending Approval</option>
                <option value="more_info">Referred Back</option>
                <option value="approved">Pending Payment</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Disbursed</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Category:</label>
              <select v-model="filters.category">
                <option value="all">All Categories</option>
                <option v-for="cat in uniqueCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="filter-group">
              <label>From:</label>
              <input type="date" v-model="filters.startDate" class="date-input">
            </div>

            <div class="filter-group">
              <label>To:</label>
              <input type="date" v-model="filters.endDate" class="date-input">
            </div>

            <div class="filter-group push-right">
              <label>Sort By:</label>
              <select v-model="filters.sortBy">
                <option value="recent">Recent First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <button class="btn-clear" @click="clearFilters" title="Clear All Filters">✕</button>
          </div>

          <div class="table-card">
            <div v-if="loading" class="loading">Loading data...</div>
            
            <div v-else class="table-responsive">
              <table class="claims-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Faculty</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="claim in filteredClaims" :key="claim.id">
                    <td>#{{ claim.id }}</td>
                    <td><span class="faculty-id">User {{ claim.facultyId || claim.userId }}</span></td>
                    <td>{{ formatDate(claim.dateIncurred || claim.date) }}</td>
                    <td>{{ claim.category }}</td>
                    <td class="amount">₹{{ claim.amount }}</td>
                    <td>
                      <span :class="['status-badge', claim.status.toLowerCase()]">
                        {{ claim.status === 'more_info' ? 'Referred Back' : claim.status }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons" v-if="claim.status === 'submitted'">
                        <button class="btn-approve" @click="updateStatus(claim.id, 'approved')" title="Approve">✓</button>
                        <button class="btn-reject" @click="updateStatus(claim.id, 'rejected')" title="Reject">✕</button>
                        <button class="btn-info" @click="updateStatus(claim.id, 'more_info')" title="Refer Back">↩</button>
                      </div>
                      <div class="action-buttons" v-else-if="claim.status === 'approved'">
                        <button class="btn-pay" @click="updateStatus(claim.id, 'paid')" title="Pay">💰 Pay</button>
                      </div>
                      <span v-else class="text-muted">--</span>
                    </td>
                  </tr>
                  <tr v-if="filteredClaims.length === 0">
                    <td colspan="7" class="empty-state">No claims found matching filters.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* LAYOUT RESET */
.page-container {
  display: flex; height: 100vh; width: 100%;
  font-family: 'Inter', sans-serif; background: #f5f6fa; overflow: hidden;
}

/* SIDEBAR */
.admin-sidebar {
  width: 260px; min-width: 260px;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white; padding: 2rem 1.5rem; display: flex; flex-direction: column;
}
.sidebar h2 { font-size: 1.5rem; margin-bottom: 2rem; text-align: center; font-weight: 700; }
.badge { font-size: 0.7rem; background: #fbbf24; color: #1e3a8a; padding: 2px 6px; border-radius: 4px; vertical-align: middle; margin-left: 5px; }
.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s; font-size: 0.95rem; }
.menu-item:hover { background: rgba(255, 255, 255, 0.1); }
.menu-item.active { background: rgba(255, 255, 255, 0.2); font-weight: 600; border-left: 4px solid #fbbf24; }
.menu-footer { margin-top: auto; }
.back-link { color: #93c5fd; font-size: 0.85rem; }

/* CONTENT */
.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.content-wrapper { padding: 2rem; width: 100%; max-width: 1400px; margin: 0 auto; }

/* STATS GRID */
.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;
}
.stat-card {
  background: white; padding: 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; border-left: 5px solid transparent;
}
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 12px rgba(0,0,0,0.1); }
.stat-icon { font-size: 2rem; background: #f3f4f6; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.stat-info h3 { font-size: 1.6rem; font-weight: 700; margin: 0; color: #1f2937; }
.stat-info p { font-size: 0.85rem; color: #6b7280; margin: 0; }

.stat-card.blue { border-left-color: #3b82f6; }
.stat-card.orange { border-left-color: #f97316; }
.stat-card.yellow { border-left-color: #eab308; }
.stat-card.red { border-left-color: #ef4444; }
.stat-card.green { border-left-color: #22c55e; }
.stat-card.purple { border-left-color: #a855f7; display: block; }
.year-select { padding: 4px; border-radius: 4px; border: 1px solid #ddd; font-size: 0.8rem; cursor: pointer; }

/* FILTER BAR STYLES */
.filter-bar {
  display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;
  background: white; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.03);
}
.filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
.filter-group label { font-size: 0.8rem; color: #6b7280; font-weight: 600; }
.filter-group select, .filter-group input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.9rem; outline: none; min-width: 140px; }
.date-input { max-width: 150px; }
.push-right { margin-left: auto; }
.btn-clear { background: #f3f4f6; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; color: #6b7280; align-self: flex-end; height: 38px; }
.btn-clear:hover { background: #e5e7eb; color: #374151; }

/* TABLE */
.table-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
.table-responsive { width: 100%; overflow-x: auto; }
.claims-table { width: 100%; border-collapse: collapse; min-width: 800px; }
th, td { padding: 1rem 1.2rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
th { background: #f8fafc; color: #64748b; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
.amount { font-weight: 700; color: #0f172a; }

/* Badges */
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.submitted { background: #eff6ff; color: #3b82f6; border: 1px solid #dbeafe; }
.more_info { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
.approved { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
.paid { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
.rejected { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }

/* Buttons */
.action-buttons { display: flex; gap: 6px; }
.btn-approve, .btn-reject, .btn-info, .btn-pay { width: 30px; height: 30px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.btn-pay { width: auto; padding: 0 10px; background: #22c55e; color: white; font-size: 0.8rem; }
.btn-approve { background: #dcfce7; color: #16a34a; }
.btn-reject { background: #fee2e2; color: #dc2626; }
.btn-info { background: #ffedd5; color: #ea580c; }
.btn-approve:hover { background: #16a34a; color: white; }

@media(max-width: 768px) {
  .admin-sidebar { display: none; }
  .stats-grid { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; align-items: stretch; gap: 0.8rem; }
  .push-right { margin-left: 0; }
  .btn-clear { align-self: stretch; text-align: center; }
}
</style>