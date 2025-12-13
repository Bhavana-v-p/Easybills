<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import TopNavBar from '../components/TopNavBar.vue';

const router = useRouter();
const claims = ref<any[]>([]);
const loading = ref(true);
const selectedYear = ref(new Date().getFullYear());

// --- FILTER STATE ---
// We sync 'filterStatus' (Cards) with 'filters.status' (Dropdown)
const filterStatus = ref('submitted'); 

const filters = ref({
  status: 'submitted', // Default matches filterStatus
  category: 'all',
  startDate: '',
  endDate: '',
  sortBy: 'recent' 
});

// Sync Filter Bar Dropdown with Stats Cards
watch(filterStatus, (newVal) => {
  filters.value.status = newVal;
});
watch(() => filters.value.status, (newVal) => {
  filterStatus.value = newVal;
});

// MODAL STATE
const showDetailsModal = ref(false);
const selectedClaim = ref<any>(null);

const formatClaimId = (id: number, dateStr: string) => {
  if (!id) return '---';
  const date = new Date(dateStr || new Date());
  const yearSuffix = date.getFullYear().toString().slice(-2);
  return `EB${id.toString().padStart(5, '0')}/${yearSuffix}`;
};

const navigate = (path: string) => router.push(path);

// 🔄 FETCH CLAIMS
const fetchClaims = async () => {
  loading.value = true;
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    // Using the correct finance endpoint
    const response = await axios.get(`${apiUrl}/api/finance/claims`, {
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
};

// STATS LOGIC
const stats = computed(() => {
  const currentYear = selectedYear.value;
  const yearClaims = claims.value.filter(c => new Date(c.dateIncurred).getFullYear() === currentYear);
  
  return {
    submitted: claims.value.filter(c => c.status === 'submitted').length,
    referredBack: claims.value.filter(c => c.status === 'referred_back').length,
    pendingPayment: claims.value.filter(c => c.status === 'pending_payment').length,
    rejected: claims.value.filter(c => c.status === 'rejected').length,
    disbursedCount: claims.value.filter(c => c.status === 'disbursed').length,
    disbursedAmount: yearClaims
      .filter(c => c.status === 'disbursed')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  };
});

// --- FILTERING & SORTING LOGIC (FIXED) ---
const filteredClaims = computed(() => {
  let result = [...claims.value];

  // 1. Filter by Status (Linked to Cards & Dropdown)
  if (filters.value.status !== 'all') {
    result = result.filter(c => c.status === filters.value.status);
  }

  // 2. Filter by Category
  if (filters.value.category !== 'all') {
    result = result.filter(c => c.category === filters.value.category);
  }

  // 3. Filter by Date Range
  if (filters.value.startDate) {
    const start = new Date(filters.value.startDate);
    result = result.filter(c => new Date(c.dateIncurred) >= start);
  }
  if (filters.value.endDate) {
    const end = new Date(filters.value.endDate);
    end.setHours(23, 59, 59, 999); 
    result = result.filter(c => new Date(c.dateIncurred) <= end);
  }

  // 4. Sort (Recent vs Oldest)
  result.sort((a, b) => {
    const dateA = new Date(a.dateIncurred || a.createdAt).getTime();
    const dateB = new Date(b.dateIncurred || b.createdAt).getTime();
    return filters.value.sortBy === 'recent' ? dateB - dateA : dateA - dateB;
  });

  return result;
});

// CATEGORIES LIST
const categoryOptions = [
  "Travel", "Stationery", "Academic Events", "Registration Fee", "Others"
];

// Quick Filter from Stats Cards
const applyQuickFilter = (status: string) => {
  filterStatus.value = status; // This triggers the watcher to update filters.status
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
  filterStatus.value = 'all';
};

// OPEN MODAL
const openClaimDetails = (claim: any) => {
  selectedClaim.value = claim;
  showDetailsModal.value = true;
};

// UPDATE STATUS ACTION
const processClaim = async (action: string) => {
  if (!selectedClaim.value) return;
  const claimId = selectedClaim.value.id;
  let notes = "";
  let apiStatus = action;

  if (action === 'rejected') {
    notes = prompt("Please provide reason for Rejection:") || "";
    if (!notes) return;
  }
  else if (action === 'more_info') { 
    notes = prompt("Please provide reason for Referring Back:") || "";
    if (!notes) return;
  }
  else if (action === 'approved') {
    if (!confirm("Approve this claim?")) return;
    notes = "Approved by Accounts.";
  }
  else if (action === 'paid') { 
    if (!confirm("Mark as Disbursed?")) return;
    notes = "Payment processed.";
  }

  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    await axios.put(`${apiUrl}/api/finance/claims/${claimId}/status`, 
      { status: apiStatus, notes: notes },
      { withCredentials: true }
    );
    
    // Update Local Data
    const localClaim = claims.value.find(c => c.id === claimId);
    if (localClaim) {
        if (action === 'approved') localClaim.status = 'pending_payment';
        else if (action === 'more_info') localClaim.status = 'referred_back';
        else if (action === 'paid') localClaim.status = 'disbursed';
        else localClaim.status = action;
    }
    
    alert(`Claim updated.`);
    showDetailsModal.value = false;
  } catch (error) {
    alert('Failed to update status.');
  }
};

const formatDate = (dateString: string) => {
  if(!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

onMounted(() => fetchClaims());
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
              <h3>{{ stats.submitted }}</h3>
              <p>Pending Approval</p>
            </div>
          </div>

          <div class="stat-card orange" @click="applyQuickFilter('referred_back')">
            <div class="stat-icon">↩️</div>
            <div class="stat-info">
              <h3>{{ stats.referredBack }}</h3>
              <p>Referred Back</p>
            </div>
          </div>

          <div class="stat-card yellow" @click="applyQuickFilter('pending_payment')">
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

          <div class="stat-card green" @click="applyQuickFilter('disbursed')">
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
                <option value="referred_back">Referred Back</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="rejected">Rejected</option>
                <option value="disbursed">Disbursed</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Category:</label>
              <select v-model="filters.category">
                <option value="all">All Categories</option>
                <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
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
                    <th>Claim ID</th>
                    <th>Faculty Name</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="claim in filteredClaims" :key="claim.id">
                    <td>
                      <span class="claim-link" @click="openClaimDetails(claim)">
                        {{ formatClaimId(claim.id, claim.createdAt) }}
                      </span>
                    </td>
                    <td>
                      <div class="faculty-info">
                        <span class="f-name">{{ claim.User?.name || 'Unknown' }}</span>
                        <span class="f-email">{{ claim.User?.email }}</span>
                      </div>
                    </td>
                    <td>{{ formatDate(claim.dateIncurred) }}</td>
                    <td>{{ claim.category }}</td>
                    <td class="amount">₹{{ claim.amount }}</td>
                    <td>
                      <span :class="['status-badge', claim.status]">{{ claim.status.replace('_', ' ') }}</span>
                    </td>
                    <td>
                      <button class="btn-view" @click="openClaimDetails(claim)">👁️ View</button>
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

    <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Claim: {{ formatClaimId(selectedClaim.id, selectedClaim.createdAt) }}</h2>
          <button class="close-btn" @click="showDetailsModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <div class="info-grid">
            <div><strong>Faculty:</strong> {{ selectedClaim.User?.name }}</div>
            <div><strong>Category:</strong> {{ selectedClaim.category }}</div>
            <div><strong>Amount:</strong> ₹{{ selectedClaim.amount }}</div>
            <div><strong>Date:</strong> {{ formatDate(selectedClaim.dateIncurred) }}</div>
          </div>
          
          <div class="description-box">
            <strong>Description:</strong>
            <p>{{ selectedClaim.description }}</p>
          </div>

          <div class="docs-section">
            <strong>Attached Documents:</strong>
            <div v-if="selectedClaim.documents && selectedClaim.documents.length">
                <div v-for="(doc, idx) in selectedClaim.documents" :key="idx" class="doc-item">
                    <a :href="doc.fileUrl" target="_blank">📄 {{ doc.fileName }}</a>
                </div>
            </div>
            <div v-else class="no-docs">No documents attached.</div>
          </div>
        </div>

        <div class="modal-footer">
            <div v-if="selectedClaim.status === 'submitted'" class="actions">
                <button class="btn-approve" @click="processClaim('approved')">Approve</button>
                <button class="btn-refer" @click="processClaim('more_info')">Refer Back</button>
                <button class="btn-reject" @click="processClaim('rejected')">Reject</button>
            </div>
            <div v-if="selectedClaim.status === 'pending_payment'" class="actions">
                <button class="btn-pay" @click="processClaim('paid')">Mark Disbursed</button>
            </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* LAYOUT RESET */
.page-container { display: flex; height: 100vh; width: 100%; font-family: 'Inter', sans-serif; background: #f5f6fa; overflow: hidden; }

/* SIDEBAR */
.admin-sidebar { width: 260px; min-width: 260px; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: white; padding: 2rem 1.5rem; display: flex; flex-direction: column; }
.sidebar h2 { font-size: 1.5rem; margin-bottom: 2rem; text-align: center; font-weight: 700; }
.badge { font-size: 0.7rem; background: #fbbf24; color: #1e3a8a; padding: 2px 6px; border-radius: 4px; vertical-align: middle; margin-left: 5px; }
.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s; font-size: 0.95rem; }
.menu-item:hover { background: rgba(255, 255, 255, 0.1); }
.menu-item.active { background: rgba(255, 255, 255, 0.2); font-weight: 600; border-left: 4px solid #fbbf24; }
.menu-footer { margin-top: auto; }
.back-link { color: #93c5fd; font-size: 0.85rem; }

/* MAIN CONTENT */
.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.content-wrapper { padding: 2rem; width: 100%; max-width: 1400px; margin: 0 auto; }

/* STATS GRID */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
.stat-card { background: white; padding: 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; border-left: 5px solid transparent; }
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

/* FILTER BAR */
.filter-bar { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; background: white; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
.filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
.filter-group label { font-size: 0.8rem; color: #6b7280; font-weight: 600; }
.filter-group select, .filter-group input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.9rem; outline: none; min-width: 140px; }
.date-input { max-width: 150px; }
.push-right { margin-left: auto; }
.btn-clear { background: #f3f4f6; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; color: #6b7280; align-self: flex-end; height: 38px; }
.btn-clear:hover { background: #e5e7eb; color: #374151; }

/* TABLE */
.table-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; padding: 1rem; }
.claims-table { width: 100%; border-collapse: collapse; min-width: 800px; }
th, td { padding: 1rem 1.2rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
th { background: #f8fafc; color: #64748b; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
.claim-link { color: #2563eb; font-weight: 600; cursor: pointer; text-decoration: underline; }
.btn-view { padding: 4px 10px; background: #e2e8f0; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
.faculty-info { display: flex; flex-direction: column; }
.f-name { font-weight: 600; color: #1e293b; }
.f-email { font-size: 0.75rem; color: #64748b; }
.amount { font-weight: 700; color: #0f172a; }

/* BADGES */
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: inline-block; }
.submitted { background: #eff6ff; color: #3b82f6; }
.pending_payment { background: #fef9c3; color: #854d0e; }
.disbursed { background: #f0fdf4; color: #15803d; }
.rejected { background: #fef2f2; color: #b91c1c; }
.referred_back { background: #fff7ed; color: #c2410c; }

/* MODAL */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-card { background: white; width: 600px; max-width: 90%; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.modal-header { padding: 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { margin: 0; font-size: 1.2rem; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 1.5rem; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.description-box { background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
.docs-section { margin-bottom: 1rem; }
.doc-item { margin-top: 5px; }
.doc-item a { color: #2563eb; text-decoration: none; }
.modal-footer { padding: 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; }
.btn-approve { background: #22c55e; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-refer { background: #f97316; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-reject { background: #ef4444; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-pay { background: #1e3a8a; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }

@media(max-width: 768px) {
  .admin-sidebar { display: none; }
  .stats-grid { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; align-items: stretch; gap: 0.8rem; }
  .push-right { margin-left: 0; }
  .btn-clear { align-self: stretch; text-align: center; }
}
</style>