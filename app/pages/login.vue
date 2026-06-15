<template>
  <div class="q-login-page">
    <div class="q-card">
      <div class="q-card-title">Sign In</div>
      <form @submit.prevent="handleLogin" class="q-form">
        <div class="q-field">
          <label class="q-label">User Gmail</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="example@gmail.com"
            class="q-input"
          />
        </div>
        <div class="q-field">
          <label class="q-label">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="Password"
            class="q-input"
          />
        </div>
        <button type="submit" class="q-btn" :disabled="loading">
          <span v-if="loading">Loading...</span>
          <span v-else>Login</span>
        </button>
      </form>
      <div v-if="errorMsg" class="q-error">{{ errorMsg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

const handleLogin = async () => {
  loading.value = true;
  errorMsg.value = '';
  
  const emailVal = email.value.trim().toLowerCase();
  
  if (!emailVal.includes('@') || !emailVal.includes('.')) {
    errorMsg.value = 'Please enter a valid email address.';
    loading.value = false;
    return;
  }


  try {
    const config = useRuntimeConfig();
    const response = await $fetch(`${config.public.apiBase}/login`, {
      method: 'POST',
      body: {
        usergmail: emailVal,
        password: password.value
      }
    });

    if (response && response.success) {
      const authCookie = useCookie('isAuthenticated');
      authCookie.value = 'true';
      navigateTo('/');
    }
  } catch (err) {
    console.error(err);
    errorMsg.value = err.response?._data?.detail || 'Invalid Gmail or Password';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const authCookie = useCookie('isAuthenticated');
  if (authCookie.value === 'true') {
    navigateTo('/');
  }
});
</script>

<style scoped>
.q-login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  color: #000000;
}

.q-card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  width: 100%;
  max-width: 360px;
  padding: 24px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}

.q-card-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 20px;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.q-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.q-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.q-label {
  font-size: 0.8rem;
  color: #616161;
  font-weight: 600;
}

.q-input {
  border: 1px solid #c2c2c2;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 0.9rem;
  color: #000000;
  background: #ffffff;
  outline: none;
  transition: border-color 0.2s;
}

.q-input:focus {
  border-color: #1976d2;
}

.q-btn {
  background: #1976d2;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.q-btn:hover:not(:disabled) {
  background: #1565c0;
}

.q-btn:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
}

.q-error {
  color: #d32f2f;
  font-size: 0.85rem;
  margin-top: 16px;
  text-align: center;
}
</style>
