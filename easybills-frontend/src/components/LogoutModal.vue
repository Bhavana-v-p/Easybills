<script setup lang="ts">

// Define events to communicate with parent

const emit = defineEmits(['close', 'confirm']);
</script>
 
<template>
<div class="modal-backdrop" @click.self="$emit('close')">
<div class="modal-card">
<h3>Are you sure you want to sign out?</h3>
<div class="modal-actions">
<button class="btn-cancel" @click="$emit('close')">Cancel</button>
<button class="btn-signout" @click="$emit('confirm')">Sign Out</button>
</div>
</div>
</div>
</template>
 
<style scoped>

/* Backdrop */

.modal-backdrop {

  position: fixed;

  top: 0; left: 0; width: 100vw; height: 100vh;

  background: rgba(0, 0, 0, 0.5); /* Dim background */

  display: flex;

  justify-content: center;

  align-items: center;

  z-index: 9999;

}
 
/* Modal Card */

.modal-card {

  background: white;

  padding: 2rem;

  border-radius: 8px;

  width: 400px;

  box-shadow: 0 4px 20px rgba(0,0,0,0.15);

  text-align: left;

}
 
h3 {

  font-size: 1.1rem;

  font-weight: 600;

  color: #1f2937;

  margin-bottom: 2rem;

}
 
/* Buttons */

.modal-actions {

  display: flex;

  justify-content: flex-end;

  gap: 1rem;

}
 
button {

  padding: 0.6rem 1.2rem;

  border-radius: 6px;

  font-size: 0.95rem;

  font-weight: 500;

  cursor: pointer;

  border: none;

  transition: 0.2s;

}
 
.btn-cancel {

  background: #f3f4f6;

  color: #374151;

}

.btn-cancel:hover { background: #e5e7eb; }
 
.btn-signout {

  background: #6366f1; /* Purple color from your screenshot */

  color: white;

}

.btn-signout:hover { background: #4f46e5; }
</style>
 