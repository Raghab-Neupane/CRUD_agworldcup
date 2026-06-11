<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click="handleBackdropClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="header-title-group">
            <h3>Set Match Result</h3>
          </div>
          <button class="close-btn" @click="$emit('cancel')">&times;</button>
        </div>

        <div class="modal-body" v-if="match">
          <p class="match-info-text">
            Choose the outcome for <strong>Match #{{ match.match_no }}</strong> ({{ match.stage }}):
          </p>

          <div class="result-options">
            <!-- Team 1 Option -->
            <button
              class="option-card"
              :class="{ selected: selectedResult === 'TEAM1' }"
              @click="selectedResult = 'TEAM1'"
            >
              <span class="team-name">{{ match.team1 }} Won</span>
              <span class="badge team1-badge">Home</span>
            </button>

            <!-- Team 2 Option -->
            <button
              class="option-card"
              :class="{ selected: selectedResult === 'TEAM2' }"
              @click="selectedResult = 'TEAM2'"
            >
              <span class="team-name">{{ match.team2 }} Won</span>
              <span class="badge team2-badge">Away</span>
            </button>

            <!-- Draw Option -->
            <button
              class="option-card"
              :class="{ selected: selectedResult === 'DRAW' }"
              @click="selectedResult = 'DRAW'"
            >
              <span class="team-name">Draw / Tie</span>
              <span class="badge draw-badge">Draw</span>
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="!selectedResult || loading"
            @click="handleConfirm"
          >
            <span v-if="loading" class="spinner-small"></span>
            Submit Result
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  match: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['confirm', 'cancel']);

const selectedResult = ref('');

// Reset selected result on open
watch(() => props.show, (newVal) => {
  if (newVal) {
    selectedResult.value = props.match?.result || '';
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

const handleConfirm = () => {
  if (!selectedResult.value) return;
  emit('confirm', {
    matchNo: props.match.match_no,
    result: selectedResult.value,
  });
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
  max-width: 400px;
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

.modal-body {
  margin-bottom: 20px;
}

.match-info-text {
  font-size: 0.9rem;
  color: #475569;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.result-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #1e293b;
  font-family: inherit;
  width: 100%;
}

.option-card:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.option-card.selected {
  background: rgba(25, 118, 210, 0.08);
  border-color: #1976d2;
}

.team-name {
  font-weight: 600;
  font-size: 0.9rem;
  text-align: left;
}

.badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

.team1-badge {
  background: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}

.team2-badge {
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
}

.draw-badge {
  background: #f1f5f9;
  color: #64748b;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
