<script setup lang="ts">
import { onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

// Optional: Auto-redirect if ALREADY logged in
onMounted(async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const res = await axios.get(`${apiUrl}/api/user/me`, { withCredentials: true });
    if (res.data.success) {
      router.push('/dashboard'); // Only redirect if we are SURE they are logged in
    }
  } catch (e) {
    // Not logged in? Stay here and show the login button.
  }
});

const loginWithGoogle = () => {
  // Redirect to backend auth endpoint
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
};
</script>

<template>
  <div class="landing-container">
    <div class="card">
      <h1>EasyBills</h1>
      <p>Track Every Rupee Digitally and Transparently</p>
      <p>Expense Claim Management System</p>
      <div class="illustration">
        🧾
      </div>

      <button @click="loginWithGoogle" class="google-btn">
        <span class="icon">G</span> Login with Google
      </button>

      <p class="footer">BITS Pilani | WILP</p>
    </div>
  </div>
</template>

<style scoped>
.landing-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Inter', sans-serif;
}

.card {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 400px;
}

h1 { margin-bottom: 0.5rem; color: #1f2937; }
p { color: #6b7280; margin-bottom: 2rem; }

.illustration { font-size: 4rem; margin-bottom: 2rem; }

.google-btn {
  background: #4285F4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  transition: background 0.2s;
}

.google-btn:hover { background: #357ae8; }
.icon { background: white; color: #4285F4; width: 24px; height: 24px; border-radius: 50%; font-weight: bold; display: flex; align-items: center; justify-content: center; }

.footer { margin-top: 2rem; font-size: 0.8rem; opacity: 0.8; }
</style>