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
      
      // 🟢 FIX: Changed 'document' to 'receipt' to match backend upload.single('receipt')
      formData.append('receipt', file.value);

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
      <TopNavBar pageTitle="Submit Claim" />
      
      <div class="content-wrapper">
        <h1 class="page-title">Raise New Claim</h1>

        <div class="warning-box">
          <h3>Dear Faculty,</h3>
          <p><strong>1. Do not attach password protected files.</strong> To remove password:</p>
          <ul>
            <li>Open file > Enter password.</li>
            <li>Press <strong>Ctrl + P</strong> > Save as PDF.</li>
            <li>Upload the new file.</li>
          </ul>
        </div>

        <div class="form-card">
          <form class="claim-form">
            
            <div class="form-grid">
              <div class="form-col">
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

                <div class="form-group">
                  <label>Date Incurred</label>
                  <input type="date" v-model="form.dateIncurred" required />
                </div>
              </div>

              <div class="form-col">
                <div class="form-group">
                  <label>Description</label>
                  <textarea v-model="form.description" rows="3" placeholder="Details about the expense..." required></textarea>
                </div>

                <div class="form-group upload-group">
                  <label>Upload Receipt (Max 10MB)</label>
                  <input type="file" @change="handleFileChange" accept=".pdf,.jpg,.png" required />
                </div>
              </div>
            </div>

            <div class="declaration-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="isDeclared" />
                <span>I declare that I have not raised these claims in the past and I am aware of consequences for any false or duplicate claims under BITS policy.</span>
              </label>
            </div>

            <div v-if="errorMessage" class="msg error">{{ errorMessage }}</div>
            <div v-if="successMessage" class="msg success">{{ successMessage }}</div>

            <div class="button-group">
              <button type="button" class="btn-draft" @click="processClaim('draft')" :disabled="loading">
                Save Draft
              </button>
              <button type="button" class="btn-submit" @click="processClaim('submitted')" :disabled="loading || !isDeclared">
                {{ loading ? 'Processing...' : 'Submit Claim' }}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* GLOBAL RESET */
*, *::before, *::after {
  box-sizing: border-box;
}

.page-container {
  display: flex;
  height: 100vh;
  width: 100%;
  font-family: 'Inter', sans-serif;
  background: #f5f6fa;
  overflow: hidden;
}

/* SIDEBAR */
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

/* MAIN CONTENT */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Allow vertical scrolling for form */
  overflow-x: hidden;
}

.content-wrapper {
  padding: 1.5rem 2rem; /* Reduced padding for compact look */
  width: 100%;
  max-width: 1000px; /* Constrain width for readability */
  margin: 0 auto;
}

.page-title {
  font-size: 1.6rem;
  color: #111827;
  margin-bottom: 1.5rem;
  font-weight: 700;
}

/* RED WARNING BOX (Compact) */
.warning-box {
  background-color: #fff5f5;
  border-left: 4px solid #c0392b;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #c0392b;
  border-radius: 6px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.warning-box h3 { font-size: 1rem; margin-bottom: 0.4rem; font-weight: 700; }
.warning-box ul { margin-left: 1.2rem; margin-top: 0.3rem; }
.warning-box li { margin-bottom: 0.2rem; }

/* FORM CARD */
.form-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  width: 100%;
}

/* 2-Column Layout for Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Split into 2 equal columns */
  gap: 2rem;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group label { display: block; margin-bottom: 0.4rem; font-weight: 600; color: #374151; font-size: 0.9rem; }

input, select, textarea {
  width: 100%;
  padding: 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

input:focus, select:focus, textarea:focus {
  border-color: #667eea;
  outline: none;
}

/* Upload Input Styling */
.upload-group input {
  border: 2px dashed #d1d5db;
  padding: 0.8rem;
  background: #f9fafb;
  cursor: pointer;
}
.upload-group input:hover { border-color: #667eea; }

/* Declaration Box */
.declaration-group {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  font-weight: 500;
  line-height: 1.4;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  flex-shrink: 0;
  cursor: pointer;
}

/* Messages */
.msg { padding: 10px; border-radius: 6px; margin-bottom: 1rem; text-align: center; font-size: 0.9rem; font-weight: 500; }
.msg.error { background: #fee2e2; color: #b91c1c; }
.msg.success { background: #dcfce7; color: #15803d; }

/* Button Group */
.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.btn-submit {
  padding: 0.75rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-submit:hover:not(:disabled) { background: #5a6fd6; }
.btn-submit:disabled { background: #9ca3af; cursor: not-allowed; }

.btn-draft {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-draft:hover:not(:disabled) { background: #f3f4f6; }

/* Mobile Responsiveness */
@media(max-width: 768px) {
  .sidebar { display: none; }
  .form-grid { grid-template-columns: 1fr; gap: 1rem; } /* Stack columns on mobile */
  .content-wrapper { padding: 1rem; }
  .button-group { flex-direction: column-reverse; }
  .btn-submit, .btn-draft { width: 100%; }
}
</style>