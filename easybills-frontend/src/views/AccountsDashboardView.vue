<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import TopNavBar from '../components/TopNavBar.vue';

const router = useRouter();
const claims = ref<any[]>([]);
const loading = ref(true);
const selectedYear = ref(new Date().getFullYear());
const filterStatus = ref('submitted'); // Default filter

// Navigation helper
const navigate = (path: string) => {
  router.push(path);
};

// Fetch All Claims
const fetchClaims = async () => {
  loading.value = true;
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    // Note: Ensure your backend supports fetching ALL claims (limit: 1000 for stats)
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
  
  // Filter claims by selected year
  const claimsThisYear = claims.value.filter(c => {
    const d = new Date(c.dateIncurred || c.createdAt);
    return d.getFullYear() === parseInt(currentYear.toString());
  });

  return {
    pendingApproval: claims.value.filter(c => c.status === 'submitted').length,
    referredBack: claims.value.filter(c => c.status === 'more_info').length,
    pendingPayment: claims.value.filter(c => c.status === 'approved').length,
    disbursedCount: claims.value.filter(c => c.status === 'paid').length,
    disbursedAmount: claimsThisYear
              .filter(c => c.status === 'paid')
              .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  };
});

// Click Card to Filter
const applyFilter = (status: string) => {
  filterStatus.value = status;
};

// Filtered List for Table
const filteredClaims = computed(() => {
  if (filterStatus.value === 'all') return claims.value;
  // Map "paid" status to "disbursed" if needed for UI consistency, or just filter normally
  return claims.value.filter(c => c.status.toLowerCase() === filterStatus.value.toLowerCase());
});

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
    // Refresh local data
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
          
          <div class="stat-card blue" @click="applyFilter('submitted')">
            <div class="stat-icon">📥</div>
            <div class="stat-info">
              <h3>{{ stats.pendingApproval }}</h3>
              <p>Pending Approval</p>
            </div>
          </div>

          <div class="stat-card orange" @click="applyFilter('more_info')">
            <div class="stat-icon">↩️</div>
            <div class="stat-info">
              <h3>{{ stats.referredBack }}</h3>
              <p>Referred Back</p>
            </div>
          </div>

          <div class="stat-card yellow" @click="applyFilter('approved')">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
              <h3>{{ stats.pendingPayment }}</h3>
              <p>Pending Payment</p>
            </div>
          </div>

          <div class="stat-card green" @click="applyFilter('paid')">
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
              <p>Total Disbursed ({{ selectedYear }})</p>
            </div>
          </div>

        </div>

        <div class="table-section">
          <div class="table-header">
            <h2>{{ filterStatus === 'all' ? 'All Claims' : filterStatus.replace('_', ' ').toUpperCase() }}</h2>
            <div class="controls">
              <button class="btn-secondary" @click="applyFilter('all')">View All</button>
            </div>
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
                    <td><span class="faculty-id">User ID: {{ claim.facultyId || claim.userId }}</span></td>
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
                        <button class="btn-approve" @click="updateStatus(claim.id, 'approved')" title="Approve & Send for Payment">✓</button>
                        <button class="btn-reject" @click="updateStatus(claim.id, 'rejected')" title="Reject">✕</button>
                        <button class="btn-info" @click="updateStatus(claim.id, 'more_info')" title="Refer Back">↩</button>
                      </div>
                      
                      <div class="action-buttons" v-else-if="claim.status === 'approved'">
                        <button class="btn-pay" @click="updateStatus(claim.id, 'paid')" title="Mark as Disbursed">💰 Pay</button>
                      </div>

                      <span v-else class="text-muted">--</span>
                    </td>
                  </tr>
                  <tr v-if="filteredClaims.length === 0">
                    <td colspan="7" class="empty-state">No claims found for this filter.</td>
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
.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: background