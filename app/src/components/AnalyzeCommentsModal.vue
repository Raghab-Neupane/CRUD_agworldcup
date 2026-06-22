<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click="$emit('close')">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="header-title-group">
            <h3>Analyze comments</h3>
          </div>
          <button class="close-btn" @click="$emit('close')">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Content Area: Participants and Winner Leaderboard -->
          <div class="results-detail-area" style="width: 100%;">
            <div v-if="selectedMatch" class="match-detail-card">
              <div class="match-meta">
                <div class="meta-left">
                  <h4>Match #{{ selectedMatch.match_no }} ({{ selectedMatch.stage }})</h4>
                  <p class="teams-versus">{{ selectedMatch.team1 }} vs {{ selectedMatch.team2 }}</p>
                </div>
              </div>

              <!-- Winner Section -->
              <div class="winner-box">
                <div class="winner-info-left">
                  <span class="winner-label">Winner</span>
                  <h3 class="winner-name">
                    <template v-if="hasCalculated">
                      {{ resultDetails.winner_name || 'No correct guess!' }}
                    </template>
                    <template v-else>
                      Please calculate first
                    </template>
                  </h3>
                  <p class="winner-phone" v-if="hasCalculated && resultDetails.winner_name && resultDetails.winner_phone">
                    📞 {{ resultDetails.winner_phone }}
                  </p>
                </div>
                <div class="winner-info-right" v-if="hasCalculated && resultDetails.winner_name">
                  <span class="pts-badge winner-pts">{{ resultDetails.winner_point }} Points</span>
                </div>
              </div>

              <hr class="results-divider" />

              <!-- Participants/Comments Section -->
              <div class="participants-section">
                <div v-if="loadingResult || loadingComments" style="padding: 10px; color: #64748b; font-style: italic;">
                  Loading details...
                </div>
                <template v-else>
                  <!-- Horizontal Tabs Switch -->
                  <div class="results-tabs">
                    <button class="tab-btn" :class="{ active: participantFilter === 'comments' }"
                      @click="participantFilter = 'comments'">
                      Comments ({{ (comments || []).length }})
                    </button>
                    <button class="tab-btn" :class="{ active: participantFilter === 'full' }"
                      @click="participantFilter = 'full'">
                      Full Match ({{ (resultDetails.correct_participants || []).length }})
                    </button>
                    <button class="tab-btn" :class="{ active: participantFilter === 'partial' }"
                      @click="participantFilter = 'partial'">
                      Partial Match ({{ (resultDetails.partial_participants || []).length }})
                    </button>
                  </div>

                  <!-- Comments Tab Content -->
                  <div v-if="participantFilter === 'comments'" class="comments-table-wrapper">
                    <table class="q-comments-table" v-if="comments.length">
                      <thead>
                        <tr>
                          <th style="width: 120px;">Customer ID</th>
                          <th style="width: 180px;">Name</th>
                          <th>Comments</th>
                          <th style="width: 130px; text-align: center;">Full Match</th>
                          <th style="width: 130px; text-align: center;">Partial Match</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(c, idx) in comments" :key="idx">
                          <td>{{ c.customer_id || c.user_id || c.id || (idx + 1) }}</td>
                          <td class="name-col">{{ c.name || c.username || 'Anonymous' }}</td>
                          <td class="comment-text-col">{{ c.comment || c.comment_text || c.text }}</td>
                          <td style="text-align: center;">
                            <label class="q-checkbox">
                              <input type="checkbox" v-model="c.full_match"
                                @change="c.full_match && (c.partial_match = false)" />
                              <span class="q-checkbox-box"></span>
                            </label>
                          </td>
                          <td style="text-align: center;">
                            <label class="q-checkbox">
                              <input type="checkbox" v-model="c.partial_match"
                                @change="c.partial_match && (c.full_match = false)" />
                              <span class="q-checkbox-box"></span>
                            </label>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p class="no-participants" v-else>No comments found for this post ID.</p>
                  </div>

                  <!-- Full/Partial Participants Lists -->
                  <div v-else-if="filteredParticipants.length" class="participants-table-list">
                    <div v-for="(p, idx) in filteredParticipants" :key="idx" class="participant-table-row">
                      <div class="p-info">
                        <span class="p-index">{{ idx + 1 }}</span>
                        <span class="p-name-bold">{{ p.name }}</span>
                        <span class="p-phone-light" v-if="p.mobile_number">({{ p.mobile_number }})</span>
                      </div>
                      <div class="p-points">
                        <span class="pts-badge participant-pts">{{ p.point || 0 }} Points</span>
                      </div>
                    </div>
                  </div>
                  <p class="no-participants" v-else-if="participantFilter !== 'comments'">
                    <template v-if="hasCalculated">
                      No participants found for this match type.
                    </template>
                    <template v-else>
                      Please calculate first.
                    </template>
                  </p>
                </template>
              </div>
            </div>
            <div v-else class="select-prompt">
              <p>No match selected for analysis.</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary mr-2" @click="$emit('close')">Cancel</button>
          <button class="btn btn-primary" :disabled="!selectedMatch || calculating" @click="handleCalculate">
            {{ calculating ? 'Calculating...' : 'Calculate' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import matchService from '../services/matchService';
import { normalizeCountry } from '../utils/countryNormalizer';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  matches: {
    type: Array,
    required: true,
  },
  initialMatch: {
    type: Object,
    default: null,
  },
  initialComments: {
    type: Array,
    default: () => []
  },
  initialAnalyzeData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'show-toast', 'refresh-matches']);

const selectedMatch = ref(null);
const participantFilter = ref('comments');
const resultDetails = ref({
  winner_name: '',
  winner_phone: '',
  winner_point: 0,
  correct_participants: [],
  partial_participants: []
});
const comments = ref([]);
const loadingResult = ref(false);
const loadingComments = ref(false);
const calculating = ref(false);
const hasCalculated = ref(false);

// Filter matches that have a non-empty post_id
const matchesWithPostId = computed(() => {
  return props.matches.filter(m => m.post_id && m.post_id.trim() !== '');
});

// Fetches result details from the backend endpoint defined in getresultServiceUrl config
const fetchResultDetails = async (postId) => {
  loadingResult.value = true;
  try {
    const config = useRuntimeConfig();
    const data = await matchService.getResult(postId, config.public.getresultServiceUrl);
    resultDetails.value = {
      winner_name: data.winner?.name || '',
      winner_phone: data.winner?.mobile_number || '',
      winner_point: data.winner?.points !== undefined ? data.winner.points : (data.winner?.point || 0),
      correct_participants: (data.correct_participants || []).map(p => ({
        ...p,
        point: p.points !== undefined ? p.points : (p.point || 0)
      })),
      partial_participants: (data.partial_participants || []).map(p => ({
        ...p,
        point: p.points !== undefined ? p.points : (p.point || 0)
      }))
    };
  } catch (e) {
    console.error('Failed to fetch result details', e);
    resultDetails.value = { winner_name: '', winner_phone: '', winner_point: 0, correct_participants: [], partial_participants: [] };
  } finally {
    loadingResult.value = false;
  }
};

const setCommentsFromProps = () => {
  if (props.initialComments && props.initialComments.length > 0) {
    const specialWinnerIds = new Set(
      (props.initialAnalyzeData?.special_winners || []).map(w => String(w.customer_id || w.commenter_id || w.user_id || w.id))
    );
    const partialWinnerIds = new Set(
      (props.initialAnalyzeData?.partial_winners || []).map(w => String(w.customer_id || w.commenter_id || w.user_id || w.id))
    );

    comments.value = props.initialComments.map(c => {
      const custId = String(c.customer_id || c.commenter_id || c.user_id || c.id);
      const isFull = specialWinnerIds.has(custId);
      const isPartial = partialWinnerIds.has(custId);

      return {
        ...c,
        customer_id: custId,
        name: c.name || c.customer_name || c.username || 'Anonymous',
        comment: c.comment || c.comment_text || c.text || '',
        full_match: isFull || !!c.full_match,
        partial_match: isPartial || !!c.partial_match,
        is_disabled: false
      };
    });
  } else {
    comments.value = [];
  }
};


// Handle Calculate action (old calculate logic hitting calcServiceUrl)
const handleCalculate = async () => {
  if (!selectedMatch.value) return;
  calculating.value = true;
  try {
    const match = selectedMatch.value;
    const requiredFields = ['stage', 'team1', 'team2', 'post_id', 'team_1_goal', 'team_2_goal', 'start_time', 'end_time'];
    const missing = requiredFields.filter(f => match[f] === null || match[f] === undefined || String(match[f]).trim() === '');
    if (missing.length) {
      throw new Error(`All fields must be filled. Missing: ${missing.join(', ')}`);
    }

    const g1 = parseInt(match.team_1_goal, 10) || 0;
    const g2 = parseInt(match.team_2_goal, 10) || 0;
    let pid = match.post_id;
    try {
      const parsed = parseInt(pid, 10);
      if (!isNaN(parsed)) pid = parsed;
    } catch (e) { }

    const partialMatchList = [];
    const fullMatchList = [];

    if (comments.value) {
      comments.value.forEach(c => {
        const custId = c.customer_id || c.user_id || c.id;
        const commentText = c.comment || c.comment_text || c.text || '';

        if (c.full_match) {
          fullMatchList.push({
            comment: commentText,
            customer_id: custId,
            points: 100
          });
        } else if (c.partial_match) {
          partialMatchList.push({
            comment: commentText,
            customer_id: custId,
            points: 1
          });
        }
      });
    }

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
      team_1_name: normalizeCountry(match.team1),
      team_1_goal: g1,
      team_2_name: normalizeCountry(match.team2),
      team_2_goal: g2,
      start_time: startTimeFormatted,
      end_time: endTimeFormatted,
      partial_match: partialMatchList,
      full_match: fullMatchList
    };

    console.log('Final payload before sending:', JSON.stringify(payload, null, 2));

    const config = useRuntimeConfig();
    await matchService.calculate(payload, config.public.calcServiceUrl);

    // Save to calculated matches
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('calculatedMatches');
        const list = stored ? JSON.parse(stored) : [];
        if (!list.includes(match.match_no)) {
          list.push(match.match_no);
          localStorage.setItem('calculatedMatches', JSON.stringify(list));
        }
      } catch (e) { }
    }

    emit('show-toast', { message: 'Calculated result successfully.', type: 'success' });
    emit('refresh-matches');

    // Refresh results data
    await fetchResultDetails(pid);
    hasCalculated.value = true;
    participantFilter.value = 'full'; // switch to winner view
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message || 'Failed to calculate match outcomes';
    emit('show-toast', { message: errorMsg, type: 'error' });
  } finally {
    calculating.value = false;
  }
};

const setResultsFromAnalyzeData = () => {
  if (props.initialAnalyzeData) {
    const pWinners = props.initialAnalyzeData.partial_winners || [];
    const sWinners = props.initialAnalyzeData.special_winners || [];

    // Pick top winner
    const topWinner = sWinners[0] || pWinners[0] || null;

    resultDetails.value = {
      winner_name: topWinner?.name || '',
      winner_phone: topWinner?.mobile_number || '',
      winner_point: topWinner?.points !== undefined ? topWinner.points : (topWinner?.point || 0),
      correct_participants: sWinners.map(p => ({
        name: p.name || p.customer_name || 'Anonymous',
        mobile_number: p.mobile_number || '',
        point: p.points !== undefined ? p.points : (p.point || 0)
      })),
      partial_participants: pWinners.map(p => ({
        name: p.name || p.customer_name || 'Anonymous',
        mobile_number: p.mobile_number || '',
        point: p.points !== undefined ? p.points : (p.point || 0)
      }))
    };
  } else {
    resultDetails.value = { winner_name: '', winner_phone: '', winner_point: 0, correct_participants: [], partial_participants: [] };
  }
};

watch(
  () => selectedMatch.value,
  (newVal) => {
    participantFilter.value = 'comments';
    hasCalculated.value = false;
    if (newVal) {
      if (props.initialAnalyzeData) {
        setResultsFromAnalyzeData();
      } else {
        fetchResultDetails(newVal.post_id);
      }
      setCommentsFromProps();
    } else {
      resultDetails.value = { winner_name: '', winner_phone: '', winner_point: 0, correct_participants: [], partial_participants: [] };
      comments.value = [];
    }
  }
);

watch(
  () => props.initialComments,
  () => {
    if (selectedMatch.value) {
      setCommentsFromProps();
    }
  },
  { deep: true }
);

watch(
  () => props.initialAnalyzeData,
  () => {
    if (selectedMatch.value) {
      setResultsFromAnalyzeData();
    }
  },
  { deep: true }
);

// Watch props.show to reset or set initial selection
watch(
  () => props.show,
  (newVal) => {
    participantFilter.value = 'comments';
    hasCalculated.value = false;
    if (newVal) {
      if (props.initialMatch && props.initialMatch.post_id && props.initialMatch.post_id.trim() !== '') {
        selectedMatch.value = props.initialMatch;
      } else if (matchesWithPostId.value.length) {
        selectedMatch.value = matchesWithPostId.value[0];
      }
    } else {
      selectedMatch.value = null;
      resultDetails.value = { winner_name: '', winner_phone: '', winner_point: 0, correct_participants: [], partial_participants: [] };
      comments.value = [];
    }
  },
  { immediate: true }
);

// Filter participants by match type (Full Match vs Partial Match)
const filteredParticipants = computed(() => {
  if (participantFilter.value === 'full') {
    return resultDetails.value.correct_participants || [];
  } else {
    return resultDetails.value.partial_participants || [];
  }
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
  max-width: 1150px;
  height: 85vh;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  color: #1e293b;
  max-height: 90vh;
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
  margin-bottom: 0;
  overflow-y: auto;
  flex-grow: 1;
}

/* Results grid layout */
.results-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  height: 100%;
}

.post-id-sidebar {
  border-right: 1px solid #e2e8f0;
  padding-right: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.description {
  display: block;
  font-size: 0.9rem;
  font-weight: 400;
  margin-top: 0.3rem;
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
  max-height: 60vh;
  padding-right: 4px;
}

.post-list::-webkit-scrollbar {
  width: 6px;
}

.post-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.post-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.post-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
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

/* Detail Area styles */
.results-detail-area {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.match-detail-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.match-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-meta h4 {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.clear-calc-btn {
  font-size: 0.8rem !important;
  padding: 6px 12px !important;
  background: #ef4444 !important;
  color: #ffffff !important;
  border: none !important;
  transition: background 0.2s ease;
}

.clear-calc-btn:hover {
  background: #dc2626 !important;
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

.participants-section {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}

.participants-table-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 380px;
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

.mr-2 {
  margin-right: 8px;
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

.btn-primary {
  background: #1976d2;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Tab buttons styling */
.results-tabs {
  display: flex;
  gap: 12px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 16px;
}

.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: #1e293b;
}

.tab-btn.active {
  color: #1976d2;
  border-bottom-color: #1976d2;
}

/* Comments Table Styling */
.comments-table-wrapper {
  overflow-y: auto;
  max-height: 380px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px;
}

.q-comments-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
}

.q-comments-table th {
  background: #f8fafc;
  padding: 12px 10px;
  font-weight: 700;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.q-comments-table td {
  padding: 10px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.q-comments-table tbody tr:hover {
  background: #f8fafc;
}

.name-col {
  font-weight: 600;
}

.comment-text-col {
  color: #475569;
  word-break: break-all;
}

/* Quasar-like Checkbox Styling */
.q-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
}

.q-checkbox input {
  display: none;
}

.q-checkbox-box {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: #ffffff;
  position: relative;
}

.q-checkbox input:checked+.q-checkbox-box {
  background: #1976d2;
  border-color: #1976d2;
}

.q-checkbox:has(input:disabled) {
  cursor: not-allowed;
}

.q-checkbox input:disabled+.q-checkbox-box {
  background: #f1f5f9;
  border-color: #cbd5e1;
  cursor: not-allowed;
}

.q-checkbox input:disabled:checked+.q-checkbox-box {
  background: #94a3b8;
  border-color: #94a3b8;
}

.q-checkbox-box::after {
  content: '';
  width: 4px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.2s;
  margin-bottom: 2px;
}

.q-checkbox input:checked+.q-checkbox-box::after {
  transform: rotate(45deg) scale(1);
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

/* Quasar-like Confirm Dialog Styling */
.confirm-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.confirm-dialog-container {
  background: #ffffff;
  border-radius: 4px;
  width: 90%;
  max-width: 400px;
  padding: 24px;
  box-shadow: 0 11px 15px -7px rgba(0, 0, 0, 0.2), 0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12);
  color: #1e293b;
  animation: dialogScaleIn 0.15s cubic-bezier(0.1, 0.8, 0.25, 1);
}

.confirm-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.confirm-dialog-header h4 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.warning-icon {
  font-size: 1.4rem;
}

.confirm-dialog-body p {
  margin: 0 0 24px 0;
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.5;
}

.confirm-dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.btn-danger:hover {
  background: #dc2626;
}

@keyframes dialogScaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
