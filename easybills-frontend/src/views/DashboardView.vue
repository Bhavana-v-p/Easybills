<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
 
// State variables
const user = ref<any>(null);
const loading = ref(true);
 
// Fetch user data when component mounts
onMounted(async () => {
  try {
    // We use the environment variable you just set!
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    // Call backend API (credentials: true sends the session cookie)
    const response = await axios.get(`${apiUrl}/api/user/me`, {
      withCredentials: true 
    });
    if (response.data.success) {
      user.value = response.data.data;
    }
  } catch (error) {
    console.error('Not logged in or error:', error);
    // Optional: Redirect to login if error
    // window.location.href = 'http://localhost:3000/login.html';
  } finally {
    loading.value = false;
  }
});
 
// Logout function
const logout = async () => {
   const apiUrl = import.meta.env.VITE_API_BASE_URL;
   window.location.href = `${apiUrl}/auth/logout`;
};
</script>
 
<template>
<div class="dashboard-container">
<div v-if="loading" class="loading">Loading...</div>
<div v-else-if="user" class="content">
<h1>Welcome, {{ user.email }}</h1>
<div class="card">
<p><strong>Role:</strong> {{ user.role }}</p>
<p><strong>Google ID:</strong> {{ user.googleId }}</p>
</div>
<button @click="logout" class="logout-btn">Sign Out</button>
</div>
 
    <div v-else class="error">
<h2>Access Denied</h2>
<p>Please log in first.</p>
<a href="http://localhost:3000/login.html">Go to Login</a>
</div>
</div>
</template>
 
<style scoped>
.dashboard-container { padding: 40px; font-family: sans-serif; }
.card { background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
.logout-btn { background: #d63031; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
</style>