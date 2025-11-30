<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
 
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
 
// File Handling
const file = ref<File | null>(null);
 
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    file.value = target.files[0];
  }
};
 
const submitClaim = async () => {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
 
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
 
    // 1. Create Claim
    const claimResponse = await axios.post(`${apiUrl}/api/faculty/claims`, form.value, {
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
 
    successMessage.value = 'Claim submitted successfully!';
    setTimeout(() => {
      router.push('/my-claims');
    }, 1500);
 
  } catch (error: any) {
    console.error(error);
    errorMessage.value = error.response?.data?.error || 'Error submitting claim.';
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
<div class="topbar">
<h1>Submit New Claim</h1>
</div>
 
      <div class="form-wrapper">
<form @submit.prevent="submitClaim" class="claim-form">
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
 
          <div v-if="errorMessage" class="msg error">{{ errorMessage }}</div>
<div v-if="successMessage" class="msg success">{{ successMessage }}</div>
 
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? 'Uploading...' : 'Submit Claim' }}
</button>
 
        </form>
</div>
</div>
</div>
</template>
 
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
 
/* Layout Containers */
.page-container {
  display: flex; /* Forces side-by-side layout */
  min-height: 100vh;
  width: 100%;
  font-family: 'Inter', sans-serif;
  background: #f5f6fa;
}
 
/* Sidebar Styles */
.sidebar {
  width: 260px;
  min-width: 260px; /* Prevents shrinking */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}
 
.sidebar h2 { margin-bottom: 2rem; text-align: center; }
 
.menu-item {
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}
.menu-item:hover { background: rgba(255, 255, 255, 0.2); }
.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }
 
/* Main Content Styles */
.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}
 
.topbar h1 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 2rem;
}
 
/* Form Styles */
.form-wrapper {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  max-width: 600px;
}
 
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
 
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #444; }
 
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
 
.submit-btn {
  width: 100%;
  padding: 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.submit-btn:hover:not(:disabled) { background: #5a6fd6; }
.submit-btn:disabled { background: #ccc; }
 
.msg { padding: 10px; border-radius: 6px; margin-bottom: 1rem; text-align: center; }
.msg.error { background: #fee2e2; color: #dc2626; }
.msg.success { background: #dcfce7; color: #16a34a; }
</style>