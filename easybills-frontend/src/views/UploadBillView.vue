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

  dateIncurred: new Date().toISOString().split('T')[0] // Default to today

});
 
// File Handling

const file = ref<File | null>(null);
 
const handleFileChange = (event: Event) => {

  const target = event.target as HTMLInputElement;

  if (target.files && target.files[0]) {

    const selectedFile = target.files[0];
 
    // 1. Validate Size (10MB Limit)

    if (selectedFile.size > 10 * 1024 * 1024) {

      alert('File size exceeds 10MB limit.');

      target.value = ''; // Reset input

      file.value = null;

      return;

    }
 
    // 2. Validate Type

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(selectedFile.type)) {

      alert('Invalid file type. Only PDF, JPG, and PNG are allowed.');

      target.value = '';

      file.value = null;

      return;

    }
 
    file.value = selectedFile;

  }

};
 
const submitClaim = async () => {

  loading.value = true;

  errorMessage.value = '';

  successMessage.value = '';
 
  try {

    const apiUrl = import.meta.env.VITE_API_BASE_URL;
 
    // --- STEP 1: Create the Claim Record ---

    const claimResponse = await axios.post(`${apiUrl}/api/faculty/claims`, form.value, {

      withCredentials: true

    });
 
    if (!claimResponse.data.success) throw new Error('Failed to create claim');
 
    const newClaimId = claimResponse.data.data.id;
 
    // --- STEP 2: Upload File (if selected) ---

    if (file.value) {

      const formData = new FormData();

      formData.append('document', file.value);
 
      await axios.post(`${apiUrl}/api/faculty/claims/${newClaimId}/documents`, formData, {

        withCredentials: true,

        headers: { 'Content-Type': 'multipart/form-data' }

      });

    }
 
    // Success!

    successMessage.value = 'Claim submitted and document uploaded successfully!';

    // Redirect after a short delay

    setTimeout(() => {

      router.push('/my-claims');

    }, 1500);
 
  } catch (error: any) {

    console.error(error);

    errorMessage.value = error.response?.data?.error || 'Error submitting claim. Please try again.';

  } finally {

    loading.value = false;

  }

};
 
// Navigation

const navigate = (path: string) => router.push(path);
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
 
    <div class="main">
<div class="topbar">
<h1>Submit New Claim</h1>
</div>
 
      <div class="form-container">
<form @submit.prevent="submitClaim">
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
<input type="number" v-model="form.amount" placeholder="e.g. 1200" required min="1" />
</div>
 
          <div class="form-group">
<label>Date Incurred</label>
<input type="date" v-model="form.dateIncurred" required />
</div>
 
          <div class="form-group">
<label>Description</label>
<textarea v-model="form.description" rows="3" placeholder="Describe the expense..." required></textarea>
</div>
 
          <div class="form-group">
<label>Upload Bill / Receipt</label>
<p class="hint">Supported: PDF, JPG, PNG (Max 10MB)</p>
<input type="file" @change="handleFileChange" accept=".pdf,.jpg,.jpeg,.png" required />
</div>
 
          <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>
<div v-if="successMessage" class="success-msg">{{ successMessage }}</div>
 
          <button type="submit" class="submit-btn" :disabled="loading">

            {{ loading ? 'Submitting...' : 'Submit Claim' }}
</button>
 
        </form>
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
 
.sidebar {

  width: 260px;

  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  color: white;

  padding: 2rem 1.5rem;

  display: flex;

  flex-direction: column;

}

.sidebar h2 { font-size: 1.6rem; margin-bottom: 2rem; text-align: center; font-weight: 700; }

.menu-item { padding: 0.9rem 1rem; border-radius: 0.75rem; margin-bottom: 0.7rem; cursor: pointer; transition: background 0.3s; }

.menu-item:hover { background: rgba(255, 255, 255, 0.2); }

.menu-item.active { background: rgba(255, 255, 255, 0.3); font-weight: 600; }
 
.main { flex: 1; padding: 1.5rem 2rem; }

.topbar h1 { font-size: 1.8rem; color: #333; font-weight: 700; margin-bottom: 2rem; }
 
.form-container {

  background: white;

  padding: 2rem;

  border-radius: 1rem;

  box-shadow: 0 8px 20px rgba(0,0,0,0.08);

  max-width: 600px;

}
 
.form-group { margin-bottom: 1.5rem; }

.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; }

.form-group input, .form-group select, .form-group textarea {

  width: 100%;

  padding: 0.8rem;

  border: 1px solid #ddd;

  border-radius: 0.5rem;

  font-family: inherit;

}

.hint { font-size: 0.85rem; color: #666; margin-bottom: 0.5rem; }
 
.submit-btn {

  width: 100%;

  padding: 1rem;

  background: #667eea;

  color: white;

  border: none;

  border-radius: 0.5rem;

  font-size: 1rem;

  font-weight: 600;

  cursor: pointer;

  transition: 0.3s;

}

.submit-btn:hover:not(:disabled) { background: #5568d3; }

.submit-btn:disabled { background: #ccc; cursor: not-allowed; }
 
.error-msg { color: #d63031; margin-bottom: 1rem; font-weight: 500; }

.success-msg { color: #27ae60; margin-bottom: 1rem; font-weight: 500; }
 
@media(max-width: 768px) {

  .sidebar { display: none; }

}
</style>
 