<template>
  <div class="quasar-table-container">
    <!-- Top Table Header with Search & Stage Filters -->
    <div class="table-top-bar">
      <div class="search-inputs">
        <div class="q-input-wrapper">
          <input v-model="searchTerm" type="text" placeholder="Search by team..." class="q-input" />
        </div>
        <div class="q-input-wrapper">
          <span class="q-search-icon">#</span>
          <input v-model="searchMatchNo" type="text" placeholder="Match No..." class="q-input match-no-input" />
        </div>
      </div>
      <div class="filter-actions">
        <button class="q-btn-sort" @click="toggleSortOrder" title="Sort by match number">
          Sort Match No:
          <span class="sort-dir">{{ sortOrder === 'asc' ? '▲ Asc' : '▼ Desc' }}</span>
        </button>
      </div>
    </div>

    <!-- Tabulation Table -->
    <div class="q-table-wrapper">
      <table class="q-table">
        <thead>
          <tr>
            <th class="text-left sortable-header" style=" user-select: none;">
              Match No
            </th>
            <th class="text-left">Stage</th>
            <th class="text-left">Team 1</th>
            <th class="text-left">Team 2</th>

            <th class="text-left">Post ID</th>
            <th class="text-left">Team 1 Goal</th>
            <th class="text-left">Team 2 Goal</th>
            <th class="text-left">Start Time</th>
            <th class="text-left">Match End Time</th>
            <th class="text-left">Select</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="match in paginatedMatches" :key="match.match_no" class="q-tr"
            :class="{ 'row-editing': editingMatchNo === match.match_no }">
            <td class="text-left text-bold text-primary">#{{ match.match_no }}</td>

            <!-- Stage column -->
            <td class="text-left">
              <input v-if="editingMatchNo === match.match_no" v-model="editForm.stage" type="text" class="q-edit-input"
                required />
              <span v-else class="q-badge-stage">{{ match.stage }}</span>
            </td>

            <!-- Team 1 column -->
            <td class="text-left text-bold dropdown-container">
              <template v-if="editingMatchNo === match.match_no">
                <input v-model="editForm.team1" @focus="focusTeam1 = true" @blur="onBlurTeam1" type="text" class="q-edit-input" required autocomplete="off" />
                <ul class="q-menu" v-if="focusTeam1 && filteredTeam1.length">
                  <li v-for="c in filteredTeam1" :key="c" @mousedown="selectTeam1(c)">{{ c }}</li>
                </ul>
              </template>
              <span v-else>{{ match.team1 }}</span>
            </td>

            <!-- Team 2 column -->
            <td class="text-left text-bold dropdown-container">
              <template v-if="editingMatchNo === match.match_no">
                <input v-model="editForm.team2" @focus="focusTeam2 = true" @blur="onBlurTeam2" type="text" class="q-edit-input" required autocomplete="off" />
                <ul class="q-menu" v-if="focusTeam2 && filteredTeam2.length">
                  <li v-for="c in filteredTeam2" :key="c" @mousedown="selectTeam2(c)">{{ c }}</li>
                </ul>
              </template>
              <span v-else>{{ match.team2 }}</span>
            </td>

            <!-- Result column -->


            <!-- Post ID column -->
            <td class="text-left">
              <input v-if="editingMatchNo === match.match_no" v-model="editForm.post_id" type="text" class="q-edit-input" style="max-width: 100px;" />
              <span v-else>{{ match.post_id || '-' }}</span>
            </td>

            <!-- Team 1 Goal column -->
            <td class="text-left">
              <input v-if="editingMatchNo === match.match_no" v-model="editForm.team_1_goal" type="number" min="0" class="q-edit-input" style="max-width: 80px;" placeholder="e.g. 3" />
              <span v-else>{{ match.team_1_goal !== null && match.team_1_goal !== undefined ? match.team_1_goal : '-' }}</span>
            </td>
            
            <!-- Team 2 Goal column -->
            <td class="text-left">
              <input v-if="editingMatchNo === match.match_no" v-model="editForm.team_2_goal" type="number" min="0" class="q-edit-input" style="max-width: 80px;" placeholder="e.g. 1" />
              <span v-else>{{ match.team_2_goal !== null && match.team_2_goal !== undefined ? match.team_2_goal : '-' }}</span>
            </td>

            <!-- Start Time column -->
            <td class="text-left">
              <input v-if="editingMatchNo === match.match_no" v-model="editForm.start_time" type="datetime-local" class="q-edit-input" style="max-width: 180px;" />
              <span v-else>{{ match.start_time || '-' }}</span>
            </td>

            <!-- Match End Time column -->
            <td class="text-left">
              <input v-if="editingMatchNo === match.match_no" v-model="editForm.end_time" type="datetime-local" class="q-edit-input" style="max-width: 180px;" />
              <span v-else>{{ match.end_time || '-' }}</span>
            </td>

            <!-- Select toggle column -->
            <td class="text-center">
              <div :class="['select-toggle-switch', { checked: selectedMatchId === match.match_no }]" @click="toggleSelect(match)"></div>
            </td>
            <td class="text-right actions-cell">
              <div v-if="editingMatchNo === match.match_no" class="actions-group">
                <button class="q-btn-save-row" @click="saveRow(match)">Save</button>
                <button class="q-btn-cancel-row" @click="cancelEditing">Cancel</button>
              </div>
              <div v-else class="actions-group">
                <button class="q-btn-calculate" @click="$emit('calculate-match', match)">Calculate</button>
                <button class="q-btn-edit-row" @click="startEditing(match)">Edit</button>
                <button class="q-btn-delete" @click="$emit('request-delete', match.match_no)">Delete</button>
              </div>
            </td>
          </tr>
          <!-- Empty State -->
          <tr v-if="filteredMatches.length === 0">
            <td colspan="12" class="empty-row">
              <div class="empty-box">
                <p>No match records found matching the criteria.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div class="q-table-footer" v-if="filteredMatches.length > 0">
      <div class="footer-info">
        Showing {{ rangeStart }} - {{ rangeEnd }} of {{ filteredMatches.length }} matches
      </div>
      <div class="footer-pagination">
        <select v-model="itemsPerPage" class="q-per-page">
          <option :value="5">5 per page</option>
          <option :value="10">10 per page</option>
          <option :value="20">20 per page</option>
          <option :value="50">50 per page</option>
        </select>

        <div class="page-buttons">
          <button class="q-page-btn" :disabled="currentPage === 1" @click="currentPage = 1">«</button>
          <button class="q-page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
          <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="q-page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
          <button class="q-page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import matchService from '../services/matchService';
import countries from '../data/countries.json';


const props = defineProps({
  matches: {
    type: Array,
    required: true,
  },
  activeStatusFilter: {
    type: String,
    default: 'all',
  }
});

const emit = defineEmits(['request-delete', 'update-status', 'update-match', 'calculate-match', 'show-toast']);

// New state for selected match toggle
const selectedMatchId = ref(null);

watch(() => props.matches, (newMatches) => {
  const selected = newMatches.find(m => m.is_selected);
  if (selected) {
    selectedMatchId.value = selected.match_no;
  }
}, { immediate: true, deep: true });

const toggleSelect = async (match) => {
  // Allow toggling selection regardless of winner status
  if (selectedMatchId.value === match.match_no) {
    // Deselect current match
    selectedMatchId.value = null;
    try {
      await matchService.updateSelectedMatch(match.match_no, { winner: null, phone: null });
      emit('show-toast', { message: `Deselected Match #${match.match_no}.`, type: 'info' });
    } catch (e) {
      console.error('Failed to deselect match', e);
    }
  } else {
    // Select new match
    selectedMatchId.value = match.match_no;
    try {
      await matchService.updateSelectedMatch(match.match_no, { winner: match.winner, phone: match.phone });
      emit('show-toast', { message: `Selected Match #${match.match_no} as active match!`, type: 'success' });
    } catch (e) {
      console.error('Failed to update selected match', e);
    }
  }
};

// Search & Filter State
const searchTerm = ref('');
const searchMatchNo = ref('');
const sortOrder = ref('asc');

// Pagination State
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Inline Editing Row State
const editingMatchNo = ref(null);
const editForm = ref({
  stage: '',
  team1: '',
  team2: '',
  phone: '',
  winner: '',
  post_id: '',
  team_1_goal: '',
  team_2_goal: '',
  start_time: '',
  end_time: '',
  participants: ''
});

// Dropdown states for inline editing
const focusTeam1 = ref(false);
const focusTeam2 = ref(false);

const filteredTeam1 = computed(() => {
  const query = (editForm.value.team1 || '').toLowerCase();
  return countries.filter(c => c.toLowerCase().includes(query));
});

const filteredTeam2 = computed(() => {
  const query = (editForm.value.team2 || '').toLowerCase();
  return countries.filter(c => c.toLowerCase().includes(query));
});

const onBlurTeam1 = () => {
  setTimeout(() => { focusTeam1.value = false; }, 150);
};

const onBlurTeam2 = () => {
  setTimeout(() => { focusTeam2.value = false; }, 150);
};

const selectTeam1 = (c) => {
  editForm.value.team1 = c;
  focusTeam1.value = false;
};

const selectTeam2 = (c) => {
  editForm.value.team2 = c;
  focusTeam2.value = false;
};



// Watch and reset pagination to page 1 on search filter updates
watch(
  [searchTerm, searchMatchNo, sortOrder, itemsPerPage, () => props.matches, () => props.activeStatusFilter],
  () => {
    currentPage.value = 1;
  }
);

// Filtering & sorting logic
const filteredMatches = computed(() => {
  let list = [...props.matches];

  // 1. Filter by active status filter pill
  if (props.activeStatusFilter !== 'all') {
    list = list.filter((m) => m.status === props.activeStatusFilter);
  }

  // 2. Search by team name
  if (searchTerm.value.trim()) {
    const q = searchTerm.value.toLowerCase().trim();
    list = list.filter(
      (m) =>
        (m.team1 && m.team1.toLowerCase().includes(q)) ||
        (m.team2 && m.team2.toLowerCase().includes(q))
    );
  }

  // 3. Search by match number
  if (searchMatchNo.value.trim()) {
    const q = searchMatchNo.value.trim();
    list = list.filter((m) => String(m.match_no).includes(q));
  }


  // 5. Sort by match number
  list.sort((a, b) => {
    const noA = parseInt(a.match_no, 10) || 0;
    const noB = parseInt(b.match_no, 10) || 0;
    return sortOrder.value === 'asc' ? noA - noB : noB - noA;
  });

  return list;
});

// Pagination calculations
const totalPages = computed(() => {
  return Math.ceil(filteredMatches.value.length / itemsPerPage.value) || 1;
});

const paginatedMatches = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredMatches.value.slice(start, end);
});

const rangeStart = computed(() => {
  if (filteredMatches.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

const rangeEnd = computed(() => {
  const end = currentPage.value * itemsPerPage.value;
  return end > filteredMatches.value.length ? filteredMatches.value.length : end;
});

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

const onStatusChange = (matchNo, status) => {
  emit('update-status', { matchNo, status });
};

const getTeam1Goal = (goalDiff) => {
  if (!goalDiff || !goalDiff.includes('-')) return '-';
  return goalDiff.split('-')[0];
};

const getTeam2Goal = (goalDiff) => {
  if (!goalDiff || !goalDiff.includes('-')) return '-';
  return goalDiff.split('-')[1];
};

// Editing row handlers
const startEditing = (match) => {
  editingMatchNo.value = match.match_no;
  const parts = (match.goal_difference || '').split('-');
  const g1 = parts[0] !== undefined ? parts[0] : '';
  const g2 = parts[1] !== undefined ? parts[1] : '';
  editForm.value = {
    stage: match.stage,
    team1: match.team1,
    team2: match.team2,
    phone: match.phone || match.phone_number || '',
    winner: match.winner || '',
    post_id: match.post_id || '',
    team_1_goal: g1,
    team_2_goal: g2,
    start_time: match.start_time ? match.start_time.replace(' ', 'T').slice(0, 16) : '',
    end_time: match.end_time ? match.end_time.replace(' ', 'T').slice(0, 16) : '',
    // Maps the comma-separated participants list for the match editor state
    participants: match.participants || ''
  };
};

const cancelEditing = () => {
  editingMatchNo.value = null;
};

const saveRow = (match) => {
  // Check if team1 and team2 are valid countries
  if (!countries.includes(editForm.value.team1) || !countries.includes(editForm.value.team2)) {
    alert("Both teams must be valid countries from the suggestions.");
    return;
  }
  if (editForm.value.team1.trim().toLowerCase() === editForm.value.team2.trim().toLowerCase()) {
    alert("Team 1 and Team 2 must be different.");
    return;
  }

  let goal_difference = null;
  if (editForm.value.team_1_goal !== '' && editForm.value.team_2_goal !== '') {
    goal_difference = `${editForm.value.team_1_goal}-${editForm.value.team_2_goal}`;
  } else if (editForm.value.team_1_goal !== '' || editForm.value.team_2_goal !== '') {
    goal_difference = `${editForm.value.team_1_goal}-${editForm.value.team_2_goal}`;
  }

  emit('update-match', {
    matchNo: match.match_no,
    updatedData: {
      match_no: match.match_no,
      status: match.status,
      stage: editForm.value.stage,
      team1: editForm.value.team1,
      team2: editForm.value.team2,
      phone: editForm.value.phone,
      winner: editForm.value.winner,
      post_id: editForm.value.post_id,
      team_1_goal: editForm.value.team_1_goal,
      team_2_goal: editForm.value.team_2_goal,
      start_time: editForm.value.start_time ? editForm.value.start_time.replace('T', ' ') : '',
      end_time: editForm.value.end_time ? editForm.value.end_time.replace('T', ' ') : '',
      participants: editForm.value.participants
    }
  });
  editingMatchNo.value = null;
};
</script>

<style scoped>
.quasar-table-container {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* Table Controls Top Bar */
.table-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #ffffff;
  gap: 8px;
  flex-wrap: wrap;
}

.search-inputs {
  display: flex;
  gap: 12px;
}

.q-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.q-input {
  background: #ffffff;
  border: 1px solid #bdbdbd;
  color: #212121;
  padding: 8px 12px 8px 30px;
  border-radius: 4px;
  font-size: 0.88rem;
  width: 200px;
  outline: none;
  transition: border-color 0.2s;
}

.q-input:focus {
  border-color: #1976d2;
}

.match-no-input {
  width: 110px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.q-select {
  background: #ffffff;
  border: 1px solid #bdbdbd;
  color: #212121;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.88rem;
  outline: none;
  cursor: pointer;
  min-width: 140px;
}

.q-select:focus {
  border-color: #1976d2;
}

.q-btn-sort {
  background: #ffffff;
  color: #424242;
  border: 1px solid #bdbdbd;
  padding: 8px 14px;
  border-radius: 4px;
  font-size: 0.88rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
}

.q-btn-sort:hover {
  background: #f5f5f5;
}

.sort-dir {
  color: #1976d2;
  font-weight: 700;
}

/* Quasar Styled Table - Expanded Spacing */
.q-table-wrapper {
  overflow: visible;
}

.q-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.q-table th {
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #616161;
  border-bottom: 2px solid #e0e0e0;
  background: #fdfdfd;
  letter-spacing: 0.05em;
}

.q-table td {
  padding: 10px 12px;
  font-size: 0.85rem;
  color: #212121;
  border-bottom: 1px solid #eeeeee;
  background: #ffffff;
  vertical-align: middle;
}

.q-tr:hover td {
  background: #fcfcfc;
}

.q-tr.row-editing td {
  background: #fafafa;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.text-bold {
  font-weight: 600;
}

.text-primary {
  color: #1976d2;
}

.text-grey {
  color: #9e9e9e;
}

.q-badge-stage {
  background: #e3f2fd;
  color: #1976d2;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Inline Edit Text Inputs */
.dropdown-container {
  position: relative;
}

.q-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  padding: 8px 0;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 2000;
  min-width: 140px;
}

.q-menu li {
  padding: 10px 16px;
  font-size: 0.85rem;
  color: #1e293b;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.q-menu li:hover {
  background: #f1f5f9;
}

.q-edit-input {
  background: #ffffff;
  border: 1px solid #bdbdbd;
  color: #212121;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  width: 100%;
  max-width: 130px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.q-edit-input:focus {
  border-color: #1976d2;
}

/* Inline Dropdown Selectors */
.q-table-select {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #212121;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.q-table-select:focus {
  border-color: #1976d2;
}

.q-table-select.status-upcoming {
  border-color: #9e9e9e;
  background: #fafafa;
  color: #616161;
}

.q-table-select.status-live {
  border-color: #d32f2f;
  background: rgba(211, 47, 47, 0.04);
  color: #d32f2f;
  font-weight: 600;
}

.result-select {
  width: 100%;
  min-width: 160px;
  max-width: 160px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

/* Slider toggle style */
.select-toggle-switch {
  width: 40px;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  display: inline-block;
}

.select-toggle-switch.checked {
  background: #1976d2;
}

.select-toggle-switch::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  top: 1px;
  left: 1px;
  transition: transform 0.2s;
}

.select-toggle-switch.checked::before {
  transform: translateX(20px);
}

.q-table-select.status-completed {
  border-color: #2e7d32;
  background: rgba(46, 125, 50, 0.04);
  color: #2e7d32;
}

.q-winner-name {
  background: rgba(46, 125, 50, 0.08);
  color: #2e7d32;
  border: 1px solid rgba(46, 125, 50, 0.2);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  display: inline-block;
}

/* Actions Cell & Groups spacing */
.actions-cell {
  min-width: 220px;
}

.actions-group {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

/* Button styling */
.q-btn-show {
  background: #2e7d32;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.q-btn-show:hover {
  background: #1b5e20;
}

.q-btn-edit-row {
  background: #0288d1;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.q-btn-edit-row:hover {
  background: #01579b;
}

.q-btn-calculate {
  background: #2e7d32;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.q-btn-calculate:hover {
  background: #1b5e20;
}

.q-btn-save-row {
  background: #1976d2;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.q-btn-save-row:hover {
  background: #1565c0;
}

.q-btn-cancel-row {
  background: #ffffff;
  border: 1px solid #bdbdbd;
  color: #616161;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.q-btn-cancel-row:hover {
  background: #eeeeee;
}

.q-btn-delete {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  color: #d32f2f;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.q-btn-delete:hover {
  background: #ffebee;
  border-color: #ffcdd2;
}

.empty-row {
  padding: 40px 0;
  text-align: center;
}

.empty-box {
  color: #757575;
  font-size: 0.9rem;
}

/* Pagination Footer */
.q-table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #e0e0e0;
  background: #ffffff;
  flex-wrap: wrap;
  gap: 8px;
}

.footer-info {
  font-size: 0.8rem;
  color: #757575;
}

.footer-pagination {
  display: flex;
  align-items: center;
  gap: 16px;
}

.q-per-page {
  background: #ffffff;
  border: 1px solid #bdbdbd;
  color: #424242;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  outline: none;
  cursor: pointer;
}

.page-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.q-page-btn {
  background: #ffffff;
  border: 1px solid #bdbdbd;
  color: #424242;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.78rem;
  transition: all 0.2s;
}

.q-page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.q-page-btn:not(:disabled):hover {
  background: #f5f5f5;
  border-color: #757575;
}

.page-indicator {
  font-size: 0.8rem;
  color: #757575;
  padding: 0 4px;
}
@media (max-width: 600px) {
  .table-top-bar, .q-table-footer {
    padding: 6px 8px;
    gap: 6px;
  }
  .q-table th, .q-table td {
    padding: 6px 8px;
    font-size: 0.75rem;
  }
  .q-input, .q-select, .q-per-page {
    width: 100%;
    max-width: 150px;
  }
}
</style>
