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
    // Note: You might need to create a specific endpoint for admin to get ALL claims
    // For now, we'll assume GET /api/faculty/claims returns everything if you are admin
    // Or you can use query params like ?role=admin if your backend supports it.
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
    // Using the finance endpoint from your API Reference
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
<div class="menu-item" @click="navigate('/dashboard')">Back to Faculty View</div>
</div>
 
    <div class="main">
<div class="topbar">
<h1>Accounts Dashboard</h1>
<div class="filter-controls">
<label>Filter by Status:</label>
<select v-model="filterStatus">
<option value="submitted">Pending Review (Submitted)</option>
<option value="approved">Approved</option>
<option value="rejected">Rejected</option>
<option value="all">All Claims</option>
</select>
</div>
</div>
 
      <div class="table-container">
<div v-if="loading" class="loading">Loading claims queue...</div>
<table v-else>
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
<td>Faculty User (ID: {{ claim.facultyId }})</td>
<td>{{ formatDate(claim.dateIncurred) }}</td>
<td>{{ claim.category }}</td>
<td class="amount">₹{{ claim.amount }}</td>
<td>
<span :class="['status', claim.status.toLowerCase()]">
                  {{ claim.status }}
</span>
</td>
<td>
<div class="action-buttons" v-if="claim.status === 'submitted' || claim.status === 'verified'">
<button class="btn-approve" @click="updateStatus(claim.id, 'approved')">✓ Approve</button>
<button class="btn-reject" @click="updateStatus(claim.id, 'rejected')">✕ Reject</button>
</div>
<span v-else class="text-muted">Processed</span>
</td>
</tr>
<tr v-if="filteredClaims.length === 0">
<td colspan="7" style="text-align: center; padding: 2rem;">No claims found in this category.</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
</template>
 
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
 
.page-container {
  font-family: 'Inter', sans-serif;
  background: #f5f6fa;
  display: flex;
  min-height: 100vh;
  width: 100%;
}
 
/* Admin Sidebar Theme */
.admin-sidebar {
  width: 260px;
  background: linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%); /* Darker theme for Admin */
  color: white;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}
 
.sidebar h2 { font-size: 1.6rem; margin-bottom: 2rem; text-align: center; font-weight: 700; }
.badge { font-size: 0.8rem; background: #e74c3c; padding: 2px 6px; border-radius: 4px; vertical-align: middle; }
 
.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.7rem; cursor: pointer; transition: background 0.3s; }
.menu-item:hover { background: rgba(255, 255, 255, 0.2); }
.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }
 
.main { flex: 1; padding: 1.5rem 2rem; }
 
.topbar { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 2rem; 
}
.topbar h1 { font-size: 1.8rem; color: #333; font-weight: 700; }
 
.filter-controls select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-size: 1rem;
  margin-left: 10px;
}
 
.table-container {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}
 
table { width: 100%; border-collapse: collapse; }
th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
th { background: #f8f9fa; font-weight: 600; color: #555; }
.amount { font-weight: bold; color: #2c3e50; }
 
/* Status Badges */
.status { padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; text-transform: capitalize; }
.submitted { background: #fff3cd; color: #d39e00; }
.approved { background: #d4edda; color: #155724; }
.rejected { background: #f8d7da; color: #721c24; }
 
/* Action Buttons */
.action-buttons { display: flex; gap: 8px; }
.btn-approve {
  background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;
}
.btn-reject {
  background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;
}
.btn-approve:hover { background: #219150; }
.btn-reject:hover { background: #c0392b; }
.text-muted { color: #999; font-style: italic; font-size: 0.9rem; }
 
@media(max-width: 768px) {
  .admin-sidebar { display: none; }
}
</style>