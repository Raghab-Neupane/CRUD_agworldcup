<template>
  <div class="bulk-insert-container">
    <div class="panel-header">
      <h3>Bulk Insert Matches</h3>
      <span class="info-badge">JSON Format</span>
    </div>

    <div class="editor-section">
      <textarea
        v-model="rawJson"
        placeholder='[\n  {\n    "match_no": 1,\n    "stage": "Group A",\n    "team1": "Mexico",\n    "team2": "South Africa"\n  }\n]'
        class="json-textarea"
        @input="onInput"
      ></textarea>
    </div>

    <div class="feedback-section" v-if="rawJson.trim()">
      <div v-if="isValid" class="validation-status success">
        <span class="status-icon">✓</span>
        JSON is valid. Detected <strong>{{ detectedCount }}</strong> match(es).
      </div>
      <div v-else class="validation-status error">
        <span class="status-icon">✗</span>
        {{ validationError }}
      </div>
    </div>

    <div class="actions-section">
      <div class="left-actions">
        <button class="btn btn-secondary" @click="validateJsonClick" :disabled="!rawJson.trim()">
          Validate JSON
        </button>
        <button class="btn btn-primary" @click="submitBulkInsert" :disabled="!isValid || detectedCount === 0 || loading">
          Bulk Insert Matches
        </button>
      </div>
      <button class="btn btn-outline" @click="clearAll" :disabled="!rawJson.trim() && !validationError && !isValid">
        Clear
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['bulk-insert']);

const rawJson = ref('');
const isValid = ref(false);
const detectedCount = ref(0);
const validationError = ref('');

const validateData = (data) => {
  if (!Array.isArray(data)) {
    throw new Error('JSON input must be a JSON Array [ ... ]');
  }
  if (data.length === 0) {
    throw new Error('Array cannot be empty');
  }
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Item at index ${i} is not a valid object`);
    }
    if (!('match_no' in item) || item.match_no === undefined || item.match_no === null) {
      throw new Error(`Item at index ${i} is missing "match_no"`);
    }
    if (isNaN(Number(item.match_no))) {
      throw new Error(`Item at index ${i} has an invalid "match_no" (must be a number)`);
    }
    if (!item.stage || typeof item.stage !== 'string') {
      throw new Error(`Item at index ${i} is missing or has an invalid "stage"`);
    }
    if (!item.team1 || typeof item.team1 !== 'string') {
      throw new Error(`Item at index ${i} is missing or has an invalid "team1"`);
    }
    if (!item.team2 || typeof item.team2 !== 'string') {
      throw new Error(`Item at index ${i} is missing or has an invalid "team2"`);
    }
  }
};

const performValidation = () => {
  const content = rawJson.value.trim();
  if (!content) {
    isValid.value = false;
    detectedCount.value = 0;
    validationError.value = '';
    return;
  }
  try {
    const parsed = JSON.parse(content);
    validateData(parsed);
    isValid.value = true;
    detectedCount.value = parsed.length;
    validationError.value = '';
  } catch (err) {
    isValid.value = false;
    detectedCount.value = 0;
    validationError.value = err.message;
  }
};

const onInput = () => {
  performValidation();
};

const validateJsonClick = () => {
  performValidation();
};

const submitBulkInsert = () => {
  performValidation();
  if (isValid.value && detectedCount.value > 0) {
    try {
      const parsed = JSON.parse(rawJson.value.trim());
      emit('bulk-insert', parsed);
    } catch (err) {
      validationError.value = 'Failed to parse JSON before submission';
    }
  }
};

const clearAll = () => {
  rawJson.value = '';
  isValid.value = false;
  detectedCount.value = 0;
  validationError.value = '';
};

// Reset clear after successful load
const reset = () => {
  clearAll();
};

defineExpose({
  reset,
});
</script>

<style scoped>
.bulk-insert-container {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.1rem;
  font-weight: 600;
}

.info-badge {
  background: #334155;
  color: #94a3b8;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.editor-section {
  display: flex;
  flex-direction: column;
}

.json-textarea {
  width: 100%;
  height: 140px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
  color: #e2e8f0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  resize: vertical;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.2s;
}

.json-textarea:focus {
  border-color: #3b82f6;
}

.feedback-section {
  display: flex;
  flex-direction: column;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.4;
}

.validation-status.success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.validation-status.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.status-icon {
  font-weight: bold;
}

.actions-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 16px;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: #ffffff;
}

.btn-primary:not(:disabled):hover {
  background: #2563eb;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: #334155;
  color: #f1f5f9;
}

.btn-secondary:not(:disabled):hover {
  background: #475569;
}

.btn-outline {
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
}

.btn-outline:not(:disabled):hover {
  border-color: #f1f5f9;
  color: #f1f5f9;
}
</style>
