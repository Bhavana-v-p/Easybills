<script setup lang="ts">
const loginWithGoogle = () => {
  // Use the VITE_API_BASE_URL from your .env file
  const backendUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Redirect the user to your BACKEND's auth route
  // This route (on the backend) knows the Client ID, Secret, and Redirect URI
  window.location.href = `${backendUrl}/auth/google`;
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="brand-side">
        <div class="logo-circle">₹</div>
        <h1>EasyBills</h1>
        <p>Track Every Rupee, Digitally and Transparently.</p>
        <ul class="features">
          <li>✓ Digital bill uploads & secure storage</li>
          <li>✓ Real-time claim status tracking</li>
          <li>✓ Full audit trail & compliance</li>
        </ul>
      </div>

      <div class="form-side">
        <div class="header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <button class="google-btn" @click="loginWithGoogle">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="google-icon" />
          <span>Continue with Google</span>
        </button>

        <p class="footer-text">
          Don't have an account? It will be created automatically.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

/* Ensure full screen layout */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw; /* Force full width */
  background: #f0f2f5;
  font-family: 'Inter', sans-serif;
  position: fixed; /* Fix position to cover everything */
  top: 0;
  left: 0;
  z-index: 9999; /* Stay on top */
}

.login-card {
  display: flex;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  width: 900px;
  max-width: 90%;
  min-height: 550px;
}

/* Left Side */
.brand-side {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.logo-circle {
  width: 80px; height: 80px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; font-weight: 700;
  border: 2px solid rgba(255,255,255,0.3);
  margin-bottom: 1.5rem;
}

.brand-side h1 { margin-bottom: 0.5rem; font-size: 2rem; }
.brand-side p { opacity: 0.9; margin-bottom: 2rem; font-size: 1rem; }

.features { list-style: none; text-align: left; padding: 0; }
.features li { margin: 0.8rem 0; font-size: 0.95rem; opacity: 0.9; }

/* Right Side */
.form-side {
  flex: 1;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.header { text-align: center; margin-bottom: 2.5rem; }
.header h2 { font-size: 1.8rem; color: #333; margin-bottom: 0.5rem; }
.header p { color: #666; }

.google-btn {
  display: flex; align-items: center; justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.google-btn:hover { background: #f8f9fa; border-color: #ccc; }
.google-icon { width: 24px; height: 24px; }

.footer-text { margin-top: 2rem; font-size: 0.85rem; color: #888; }

@media (max-width: 768px) {
  .login-card { flex-direction: column; }
  .brand-side { padding: 2rem; }
  .form-side { padding: 2rem; }
}
</style>