<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click="$emit('close')">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="header-title-group">
            <h3>Match Results Leaderboard</h3>
          </div>
          <button class="close-btn" @click="$emit('close')">&times;</button>
        </div>

        <div class="modal-body">
          <div class="results-layout" v-if="matchesWithPostId.length">
            <!-- Sidebar: Post IDs List -->
            <div class="post-id-sidebar">
              <span class="sidebar-title">Select Post ID</span>
              <div class="post-list">
                <button v-for="m in matchesWithPostId" :key="m.match_no" class="post-item-btn"
                  :class="{ active: selectedMatch?.match_no === m.match_no }" @click="selectedMatch = m">
                  Post ID: {{ m.post_id }}
                  <span class="badge" :class="'status-' + m.status">#{{ m.match_no }}</span>
                </button>
              </div>
            </div>

            <!-- Content Area: Participants and Winner Leaderboard -->
            <div class="results-detail-area">
              <div v-if="selectedMatch" class="match-detail-card">
                <div class="match-meta">
                  <h4>Match #{{ selectedMatch.match_no }} ({{ selectedMatch.stage }})</h4>
                  <p class="teams-versus">{{ selectedMatch.team1 }} vs {{ selectedMatch.team2 }}</p>
                </div>

                <!-- Winner Section -->
                <div class="winner-box">
                  <div class="winner-info-left">
                    <span class="winner-label">Winner</span>
                    <h3 class="winner-name">{{ resultDetails.winner_name || 'Not Decided yet' }}</h3>
                    <p class="winner-phone" v-if="resultDetails.winner_name && resultDetails.winner_phone">
                      📞 {{ resultDetails.winner_phone }}
                    </p>
                  </div>
                  <div class="winner-info-right" v-if="resultDetails.winner_name">
                    <span class="pts-badge winner-pts">{{ resultDetails.winner_point }} Points</span>
                  </div>
                </div>

                <hr class="results-divider" />

                <!-- Participants Section -->
                <div class="participants-section">
                  <div v-if="loadingResult" style="padding: 10px; color: #64748b; font-style: italic;">
                    Loading results...
                  </div>
                  <template v-else>
                    <h5>Participants ({{ participantsList.length }})</h5>
                    <div class="participants-table-list" v-if="participantsList.length">
                      <div v-for="(p, idx) in participantsList" :key="idx" class="participant-table-row">
                        <div class="p-info">
                          <span class="p-index">{{ idx + 1 }}</span>
                          <span class="p-name-bold">{{ p.name }}</span>
                          <span class="p-phone-light" v-if="p.mobile_number">({{ p.mobile_number }})</span>
                        </div>
                        <div class="p-points">
                          <span class="pts-badge participant-pts">{{ p.point }} Points</span>
                        </div>
                      </div>
                    </div>
                    <p class="no-participants" v-else>No participants listed for this match.</p>
                  </template>
                </div>
              </div>
              <div v-else class="select-prompt">
                <p>Please select a Post ID from the list to view the leaderboard.</p>
              </div>
            </div>
          </div>
          <div class="empty-results-state" v-else>
            <p>No matches with a Post ID found in the database.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import matchService from '../services/matchService';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  matches: {
    type: Array,
    required: true,
  },
});

defineEmits(['close']);

const selectedMatch = ref(null);
const resultDetails = ref({
  winner_name: '',
  winner_phone: '',
  winner_point: 0,
  participants: '',
  participants_list: []
});
const loadingResult = ref(false);

// Filter matches that have a non-empty post_id
const matchesWithPostId = computed(() => {
  return props.matches.filter(m => m.post_id && m.post_id.trim() !== '');
});

// TODO: Replace the static JSON import with an environment variable pointing to the result endpoint.
// const fetchData = ... (remove this line when using the real API)
// Removed static fetchData import; fetching results from API

// Fetches result details from the backend endpoint defined in an environment variable.
// Replace the dummy implementation below with a call to the API, e.g.:
// const fetchResultDetails = async (postId) => {
//   const endpoint = import.meta.env.VITE_RESULT_ENDPOINT; // adjust as needed
//   const res = await fetch(`${endpoint}/${postId}`);
//   const data = await res.json();
//   resultDetails.value = {
//     winner_name: data.winner?.name || '',
//     winner_phone: data.winner?.mobile_number || '',
//     winner_point: data.winner?.point || 0,
const fetchResultDetails = async (postId) => {
  loadingResult.value = true;
  try {
    const config = useRuntimeConfig();
    const data = await matchService.getResult(postId, config.public.getresultServiceUrl);
    resultDetails.value = {
      winner_name: data.winner?.name || '',
      winner_phone: data.winner?.mobile_number || '',
      winner_point: data.winner?.points !== undefined ? data.winner.points : (data.winner?.point || 0),
      participants: '',
      participants_list: (data.participants || []).map(p => ({
        ...p,
        point: p.points !== undefined ? p.points : (p.point || 0)
      }))
    };
  } catch (e) {
    console.error('Failed to fetch result details', e);
    resultDetails.value = { winner_name: '', winner_phone: '', winner_point: 0, participants: '', participants_list: [] };
  } finally {
    loadingResult.value = false;
  }
};

// Watch selected match to trigger results fetch
watch(
  () => selectedMatch.value,
  (newVal) => {
    if (newVal) {
      fetchResultDetails(newVal.post_id);
    } else {
      resultDetails.value = { winner_name: '', winner_phone: '', winner_point: 0, participants: '' };
    }
  }
);

// Watch props.show to reset selection
watch(
  () => props.show,
  (newVal) => {
    if (newVal && matchesWithPostId.value.length) {
      selectedMatch.value = matchesWithPostId.value[0];
    } else if (!newVal) {
      selectedMatch.value = null;
      resultDetails.value = { winner_name: '', winner_phone: '', winner_point: 0, participants: '' };
    }
  },
  { immediate: true }
);

// Split comma-separated participants string into an array of objects
const participantsList = computed(() => {
  if (resultDetails.value.participants_list && resultDetails.value.participants_list.length > 0) {
    return resultDetails.value.participants_list;
  }
  if (!resultDetails.value.participants) return [];
  return resultDetails.value.participants
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(name => ({ name, phone: '' }));
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
  width: 95%;
  max-width: 850px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  color: #1e293b;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
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
  font-size: 1.25rem;
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
  overflow-y: auto;
  flex-grow: 1;
}

/* Results grid layout */
.results-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
  min-height: 350px;
}

.post-id-sidebar {
  border-right: 1px solid #e2e8f0;
  padding-right: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  max-height: 320px;
}

.post-item-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
  text-align: left;
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.post-item-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.post-item-btn.active {
  background: rgba(25, 118, 210, 0.08);
  border-color: #1976d2;
  color: #1976d2;
}

.badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
}

.status-completed {
  background: rgba(46, 125, 50, 0.1);
  color: #2e7d32;
}

.status-upcoming {
  background: #f1f5f9;
  color: #64748b;
}

/* Detail Area styles */
.results-detail-area {
  display: flex;
  flex-direction: column;
}

.match-detail-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.match-meta h4 {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.teams-versus {
  margin: 0;
  font-size: 0.92rem;
  color: #64748b;
  font-weight: 500;
}

.winner-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
 
.winner-info-left {
  display: flex;
  flex-direction: column;
}

.winner-info-right {
  display: flex;
  align-items: center;
}
 
.winner-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}
 
.winner-name {
  margin: 0 0 2px 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}
 
.winner-phone {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.pts-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  letter-spacing: 0.02em;
}

.winner-pts {
  background: #e2e8f0;
  color: #0f172a;
  border: 1px solid #cbd5e1;
}

.participant-pts {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.results-divider {
  border: 0;
  height: 1px;
  background: #e2e8f0;
  margin: 16px 0;
}
 
.participants-section h5 {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #475569;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 6px;
}
 
.participants-table-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding: 2px;
}
 
.participant-table-row {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 10px 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.p-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.p-index {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  width: 20px;
}

.p-name-bold {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
}

.p-phone-light {
  font-size: 0.78rem;
  font-weight: 300;
  color: #64748b;
}

.no-participants,
.select-prompt,
.empty-results-state {
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
  padding: 40px 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
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
}

.btn-secondary {
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.btn-secondary:hover {
  background: #f1f5f9;
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

@media (max-width: 580px) {
  .results-layout {
    grid-template-columns: 1fr;
  }

  .post-id-sidebar {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding-right: 0;
    padding-bottom: 15px;
  }
}
</style>
