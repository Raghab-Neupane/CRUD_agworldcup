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
          <div class="form-row split">
            <div class="form-group dropdown-container">
              <label for="team1">Team 1 (Home)</label>
              <input id="team1" v-model="form.team1" @focus="focusTeam1 = true" @blur="onBlurTeam1" type="text" placeholder="e.g. Mexico" required class="form-input" autocomplete="off" />
              <ul class="q-menu" v-if="focusTeam1 && filteredTeam1.length">
                <li v-for="c in filteredTeam1" :key="c" @mousedown="selectTeam1(c)">{{ c }}</li>
              </ul>
            </div>

            <div class="form-group dropdown-container">
              <label for="team2">Team 2 (Away)</label>
              <input id="team2" v-model="form.team2" @focus="focusTeam2 = true" @blur="onBlurTeam2" type="text" placeholder="e.g. South Africa" required class="form-input" autocomplete="off" />
              <ul class="q-menu" v-if="focusTeam2 && filteredTeam2.length">
                <li v-for="c in filteredTeam2" :key="c" @mousedown="selectTeam2(c)">{{ c }}</li>
              </ul>
            </div>
          </div>

          <!-- Post ID & Start Time -->
          <div class="form-row split">
            <div class="form-group">
              <label for="post_id">Post ID</label>
              <input id="post_id" v-model="form.post_id" type="text" placeholder="e.g. 12345" class="form-input" />
            </div>

            <div class="form-group">
              <label for="start_time">Start Time</label>
              <input id="start_time" v-model="form.start_time" type="datetime-local" class="form-input" />
            </div>
          </div>

          <!-- Match End Time -->
          <div class="form-row split">
            <div class="form-group">
              <label for="end_time">Match End Time</label>
              <input id="end_time" v-model="form.end_time" type="datetime-local" class="form-input" />
            </div>
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
import { ref, reactive, watch, onMounted, onUnmounted, computed } from 'vue';

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

import countries from '../data/countries.json';

const initialForm = {
  match_no: null,
  stage: '',
  team1: '',
  team2: '',
  status: 'upcoming',
  result: '',
  winner: '',
  phone: '',
  post_id: '',
  goal_difference: null,
  start_time: '',
  end_time: '',
  participants: ''
};

const form = reactive({ ...initialForm });
const errorMsg = ref('');

// Dropdown states
const focusTeam1 = ref(false);
const focusTeam2 = ref(false);

const filteredTeam1 = computed(() => {
  const query = form.team1.toLowerCase();
  return countries.filter(c => c.toLowerCase().includes(query));
});

const filteredTeam2 = computed(() => {
  const query = form.team2.toLowerCase();
  return countries.filter(c => c.toLowerCase().includes(query));
});

const onBlurTeam1 = () => {
  setTimeout(() => { focusTeam1.value = false; }, 150);
};

const onBlurTeam2 = () => {
  setTimeout(() => { focusTeam2.value = false; }, 150);
};

const selectTeam1 = (c) => {
  form.team1 = c;
  focusTeam1.value = false;
};

const selectTeam2 = (c) => {
  form.team2 = c;
  focusTeam2.value = false;
};

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

  // Validation: Must be from the allowed countries list
  if (!countries.includes(form.team1)) {
    errorMsg.value = `Team 1 must be one of the allowed countries.`;
    return;
  }
  if (!countries.includes(form.team2)) {
    errorMsg.value = `Team 2 must be one of the allowed countries.`;
    return;
  }

  // Validation: Team 1 and Team 2 must be different
  if (form.team1.trim().toLowerCase() === form.team2.trim().toLowerCase()) {
    errorMsg.value = 'Team 1 and Team 2 must be different countries/teams.';
    return;
  }

  // Format start_time from datetime-local ISO (YYYY-MM-DDTHH:MM) to DB format (YYYY-MM-DD HH:MM:SS)
  const formattedForm = { ...form };
  if (formattedForm.start_time) {
    formattedForm.start_time = formattedForm.start_time.replace('T', ' ');
  }
  if (formattedForm.end_time) {
    formattedForm.end_time = formattedForm.end_time.replace('T', ' ');
  }

  emit('confirm', formattedForm);
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

.dropdown-container {
  position: relative;
}

.q-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  padding: 8px 0;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 2000;
}

.q-menu li {
  padding: 10px 16px;
  font-size: 0.88rem;
  color: #1e293b;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.q-menu li:hover {
  background: #f1f5f9;
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
