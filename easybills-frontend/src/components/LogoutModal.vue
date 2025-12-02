<script setup lang="ts">
// Define events this component can emit back to the parent
const emit = defineEmits(['close', 'confirm']);
 
const close = () => emit('close');
const confirm = () => emit('confirm');
</script>
 
<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-box">
        
      <div class="icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      </div>
 
      <h3>Log out</h3>
      <p>Are you sure you want to log out? You'll need to login again to use the application.</p>
 
      <div class="button-group">
        <button class="btn-cancel" @click="close">Cancel</button>
        <button class="btn-logout" @click="confirm">Log out</button>
      </div>
 
    </div>
  </div>
</template>
 
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
 
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent dark background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure it sits on top */
  font-family: 'Inter', sans-serif;
}
 
.modal-box {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  animation: scaleIn 0.2s ease-out;
}
 
.icon-wrapper {
    width: 50px;
    height: 50px;
    background-color: #fee2e2; /* Light red background */
    color: #dc2626; /* Dark red icon */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem auto; /* Center horizontally */
}
 
h3 {
    margin: 0 0 0.5rem 0;
    color: #111827;
    font-size: 1.25rem;
    font-weight: 600;
}
 
p {
    color: #6b7280;
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 2rem;
}
 
.button-group {
    display: flex;
    gap: 1rem;
}
 
button {
    flex: 1;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: 0.2s;
    border: none;
}
 
.btn-cancel {
    background-color: #f3f4f6;
    color: #374151;
}
.btn-cancel:hover { background-color: #e5e7eb; }
 
.btn-logout {
    background-color: #dc2626;
    color: white;
}
.btn-logout:hover { background-color: #b91c1c; }
 
@keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
</style>