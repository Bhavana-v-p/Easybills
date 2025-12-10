<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const claims = ref<any[]>([]);
const loading = ref(true);
const filterStatus = ref('submitted'); // Default to showing new submissions

// Navigation helper
const navigate = (path: string) => {
  router.push(path);
};

// Fetch All Claims (Admin Endpoint)
const fetchClaims = async () => {
  loading.value = true;
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    // Note: Ensure your backend supports fetching all claims for admin
    const response = await axios.get(`${apiUrl}/api/faculty/claims`, {
      withCredentials: true,
      params: { limit: 100 } // Get more records
    });
    if (response.data.success) {
      claims.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching claims:', error);
    alert('Access Denied. You may not have Finance permissions.');
  } finally {
    loading.value = false;
  }
};

// Update Claim Status
const updateStatus = async (claimId: number, newStatus: string) => {
  if (!confirm(`Are you sure you want to mark this claim as ${newStatus}?`)) return;

  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    await axios.put(`${apiUrl}/api/finance/claims/${claimId}/status`, 
      { status: newStatus, notes: `Status updated to ${newStatus} by Admin` },
      { withCredentials: true }
    );
    // Refresh list locally
    const claim = claims.value.find(c => c.id === claimId);
    if (claim) claim.status = newStatus;
    alert(`Claim #${claimId} marked as ${newStatus}`);
  } catch (error) {
    console.error('Update failed:', error);
    alert('Failed to update status.');
  }
};

// Filter Logic
const filteredClaims = computed(() => {
  if (filterStatus.value === 'all') return claims.value;
  return claims.value.filter(c => c.status.toLowerCase() === filterStatus.value.toLowerCase());
});

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
      <div class="menu-item active">Process Claims</div>
      <div class="menu-item">Reports</div>
      <div class="menu-item">User Management</div>
      <div class="menu-item back-link" @click="navigate('/dashboard')">
        ← Faculty View
      </div>
    </div>

    <div class="main-content">
      
      <div class="content-wrapper">
        <div class="topbar">
          <h1>Accounts Dashboard</h1>
          
          <div class="filter-controls">
            <label>Filter:</label>
            <select v-model="filterStatus">
              <option value="submitted">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Claims</option>
            </select>
          </div>
        </div>

        <div class="table-card">
          <div v-if="loading" class="loading">Loading claims queue...</div>
          
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
                  <td>
                    <div class="faculty-info">
                      <span class="faculty-id">ID: {{ claim.facultyId }}</span>
                    </div>
                  </td>
                  <td>{{ formatDate(claim.dateIncurred || claim.date) }}</td>
                  <td>{{ claim.category }}</td>
                  <td class="amount">₹{{ claim.amount }}</td>
                  <td>
                    <span :class="['status-badge', claim.status.toLowerCase()]">
                      {{ claim.status }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons" v-if="claim.status === 'submitted' || claim.status === 'verified'">
                      <button class="btn-approve" @click="updateStatus(claim.id, 'approved')">✓</button>
                      <button class="btn-reject" @click="updateStatus(claim.id, 'rejected')">✕</button>
                    </div>
                    <span v-else class="text-muted">Done</span>
                  </td>
                </tr>
                <tr v-if="filteredClaims.length === 0">
                  <td colspan="7" class="empty-state">No claims found in this category.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* GLOBAL LAYOUT RESET */
*, *::before, *::after {
  box-sizing: border-box;
}

.page-container {
  display: flex;
  height: 100vh;
  width: 100%;
  font-family: 'Inter', sans-serif;
  background: #f5f6fa;
  overflow: hidden; /* Prevent body scroll */
}

/* ADMIN SIDEBAR */
.admin-sidebar {
  width: 260px;
  min-width: 260px;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); /* Admin Blue Theme */
  color: white;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}

.sidebar h2 { font-size: 1.5rem; margin-bottom: 2rem; text-align: center; font-weight: 700; }
.badge { font-size: 0.7rem; background: #fbbf24; color: #1e3a8a; padding: 2px 6px; border-radius: 4px; vertical-align: middle; margin-left: 5px; }

.menu-item {
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.95rem;
}
.menu-item:hover { background: rgba(255, 255, 255, 0.1); }
.menu-item.active { background: rgba(255, 255, 255, 0.2); font-weight: 600; border-left: 4px solid #fbbf24; }

.back-link { margin-top: auto; color: #93c5fd; font-size: 0.9rem; }
.back-link:hover { color: white; }

/* MAIN CONTENT AREA */
.main-content {
  flex: 1; /* Take remaining width */
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Scroll ONLY content */
  overflow-x: hidden;
}

.content-wrapper {
  padding: 2rem;
  width: 100%;
  max-width: 1400px; /* Allow wider tables */
  margin: 0 auto;
}

/* TOP BAR */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.topbar h1 { font-size: 1.8rem; color: #1e293b; font-weight: 700; }

.filter-controls {
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-controls select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-size: 0.9rem;
  outline: none;
}

/* TABLE CARD */
.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  padding: 0;
  overflow: hidden; /* Clip corners */
}

/* Responsive Table Scroll */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.claims-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px; /* Prevent squishing on small screens */
}

th, td {
  padding: 1rem 1.2rem;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  white-space: nowrap;
}

th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.amount { font-weight: 700; color: #0f172a; }

.faculty-info { display: flex; flex-direction: column; font-size: 0.9rem; }
.faculty-id { color: #64748b; font-size: 0.8rem; }

/* Status Badges */
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.submitted { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
.approved { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
.rejected { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }

/* Action Buttons */
.action-buttons { display: flex; gap: 8px; }

.btn-approve, .btn-reject {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: transform 0.1s;
}

.btn-approve { background: #dcfce7; color: #16a34a; }
.btn-approve:hover { background: #16a34a; color: white; }

.btn-reject { background: #fee2e2; color: #dc2626; }
.btn-reject:hover { background: #dc2626; color: white; }

.text-muted { color: #94a3b8; font-size: 0.85rem; font-style: italic; }
.empty-state { text-align: center; padding: 3rem; color: #94a3b8; }

/* Mobile */
@media(max-width: 768px) {
  .admin-sidebar { display: none; }
  .content-wrapper { padding: 1rem; }
}
</style>