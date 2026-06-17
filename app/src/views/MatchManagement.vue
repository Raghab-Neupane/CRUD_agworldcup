<template>
  <div class="admin-dashboard">
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Processing Request...</p>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="'toast-' + toast.type">
          <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '⚠️' }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="removeToast(toast.id)">&times;</button>
        </div>
      </TransitionGroup>
    </div>

    <!-- Header Section -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="page-title">World Cup Dashboard</h1>
        <p class="subtitle">Admin panel for managing matches, live states, and tournament outcomes</p>
      </div>
      <div class="header-right">
        <button class="btn-primary" @click="showAddModal = true">
          Add New Match
        </button>
        <button class="btn-results" @click="showResultsModal = true">
          View Results
        </button>
        <button class="btn-refresh" @click="fetchMatches" :disabled="loading" title="Refresh match data">
          Refresh
        </button>
        <button class="btn-logout" @click="handleLogout" title="Sign Out">
          Sign Out
        </button>
        <button class="btn-present" @click="handlePresent" title="Mark as Present">
          Present
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="dashboard-content">
      <!-- Status Tabs / Filter Pills -->
      <div class="filter-tabs-container">
        <div class="tabs-list">
          <button v-for="tab in filterTabs" :key="tab.value" class="tab-pill"
            :class="{ active: activeStatusFilter === tab.value }" @click="activeStatusFilter = tab.value">
            {{ tab.label }}
            <span class="tab-count">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <!-- Match Visual Dashboard Grid -->
      <section class="content-main">
        <MatchTable :matches="matches" :active-status-filter="activeStatusFilter"
          :calculated-match-nos="calculatedMatchNos" @request-delete="triggerDeleteConfirmation"
          @update-status="handleUpdateStatus" @update-match="handleUpdateMatch" @calculate-match="handleCalculateMatch"
          @show-toast="e => addToast(e.message, e.type)" />
      </section>
    </main>

    <!-- Add Match Modal -->
    <AddMatchModal :show="showAddModal" :loading="modalActionLoading" @confirm="handleConfirmAdd"
      @bulk-confirm="handleConfirmBulkAdd" @cancel="showAddModal = false" />

    <!-- Confirmation Modal for Deletion -->
    <ConfirmDeleteModal :show="showDeleteModal" :match-no="matchToDelete" @confirm="handleConfirmDelete"
      @cancel="closeDeleteModal" />

    <!-- View Results Modal -->
    <ViewResultsModal :show="showResultsModal" :matches="matches" @close="showResultsModal = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import matchService from '../services/matchService';
import AddMatchModal from '../components/AddMatchModal.vue';
import MatchTable from '../components/MatchTable.vue';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.vue';
import ViewResultsModal from '../components/ViewResultsModal.vue';

// State variables
const matches = ref([]);
const loading = ref(false);
const modalActionLoading = ref(false);
const toasts = ref([]);
const activeStatusFilter = ref('all');
const calculatedMatchNos = ref([]);

const loadCalculatedMatches = () => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('calculatedMatches');
      if (stored) {
        calculatedMatchNos.value = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse calculated matches from localStorage:', e);
    }
  }
};

const markMatchAsCalculated = (matchNo) => {
  if (!calculatedMatchNos.value.includes(matchNo)) {
    calculatedMatchNos.value.push(matchNo);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('calculatedMatches', JSON.stringify(calculatedMatchNos.value));
      } catch (e) {
        console.error('Failed to save calculated matches to localStorage:', e);
      }
    }
  }
};

// Modals State
const showAddModal = ref(false);
const showDeleteModal = ref(false);
const showResultsModal = ref(false);
const matchToDelete = ref(null);

let toastIdCounter = 0;

// Toast helper
const addToast = (message, type = 'success') => {
  const id = ++toastIdCounter;
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    removeToast(id);
  }, 4500);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

// Count computations
const upcomingCount = computed(() => matches.value.filter(m => m.status === 'upcoming').length);
const completedCount = computed(() => matches.value.filter(m => m.status === 'completed').length);

// Status filter tabs definitions
const filterTabs = computed(() => [
  { label: 'All Matches', value: 'all', count: matches.value.length }
]);

const handleLogout = () => {
  const authCookie = useCookie('isAuthenticated');
  authCookie.value = null;
  navigateTo('/login');
};

const handlePresent = () => {
  window.open('https://worldcup.ambition.guru/', '_blank');
};

// API operations
const fetchMatches = async () => {
  loading.value = true;
  try {
    matches.value = await matchService.getMatches();
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message || 'Failed to fetch matches';
    addToast(errorMsg, 'error');
  } finally {
    loading.value = false;
  }
};

const handleConfirmAdd = async (newMatchData) => {
  modalActionLoading.value = true;
  try {
    const createdMatch = await matchService.addMatch(newMatchData);
    matches.value.push(createdMatch);
    showAddModal.value = false;
    addToast('Match added successfully!', 'success');
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message || 'Failed to add match';
    addToast(errorMsg, 'error');
  } finally {
    modalActionLoading.value = false;
  }
};

const handleConfirmBulkAdd = async (matchesList) => {
  modalActionLoading.value = true;
  let insertedCount = 0;
  let failedCount = 0;
  let lastError = '';

  for (const newMatchData of matchesList) {
    try {
      const cleanedData = { ...newMatchData };

      // Map variations of key names to standard model property names
      if ('team1_goal' in cleanedData) {
        cleanedData.team_1_goal = cleanedData.team1_goal;
        delete cleanedData.team1_goal;
      }
      if ('team2_goal' in cleanedData) {
        cleanedData.team_2_goal = cleanedData.team2_goal;
        delete cleanedData.team2_goal;
      }

      // Sanitize team_1_goal
      if (cleanedData.team_1_goal === '' || cleanedData.team_1_goal === null || cleanedData.team_1_goal === undefined) {
        cleanedData.team_1_goal = null;
      } else {
        cleanedData.team_1_goal = Number(cleanedData.team_1_goal);
      }

      // Sanitize team_2_goal
      if (cleanedData.team_2_goal === '' || cleanedData.team_2_goal === null || cleanedData.team_2_goal === undefined) {
        cleanedData.team_2_goal = null;
      } else {
        cleanedData.team_2_goal = Number(cleanedData.team_2_goal);
      }

      // Sanitize post_id
      if (cleanedData.post_id !== undefined && cleanedData.post_id !== null) {
        cleanedData.post_id = String(cleanedData.post_id).trim();
        if (cleanedData.post_id === '') {
          cleanedData.post_id = null;
        }
      } else {
        cleanedData.post_id = null;
      }

      // Sanitize start_time
      if (cleanedData.start_time !== undefined && cleanedData.start_time !== null) {
        cleanedData.start_time = String(cleanedData.start_time).trim();
        if (cleanedData.start_time === '') {
          cleanedData.start_time = null;
        }
      } else {
        cleanedData.start_time = null;
      }

      // Sanitize end_time
      if (cleanedData.end_time !== undefined && cleanedData.end_time !== null) {
        cleanedData.end_time = String(cleanedData.end_time).trim();
        if (cleanedData.end_time === '') {
          cleanedData.end_time = null;
        }
      } else {
        cleanedData.end_time = null;
      }

      await matchService.addMatch(cleanedData);
      insertedCount++;
    } catch (error) {
      failedCount++;
      lastError = error.response?.data?.detail || error.message || 'Duplicate or invalid record';
    }
  }

  showAddModal.value = false;
  modalActionLoading.value = false;

  if (insertedCount > 0) {
    addToast(`Successfully bulk inserted ${insertedCount} matches!`, 'success');
  }
  if (failedCount > 0) {
    addToast(`Failed to insert ${failedCount} matches. Error: ${lastError}`, 'error');
  }

  await fetchMatches();
};

const handleUpdateStatus = async ({ matchNo, status }) => {
  loading.value = true;
  try {
    const updatedMatch = await matchService.updateMatchStatus(matchNo, status);
    const index = matches.value.findIndex(m => m.match_no === matchNo);
    if (index !== -1) {
      matches.value[index] = updatedMatch;
    }
    addToast(`Match #${matchNo} status updated to ${status.toUpperCase()}!`, 'success');
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message || 'Failed to update status';
    addToast(errorMsg, 'error');
  } finally {
    loading.value = false;
  }
};





const handleUpdateMatch = async ({ matchNo, updatedData }) => {
  loading.value = true;
  try {
    const updatedMatch = await matchService.updateMatch(matchNo, updatedData);
    const index = matches.value.findIndex(m => m.match_no === matchNo);
    if (index !== -1) {
      matches.value[index] = updatedMatch;
    }
    addToast(`Match #${matchNo} details updated successfully!`, 'success');
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message || 'Failed to update match';
    addToast(errorMsg, 'error');
  } finally {
    loading.value = false;
  }
};

const handleCalculateMatch = async (match) => {
  loading.value = true;
  try {
    // Validate all fields are filled
    const requiredFields = [
      { key: 'stage', name: 'Stage' },
      { key: 'team1', name: 'Team 1' },
      { key: 'team2', name: 'Team 2' },
      { key: 'post_id', name: 'Post ID' },
      { key: 'team_1_goal', name: 'Team 1 Goal' },
      { key: 'team_2_goal', name: 'Team 2 Goal' },
      { key: 'start_time', name: 'Start Time' },
      { key: 'end_time', name: 'End Time' }
    ];

    const emptyFields = requiredFields.filter(f => {
      const val = match[f.key];
      return val === null || val === undefined || String(val).trim() === '';
    });

    if (emptyFields.length > 0) {
      const fieldNames = emptyFields.map(f => f.name).join(', ');
      throw new Error(`All fields must be filled. Missing: ${fieldNames}`);
    }

    const g1 = match.team_1_goal !== null && match.team_1_goal !== undefined && match.team_1_goal !== '' ? parseInt(match.team_1_goal, 10) : 0;
    const g2 = match.team_2_goal !== null && match.team_2_goal !== undefined && match.team_2_goal !== '' ? parseInt(match.team_2_goal, 10) : 0;

    let pid = match.post_id || match.match_no;
    try {
      const parsed = parseInt(pid, 10);
      if (!isNaN(parsed)) {
        pid = parsed;
      }
    } catch (e) { }

    const getKathmanduTime = (dateInput) => {
      let date;
      if (!dateInput) {
        date = new Date();
      } else {
        let str = String(dateInput).trim();
        if (str.includes(' ')) {
          str = str.replace(' ', 'T');
        }
        date = new Date(str);
      }

      if (isNaN(date.getTime())) {
        date = new Date();
      }

      // Kathmandu is UTC +05:45
      const kathmanduOffsetMs = (5 * 60 + 45) * 60 * 1000;
      const ktmDate = new Date(date.getTime() + kathmanduOffsetMs);

      const pad = (num) => String(num).padStart(2, '0');
      const yyyy = ktmDate.getUTCFullYear();
      const mm = pad(ktmDate.getUTCMonth() + 1);
      const dd = pad(ktmDate.getUTCDate());
      const hh = pad(ktmDate.getUTCHours());
      const min = pad(ktmDate.getUTCMinutes());
      const ss = pad(ktmDate.getUTCSeconds());

      return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+05:45`;
    };

    const startTimeFormatted = getKathmanduTime(match.start_time);
    const endTimeFormatted = getKathmanduTime(match.end_time);

    const payload = {
      post_id: pid,
      team_1_name: match.team1,
      team_1_goal: g1,
      team_2_name: match.team2,
      team_2_goal: g2,
      start_time: startTimeFormatted,
      end_time: endTimeFormatted
    };

    // Fetch calculate service URL from config and execute request
    const config = useRuntimeConfig();
    const result = await matchService.calculate(payload, config.public.calcServiceUrl);
    console.log('Calculation outcome:', result);
    markMatchAsCalculated(match.match_no);
    addToast('Calculated result successfully.', 'success');
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message || 'Failed to calculate match outcomes';
    addToast(errorMsg, 'error');
  } finally {
    loading.value = false;
  }
};

// Delete actions
const triggerDeleteConfirmation = (matchNo) => {
  matchToDelete.value = matchNo;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  matchToDelete.value = null;
};

const handleConfirmDelete = async () => {
  if (matchToDelete.value === null) return;
  const matchNo = matchToDelete.value;
  closeDeleteModal();
  loading.value = true;
  try {
    const response = await matchService.deleteMatch(matchNo);
    matches.value = matches.value.filter(m => m.match_no !== response.match_no);
    addToast(`Match #${matchNo} deleted successfully`, 'success');
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message || 'Failed to delete match';
    addToast(errorMsg, 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCalculatedMatches();
  fetchMatches();
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

body {
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
  color: #1e293b;
  font-family: 'Outfit', sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

.admin-dashboard {
  min-height: 100vh;
  padding: 30px;
  max-width: 95%;
  margin: 0 auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 20px;
}

.page-title {
  margin: 0 0 4px 0;
  font-size: 1.85rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #0f172a;
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-primary {
  background: #1976d2;
  /* Quasar Blue primary color */
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-results {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-results:hover {
  background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
}

.btn-refresh {
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 10px 18px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-logout {
  background: #ef4444;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 10px 18px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: #dc2626;
}

.btn-present {
  background: #4e3b6e;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 10px 18px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-present:hover {
  background: #3d28f5;
}

/* Main Dashboard content */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Filter pills list */
.filter-tabs-container {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
}

.tabs-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tab-pill {
  background: transparent;
  border: none;
  color: #64748b;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.tab-pill:hover {
  color: #1e293b;
  background: #f1f5f9;
}

.tab-pill.active {
  background: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}

.tab-count {
  font-size: 0.75rem;
  background: #e2e8f0;
  color: #475569;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
}

.tab-pill.active .tab-count {
  background: rgba(25, 118, 210, 0.2);
  color: #1976d2;
}

/* Loading overlay spinner */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  color: #1e293b;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 3px solid #e2e8f0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Toast Notification Styles */
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 360px;
  width: 100%;
}

.toast {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #1976d2;
  border-radius: 8px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #1e293b;
  font-size: 0.88rem;
  position: relative;
  transition: all 0.3s ease;
}

.toast-success {
  border-left-color: #2e7d32;
}

.toast-error {
  border-left-color: #d32f2f;
}

.toast-icon {
  font-weight: bold;
  font-size: 1.1rem;
}

.toast-success .toast-icon {
  color: #2e7d32;
}

.toast-error .toast-icon {
  color: #d32f2f;
}

.toast-message {
  flex-grow: 1;
  line-height: 1.4;
  font-weight: 500;
}

.toast-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #475569;
}

/* Toast Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
