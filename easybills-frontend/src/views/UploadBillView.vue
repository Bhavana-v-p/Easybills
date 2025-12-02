<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import TopNavBar from '../components/TopNavBar.vue';
 
const router = useRouter();
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
 
// Form Data
const form = ref({
  category: 'Travel',
  amount: '',
  description: '',
  dateIncurred: new Date().toISOString().split('T')[0]
});
 
// Declaration Checkbox State
const isDeclared = ref(false);
 
// File Handling
const file = ref<File | null>(null);
 
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    file.value = target.files[0];
  }
};
 
// Unified Submit Function (Handles both Draft and Final Submit)
const processClaim = async (statusType: 'submitted' | 'draft') => {
  if (statusType === 'submitted' && !isDeclared.value) {
    alert("You must acknowledge the declaration before submitting.");
    return;
  }
 
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
 
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
 
    // 1. Create Claim Payload
    const payload = {
      ...form.value,
      status: statusType // Send 'draft' or 'submitted'
    };
 
    const claimResponse = await axios.post(`${apiUrl}/api/faculty/claims`, payload, {
      withCredentials: true
    });
 
    if (!claimResponse.data.success) throw new Error('Failed to create claim');
    const newClaimId = claimResponse.data.data.id;
 
    // 2. Upload File (if selected)
    if (file.value) {
      const formData = new FormData();
      formData.append('document', file.value);
 
      await axios.post(`${apiUrl}/api/faculty/claims/${newClaimId}/documents`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
 
    successMessage.value = statusType === 'draft'
      ? 'Claim saved as draft!'
      : 'Claim submitted successfully!';
      
    setTimeout(() => {
      router.push('/my-claims');
    }, 1500);
 
  } catch (error: any) {
    console.error(error);
    errorMessage.value = error.response?.data?.error || 'Error processing claim.';
  } finally {
    loading.value = false;
  }
};
 
const navigate = (path: string) => router.push(path);
</script>
 
<template>
  <div class="page-container">
    
    <div class="sidebar">
      <h2>EasyBills</h2>
      <div class="menu-item" @click="navigate('/dashboard')">Dashboard</div>
      <div class="menu-item" @click="navigate('/my-claims')">My Claims</div>
      <div class="menu-item active" @click="navigate('/upload-bill')">Upload Bill</div>
      <div class="menu-item" @click="navigate('/profile')">Profile</div>
      <div class="menu-item" @click="navigate('/settings')">Settings</div>
    </div>
 
    <div class="main-content">
      <div class="main" style="padding: 0;"> <TopNavBar pageTitle="EasyBills - Reimbursement System for Faculty" />
        <h1>Raise New Claim</h1>
      </div>
 
      <div class="warning-box">
        <h3>Dear Faculty,</h3>
        <p><strong>1. Please do not attach password protected bills/ documents.</strong> You can follow below steps to convert pdf protected file to a normal PDF:</p>
        <ul>
          <li>Open the file and enter the password to open the file.</li>
          <li>Press <strong>Ctrl + P</strong> or go to <strong>File > Print > Save as PDF</strong>. Save the PDF file in the desired location and the new file will not have any password.</li>
          <li>Please upload this version of the file.</li>
        </ul>
      </div>
 
      <div class="form-wrapper">
        <form class="claim-form">
          
          <div class="form-row">
            <div class="form-group">
              <label>Expense Category</label>
              <select v-model="form.category" required>
                <option value="Travel">Travel</option>
                <option value="Stationery">Stationery</option>
                <option value="Registration Fees">Registration Fees</option>
                <option value="Academic Events">Academic Events</option>
                <option value="Other">Other</option>
              </select>
            </div>
 
            <div class="form-group">
              <label>Amount (₹)</label>
              <input type="number" v-model="form.amount" placeholder="e.g. 1200" required />
            </div>
          </div>
 
          <div class="form-group">
            <label>Date Incurred</label>
            <input type="date" v-model="form.dateIncurred" required />
          </div>
 
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="form.description" rows="3" placeholder="Details about the expense..." required></textarea>
          </div>
 
          <div class="form-group upload-group">
            <label>Upload Receipt (Max 10MB)</label>
            <input type="file" @change="handleFileChange" accept=".pdf,.jpg,.png" required />
          </div>
 
          <div class="declaration-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="isDeclared" />
              I declare that I have not raised these claims in the past and I am aware of consequences for any false or duplicate claims under BITS policy.
            </label>
          </div>
 
          <div v-if="errorMessage" class="msg error">{{ errorMessage }}</div>
          <div v-if="successMessage" class="msg success">{{ successMessage }}</div>
 
          <div class="button-group">
            <button type="button" class="btn-draft" @click="processClaim('draft')" :disabled="loading">
              Save As Draft
            </button>
            <button type="button" class="btn-submit" @click="processClaim('submitted')" :disabled="loading || !isDeclared">
              {{ loading ? 'Processing...' : 'Submit Claim' }}
            </button>
          </div>
 
        </form>
      </div>
    </div>
  </div>
</template>
 
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
 
/* Layout Containers */
.page-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  font-family: 'Inter', sans-serif;
  background: #f5f6fa;
}
 
/* Sidebar Styles */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}
 
.sidebar h2 { margin-bottom: 2rem; text-align: center; font-weight: 700; font-size: 1.6rem; }
 
.menu-item {
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 1rem;
}
.menu-item:hover { background: rgba(255, 255, 255, 0.2); }
.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }
 
/* Main Content Styles */
.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
 
.topbar h1 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 2rem;
  font-weight: 700;
}
 
/* 🔴 Red Warning Box */
.warning-box {
  background-color: #fff5f5;
  border-left: 5px solid #c0392b;
  padding: 1.5rem;
  margin-bottom: 2rem;
  color: #c0392b;
  border-radius: 4px;
  font-size: 0.95rem;
  line-height: 1.6;
}
 
.warning-box h3 {
  margin-bottom: 0.5rem;
  font-weight: 700;
}
 
.warning-box ul {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
}
 
.warning-box li {
  margin-bottom: 0.3rem;
}
 
/* Form Styles */
.form-wrapper {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  width: 100%; /* Stretch to full width */
}
 
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
 
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #444; }
 
input, select, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}
 
.upload-group input {
  border: 2px dashed #ddd;
  padding: 1rem;
  background: #fafafa;
}
 
/* Declaration Checkbox */
.declaration-group {
  grid-column: span 2;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
}
 
.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.95rem;
  color: #333;
  cursor: pointer;
  font-weight: 500;
}
 
.checkbox-label input {
  width: 20px;
  height: 20px;
  margin-top: 3px;
  cursor: pointer;
}
 
/* Button Group */
.button-group {
  grid-column: span 2;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
 
.btn-submit {
  padding: 1rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.btn-submit:hover:not(:disabled) { background: #5a6fd6; }
.btn-submit:disabled { background: #ccc; cursor: not-allowed; }
 
.btn-draft {
  padding: 1rem 2rem;
  background: #e2e8f0;
  color: #4a5568;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.btn-draft:hover:not(:disabled) { background: #cbd5e0; }
 
.msg { grid-column: span 2; padding: 10px; border-radius: 6px; margin-bottom: 1rem; text-align: center; }
.msg.error { background: #fee2e2; color: #dc2626; }
.msg.success { background: #dcfce7; color: #16a34a; }
 
/* Responsive Grid for Desktop */
@media (min-width: 1024px) {
  .claim-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
 
  .form-group:has(textarea),
  .upload-group,
  .declaration-group,
  .button-group,
  .msg {
    grid-column: span 2;
  }
}
 
@media(max-width: 768px) {
  .sidebar { display: none; }
  .form-row { grid-template-columns: 1fr; }
}
</style>