<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import TopNavBar from '../components/TopNavBar.vue';

const router = useRouter();
const claims = ref<any[]>([]);
const loading = ref(true);
const filterStatus = ref('submitted'); 
const selectedYear = ref(new Date().getFullYear());

// MODAL STATE
const showDetailsModal = ref(false);
const selectedClaim = ref<any>(null);

// FORMAT ID: EB00001/25
const formatClaimId = (id: number, dateStr: string) => {
  if (!id) return '---';
  const date = new Date(dateStr || new Date());
  const yearSuffix = date.getFullYear().toString().slice(-2);
  return `EB${id.toString().padStart(5, '0')}/${yearSuffix}`;
};

const navigate = (path: string) => router.push(path);

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

// STATS
const stats = computed(() => {
  const currentYear = selectedYear.value;
  const yearClaims = claims.value.filter(c => new Date(c.dateIncurred).getFullYear() === currentYear);
  
  return {
    submitted: claims.value.filter(c => c.status === 'submitted').length,
    referred: claims.value.filter(c => c.status === 'referred_back').length,
    pendingPay: claims.value.filter(c => c.status === 'pending_payment').length,
    rejected: claims.value.filter(c => c.status === 'rejected').length,
    disbursed: claims.value.filter(c => c.status === 'disbursed').length,
    totalDisbursed: yearClaims
      .filter(c => c.status === 'disbursed')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  };
});

// FILTER LOGIC
const filteredClaims = computed(() => {
  if (filterStatus.value === 'all') return claims.value;
  return claims.value.filter(c => c.status === filterStatus.value);
});

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

  // 1. REJECT
  if (action === 'rejected') {
    notes = prompt("Please provide reason for Rejection:") || "";
    if (!notes) return;
  }
  // 2. REFER BACK
  else if (action === 'more_info') { // Frontend sends 'more_info', Backend saves 'referred_back'
    notes = prompt("Please provide reason for Referring Back (Clarification):") || "";
    if (!notes) return;
  }
  // 3. APPROVE
  else if (action === 'approved') {
    if (!confirm("Approve this claim? It will move to Pending Payment.")) return;
    notes = "Approved by Accounts.";
  }
  // 4. DISBURSE
  else if (action === 'paid') { // Frontend sends 'paid', Backend saves 'disbursed'
    if (!confirm("Mark as Disbursed? This confirms payment has been made.")) return;
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
        // Map UI status manually to reflect immediate change
        if (action === 'approved') localClaim.status = 'pending_payment';
        else if (action === 'more_info') localClaim.status = 'referred_back';
        else if (action === 'paid') localClaim.status = 'disbursed';
        else localClaim.status = action;
    }
    
    alert(`Claim ${formatClaimId(claimId, selectedClaim.value.createdAt)} updated.`);
    showDetailsModal.value = false; // Close modal
  } catch (error) {
    alert('Failed to update status.');
  }
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

onMounted(() => fetchClaims());
</script>

<template>
  <div class="page-container">
    <div class="sidebar admin-sidebar">
      <h2>EasyBills <span class="badge">Admin</span></h2>
      <div class="menu-item active" @click="navigate('/accounts')">Dashboard</div>
      <div class="menu-item" @click="navigate('/profile')">Profile</div>
      <div class="menu-item" @click="navigate('/settings')">Settings</div>
    </div>

    <div class="main-content">
      <TopNavBar pageTitle="Accounts Dashboard" />
      
      <div class="content-wrapper">
        <div class="stats-grid">
          <div class="stat-card blue" @click="filterStatus = 'submitted'">
            <h3>{{ stats.submitted }}</h3> <p>Pending Approval</p>
          </div>
          <div class="stat-card orange" @click="filterStatus = 'referred_back'">
            <h3>{{ stats.referred }}</h3> <p>Referred Back</p>
          </div>
          <div class="stat-card yellow" @click="filterStatus = 'pending_payment'">
            <h3>{{ stats.pendingPay }}</h3> <p>Pending Payment</p>
          </div>
          <div class="stat-card green" @click="filterStatus = 'disbursed'">
            <h3>{{ stats.disbursed }}</h3> <p>Disbursed</p>
          </div>
          <div class="stat-card purple year-card">
             <div class="stat-header">
               <span>💰 Total ({{ selectedYear }})</span>
             </div>
             <h3>₹{{ stats.totalDisbursed.toLocaleString() }}</h3>
          </div>
        </div>

        <div class="table-section">
          <h2>{{ filterStatus.replace('_', ' ').toUpperCase() }} CLAIMS</h2>
          
          <div class="table-card">
            <div v-if="loading" class="loading">Loading...</div>
            <table v-else class="claims-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Faculty</th>
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
                  <td>User {{ claim.facultyId }}</td>
                  <td>{{ formatDate(claim.dateIncurred) }}</td>
                  <td>{{ claim.category }}</td>
                  <td class="amount">₹{{ claim.amount }}</td>
                  <td><span :class="['status-badge', claim.status]">{{ claim.status.replace('_', ' ') }}</span></td>
                  <td>
                    <button class="btn-view" @click="openClaimDetails(claim)">👁️ View / Act</button>
                  </td>
                </tr>
                <tr v-if="filteredClaims.length === 0">
                  <td colspan="7" class="empty-state">No claims found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Claim Details: {{ formatClaimId(selectedClaim.id, selectedClaim.createdAt) }}</h2>
          <button class="close-btn" @click="showDetailsModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <div class="info-grid">
            <div><strong>Category:</strong> {{ selectedClaim.category }}</div>
            <div><strong>Amount:</strong> ₹{{ selectedClaim.amount }}</div>
            <div><strong>Date Incurred:</strong> {{ formatDate(selectedClaim.dateIncurred) }}</div>
            <div><strong>Current Status:</strong> {{ selectedClaim.status.replace('_', ' ').toUpperCase() }}</div>
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
            
            <div v-if="['disbursed', 'rejected', 'referred_back'].includes(selectedClaim.status)" class="actions">
                <span class="text-muted">No actions available for this status.</span>
            </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Basic Layout */
.page-container { display: flex; height: 100vh; width: 100%; font-family: 'Inter', sans-serif; background: #f5f6fa; overflow: hidden; }
.admin-sidebar { width: 260px; min-width: 260px; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: white; padding: 2rem; }
.sidebar h2 { font-size: 1.5rem; margin-bottom: 2rem; font-weight: 700; }
.badge { font-size: 0.7rem; background: #fbbf24; color: #1e3a8a; padding: 2px 6px; border-radius: 4px; margin-left: 5px; }
.menu-item { padding: 1rem; border-radius: 8px; cursor: pointer; margin-bottom: 0.5rem; }
.menu-item:hover, .menu-item.active { background: rgba(255,255,255,0.2); font-weight: 600; }
.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.content-wrapper { padding: 2rem; width: 100%; max-width: 1400px; margin: 0 auto; }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.stat-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); cursor: pointer; border-left: 5px solid transparent; transition: transform 0.2s; }
.stat-card:hover { transform: translateY(-3px); }
.stat-card.blue { border-left-color: #3b82f6; }
.stat-card.orange { border-left-color: #f97316; }
.stat-card.yellow { border-left-color: #eab308; }
.stat-card.green { border-left-color: #22c55e; }
.stat-card.red { border-left-color: #ef4444; }
.stat-card.purple { border-left-color: #a855f7; }

/* Table */
.table-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; padding: 1rem; }
.claims-table { width: 100%; border-collapse: collapse; }
th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
th { background: #f8fafc; font-weight: 600; color: #64748b; }
.claim-link { color: #2563eb; font-weight: 600; cursor: pointer; text-decoration: underline; }
.btn-view { padding: 4px 10px; background: #e2e8f0; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }

/* Status Badges */
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: inline-block; }
.submitted { background: #eff6ff; color: #3b82f6; }
.pending_payment { background: #fef9c3; color: #854d0e; }
.disbursed { background: #f0fdf4; color: #15803d; }
.rejected { background: #fef2f2; color: #b91c1c; }
.referred_back { background: #fff7ed; color: #c2410c; }

/* MODAL STYLES */
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
</style>