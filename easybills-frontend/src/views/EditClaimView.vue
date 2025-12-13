<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';
import TopNavBar from '../components/TopNavBar.vue';

const route = useRoute();
const router = useRouter();
const claimId = route.params.id;

const loading = ref(true);
const submitting = ref(false);
const claim = ref<any>(null);
const file = ref<File | null>(null);

// Form Data
const form = ref({
  category: '',
  amount: '',
  description: '',
  dateIncurred: ''
});

// Helper to find the last rejection reason from audit trail
const rejectionReason = computed(() => {
  if (!claim.value || !claim.value.auditTrail) return '';
  // Find last entry by Accounts
  const trail = claim.value.auditTrail;
  for (let i = trail.length - 1; i >= 0; i--) {
    if (trail[i].status === 'referred_back') {
      return trail[i].notes;
    }
  }
  return 'No specific reason provided.';
});

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) file.value = target.files[0];
};

const fetchClaim = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    // We can reuse the "My Claims" endpoint logic but we need a single claim fetcher.
    // If you don't have a single GET /claims/:id, we can filter from the list for now.
    const response = await axios.get(`${apiUrl}/api/faculty/claims`, { withCredentials: true });
    if (response.data.success) {
      const found = response.data.data.find((c: any) => c.id == claimId);
      if (found) {
        claim.value = found;
        // Pre-fill form
        form.value.category = found.category;
        form.value.amount = found.amount;
        form.value.description = found.description;
        form.value.dateIncurred = new Date(found.dateIncurred).toISOString().split('T')[0];
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const resubmit = async () => {
  submitting.value = true;
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const formData = new FormData();
    
    formData.append('category', form.value.category);
    formData.append('amount', form.value.amount);
    formData.append('description', form.value.description);
    formData.append('dateIncurred', form.value.dateIncurred);
    
    if (file.value) {
      formData.append('receipt', file.value);
    }

    await axios.put(`${apiUrl}/api/faculty/claims/${claimId}`, formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    alert('Claim Resubmitted Successfully!');
    router.push('/my-claims');

  } catch (error) {
    alert('Failed to resubmit claim.');
    console.error(error);
  } finally {
    submitting.value = false;
  }
};

const navigate = (path: string) => router.push(path);

onMounted(fetchClaim);
</script>

<template>
  <div class="page-container">
    <div class="sidebar">
      <h2>EasyBills</h2>
      <div class="menu-item" @click="navigate('/dashboard')">Dashboard</div>
      <div class="menu-item active" @click="navigate('/my-claims')">My Claims</div>
      <div class="menu-item" @click="navigate('/upload-bill')">Upload Bill</div>
      <div class="menu-item" @click="navigate('/profile')">Profile</div>
    </div>

    <div class="main-content">
      <TopNavBar pageTitle="Edit Claim" />
      
      <div class="content-wrapper">
        <div v-if="loading">Loading...</div>
        <div v-else-if="!claim">Claim not found.</div>
        
        <div v-else class="form-card">
          <div class="header-row">
            <h1>Edit Claim #{{ claimId }}</h1>
            <span class="status-badge">{{ claim.status.replace('_', ' ') }}</span>
          </div>

          <div class="reason-box" v-if="claim.status === 'referred_back'">
            <h3>⚠️ Action Required</h3>
            <p><strong>Admin Note:</strong> {{ rejectionReason }}</p>
          </div>

          <form @submit.prevent="resubmit">
            <div class="form-grid">
              <div class="form-col">
                <div class="form-group">
                  <label>Category</label>
                  <select v-model="form.category">
                    <option value="Travel">Travel</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Registration Fees">Registration Fees</option>
                    <option value="Academic Events">Academic Events</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Amount (₹)</label>
                  <input type="number" v-model="form.amount" />
                </div>
                <div class="form-group">
                  <label>Date</label>
                  <input type="date" v-model="form.dateIncurred" />
                </div>
              </div>

              <div class="form-col">
                <div class="form-group">
                  <label>Description</label>
                  <textarea v-model="form.description" rows="4"></textarea>
                </div>
                <div class="form-group">
                  <label>Attach New Receipt (Optional)</label>
                  <input type="file" @change="handleFileChange" accept=".pdf,.jpg,.png" />
                  <small>Leave empty to keep existing receipt.</small>
                </div>
              </div>
            </div>

            <div class="actions">
              <button type="button" class="btn-cancel" @click="router.push('/my-claims')">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="submitting">
                {{ submitting ? 'Resubmitting...' : 'Resubmit Claim' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reuse basic styles from UploadBillView */
.page-container { display: flex; height: 100vh; background: #f5f6fa; font-family: 'Inter', sans-serif; }
.sidebar { width: 260px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem 1.5rem; }
.main-content { flex: 1; padding: 2rem; overflow-y: auto; }
.form-card { background: white; padding: 2rem; border-radius: 12px; max-width: 900px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }

.reason-box { background: #fff5f5; border-left: 4px solid #c0392b; padding: 1rem; margin-bottom: 2rem; border-radius: 4px; color: #7f1d1d; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
.form-col { display: flex; flex-direction: column; gap: 1rem; }
input, select, textarea { width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; }
.actions { display: flex; justify-content: flex-end; gap: 1rem; }
.btn-submit { background: #667eea; color: white; padding: 0.8rem 2rem; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-cancel { background: #eee; color: #333; padding: 0.8rem 2rem; border: none; border-radius: 6px; cursor: pointer; }
.menu-item { padding: 10px; margin-bottom: 5px; cursor: pointer; }
.menu-item:hover { background: rgba(255,255,255,0.2); border-radius: 5px; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.status-badge { background: #fef3c7; color: #92400e; padding: 5px 10px; border-radius: 15px; font-weight: bold; text-transform: uppercase; font-size: 0.8rem; }
</style>