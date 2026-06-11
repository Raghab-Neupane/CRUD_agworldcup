import axios from 'axios';

const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setApiBaseUrl = (url) => {
  apiClient.defaults.baseURL = url;
};

export default {
  /**
   * Fetch all matches.
   * GET /matches
   */
  async getMatches() {
    const response = await apiClient.get('/matches');
    return response.data;
  },

  /**
   * Add a match.
   * POST /matches
   * @param {Object} matchData { match_no, stage, team1, team2, status }
   */
  async addMatch(matchData) {
    const response = await apiClient.post('/matches', matchData);
    return response.data;
  },

  /**
   * Update the status of a match.
   * PUT /matches/{match_no}/status
   * @param {number|string} matchNo
   * @param {string} status ('upcoming', 'live', 'completed')
   */
  async updateMatchStatus(matchNo, status) {
    const response = await apiClient.put(`/matches/${matchNo}/status`, { status });
    return response.data;
  },

  /**
   * Update the result of a match.
   * PUT /matches/{match_no}/result
   * @param {number|string} matchNo
   * @param {string} result ('TEAM1', 'TEAM2', 'DRAW')
   */
  async updateMatchResult(matchNo, result) {
    const response = await apiClient.put(`/matches/${matchNo}/result`, { result });
    return response.data;
  },

  /**
   * Delete a match by its number.
   * DELETE /matches/{match_no}
   * @param {number|string} matchNo
   */
  async deleteMatch(matchNo) {
    const response = await apiClient.delete(`/matches/${matchNo}`);
    return response.data;
  },

  /**
   * Update all details of a match.
   * PUT /matches/{match_no}
   * @param {number|string} matchNo
   * @param {Object} matchData
   */
  async updateMatch(matchNo, matchData) {
    const response = await apiClient.put(`/matches/${matchNo}`, matchData);
    return response.data;
  },

  /**
   * Get the selected match.
   * GET /matches/selectedmatch/{match_no}
   */
  async getSelectedMatch() {
    const response = await apiClient.get(`/matches/selectedmatch`);
    return response.data;
  },

  /**
   * Set a match as selected and optionally update winner/phone.
   * PATCH /matches/selectedmatch/{match_no}
   */
  async updateSelectedMatch(matchNo, payload) {
    const response = await apiClient.patch(`/matches/selectedmatch/${matchNo}`, payload);
    return response.data;
  }
};

