<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click="handleBackdropClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="header-title-group">
            <h3>Add New Match</h3>
          </div>
          <button class="close-btn" @click="$emit('cancel')">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div v-if="errorMsg" class="form-error-alert">
            <span class="alert-text">{{ errorMsg }}</span>
          </div>
          <div class="form-row split">
            <div class="form-group">
              <label for="match_no">Match Number</label>
              <input id="match_no" v-model.number="form.match_no" type="number" min="1" step="1" placeholder="e.g. 1"
                required class="form-input" />
            </div>

            <div class="form-group">
              <label for="stage">Tournament Stage</label>
              <select id="stage" v-model="form.stage" class="form-select" required>
                <option value="" disabled selected>Select Stage</option>
                <option value="Group A">Group A</option>
                <option value="Group B">Group B</option>
                <option value="Group C">Group C</option>
                <option value="Group D">Group D</option>
                <option value="Group E">Group E</option>
                <option value="Group F">Group F</option>
                <option value="Group G">Group G</option>
                <option value="Group H">Group H</option>
                <option value="Round of 16">Round of 16</option>
                <option value="Quarter-finals">Quarter-finals</option>
                <option value="Semi-finals">Semi-finals</option>
                <option value="Third Place Playoff">Third Place Playoff</option>
                <option value="Final">Final</option>
              </select>
            </div>
          </div>

          <!-- Team 1 & Team 2 -->
          <div class="form-group">
            <label for="team1">Team 1 (Home)</label>
            <input id="team1" v-model="form.team1" type="text" placeholder="e.g. Team 1" required class="form-input" />
          </div>

          <div class="form-group">
            <label for="team2">Team 2 (Away)</label>
            <input id="team2" v-model="form.team2" type="text" placeholder="e.g. Team 2" required class="form-input" />
          </div>

          <!-- Phone Number -->
          <div class="form-group">
            <label for="phone">Phone Number (Optional)</label>
            <input id="phone" v-model="form.phone" type="text" placeholder="e.g. +123456789" class="form-input" />
          </div>

          <!-- Actions -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-small"></span>
              {{ loading ? 'Saving...' : 'Add Match' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['confirm', 'cancel']);

const initialForm = {
  match_no: null,
  stage: '',
  team1: '',
  team2: '',
  status: 'upcoming',
  phone: ''
};

const form = reactive({ ...initialForm });
const errorMsg = ref('');

// Reset form when modal opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    Object.assign(form, initialForm);
    errorMsg.value = '';
  }
});

const handleBackdropClick = () => {
  emit('cancel');
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.show) {
    emit('cancel');
  }
};

const handleSubmit = () => {
  errorMsg.value = '';

  // Validation: Positive integer for Match Number
  if (!Number.isInteger(form.match_no) || form.match_no <= 0) {
    errorMsg.value = 'Match number must be a positive integer.';
    return;
  }

  // Validation: Team 1 and Team 2 must be different
  if (form.team1.trim().toLowerCase() === form.team2.trim().toLowerCase()) {
    errorMsg.value = 'Team 1 and Team 2 must be different countries/teams.';
    return;
  }

  emit('confirm', { ...form });
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  width: 90%;
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  color: #1e293b;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 12px;
}

.header-title-group h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1e293b;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-error-alert {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.form-row.split {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.8rem;
  color: #475569;
  font-weight: 600;
}

.form-input,
.form-select {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.88rem;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus {
  border-color: #1976d2;
}

.form-select {
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.btn {
  padding: 10px 18px;
  font-size: 0.88rem;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary {
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.btn-secondary:hover {
  background: #f1f5f9;
}

.btn-primary {
  background: #1976d2;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
