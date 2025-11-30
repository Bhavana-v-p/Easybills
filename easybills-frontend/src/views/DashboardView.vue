<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router'; // 1. Import Router
 
const router = useRouter(); // 2. Initialize Router
 
// State variables
const user = ref<any>(null);
const loading = ref(true);
 
// 3. Define the navigate function (This was missing!)
const navigate = (path: string) => {
  router.push(path);
};
 
// Fetch user data when component mounts
onMounted(async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    // Call backend API to get real user data
    const response = await axios.get(`${apiUrl}/api/user/me`, {
      withCredentials: true
    });
    if (response.data.success) {
      user.value = response.data.data;
    }
  } catch (error) {
    console.error('Not logged in or error:', error);
    // Optional: Redirect to login if user is not authenticated
    // window.location.href = 'http://localhost:3000/login.html';
  } finally {
    loading.value = false;
  }
});
 
// Logout function
const logout = async () => {
   const apiUrl = import.meta.env.VITE_API_BASE_URL;
   // Redirect to backend logout route
   window.location.href = `${apiUrl}/auth/logout`;
};
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
<h1>Dashboard Overview</h1>
<div v-if="user" class="user-info">
            Welcome, {{ user.email }}
</div>
<button class="logout-btn" @click="logout">Logout</button>
</div>
 
      <div v-if="loading" class="loading-state">
<p>Loading dashboard data...</p>
</div>
 
      <div v-else>
<div class="cards">
<div class="card">
<h3>Total Claims</h3>
<div class="value">18</div>
</div>
<div class="card">
<h3>Approved</h3>
<div class="value">12</div>
</div>
<div class="card">
<h3>Pending</h3>
<div class="value">4</div>
</div>
<div class="card">
<h3>Rejected</h3>
<div class="value">2</div>
</div>
</div>
 
        <div class="table-container">
<h2 class="table-title">Recent Claims</h2>
 
          <table>
<thead>
<tr>
<th>Bill ID</th>
<th>Date</th>
<th>Amount</th>
<th>Status</th>
</tr>
</thead>
 
            <tbody>
<tr>
<td>#B1023</td>
<td>2025-01-20</td>
<td>₹1,200</td>
<td><span class="status approved">Approved</span></td>
</tr>
<tr>
<td>#B1024</td>
<td>2025-01-22</td>
<td>₹850</td>
<td><span class="status pending">Pending</span></td>
</tr>
<tr>
<td>#B1025</td>
<td>2025-01-25</td>
<td>₹2,000</td>
<td><span class="status rejected">Rejected</span></td>
</tr>
</tbody>
</table>
</div>
</div>
 
    </div>
</div>
</template>
 
<style scoped>
/* Import Inter Font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
 
/* Main Layout */
.dashboard-container {
  font-family: 'Inter', sans-serif;
  background: #f5f6fa;
  display: flex;
  min-height: 100vh;
  width: 100%;
}
 
/* Sidebar */
.sidebar {
  width: 260px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}
 
.sidebar h2 {
  font-size: 1.6rem;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 700;
}
 
.menu-item {
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  margin-bottom: 0.7rem;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 1rem;
}
 
.menu-item:hover {
  background: rgba(255, 255, 255, 0.2);
}
 
.menu-item.active {
  background: rgba(255, 255, 255, 0.3);
  font-weight: 600;
}
 
/* Main Area */
.main {
  flex: 1;
  padding: 1.5rem 2rem;
}
 
/* Topbar */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
 
.topbar h1 {
  font-size: 1.8rem;
  color: #333;
  font-weight: 700;
}
 
.user-info {
    font-size: 0.9rem;
    color: #666;
    margin-right: 1rem;
    font-weight: 600;
}
 
.logout-btn {
  padding: 0.6rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: 0.3s;
}
 
.logout-btn:hover {
  background: #5568d3;
}
 
/* Cards */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
 
.card {
  background: white;
  padding: 1.4rem;
  border-radius: 1rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}
 
.card h3 {
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
}
 
.card .value {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
}
 
/* Table */
.table-container {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}
 
.table-title {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 600;
}
 
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
 
th, td {
  padding: 0.9rem;
  text-align: left;
  font-size: 0.95rem;
  color: #333;
}
 
th {
  background: #f0f1f5;
  font-weight: 600;
}
 
tr:nth-child(even) {
  background: #fafafa;
}
 
.status {
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
}
 
.pending { background: #fff3cd; color: #d39e00; }
.approved { background: #d4edda; color: #155724; }
.rejected { background: #f8d7da; color: #721c24; }
 
.loading-state {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
    color: #666;
}
 
@media(max-width: 768px) {
  .sidebar { display: none; }
  .dashboard-container { flex-direction: column; }
}
</style>