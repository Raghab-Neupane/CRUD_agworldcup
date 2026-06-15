<template>
  <div v-if="isAuthenticated">
    <MatchManagement />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import MatchManagement from '../src/views/MatchManagement.vue';

const authCookie = useCookie('isAuthenticated');
const isAuthenticated = ref(false);

if (authCookie.value === 'true') {
  isAuthenticated.value = true;
} else {
  navigateTo('/login');
}
</script>

<style scoped>
.auth-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #0f172a;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
