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
  },

  /**
   * Post to calculate endpoint.
   * POST /calculate
   */
  async calculate(payload, baseUrl) {
    if (baseUrl) {
      const response = await axios.post(baseUrl, payload);
      return response.data;
    }
    const response = await apiClient.post('/calculate', payload);
    return response.data;
  },

  /**
   * Fetch result details by post ID.
   * GET /getresult
   */
  async getResult(postId, baseUrl) {
    if (baseUrl) {
      const response = await axios.get(baseUrl, {
        params: { post_id: postId }
      });
      return response.data;
    }
    const response = await apiClient.get('/winners', {
      params: { post_id: postId }
    });
    return response.data;
  },

  /**
   * Fetch comments details by post ID.
   * GET /comments
   */
  async getComments(postId, baseUrl) {
    if (baseUrl) {
      const response = await axios.get(baseUrl, {
        params: { post_id: postId }
      });
      return response.data;
    }
    const response = await apiClient.get('/comments', {
      params: { post_id: postId }
    });
    return response.data;
  },

  /**
   * Post to analyze endpoint.
   * POST /analyze
   */
  async analyze(payload, baseUrl) {
    if (baseUrl) {
      const response = await axios.post(baseUrl, payload);
      return response.data;
    }
    const response = await apiClient.post('/analyze', payload);
    return response.data;
  },

  /**
   * Clear calculation entry by post ID.
   * POST /clear-calculation/{post_id}
   */
  async clearCalculation(postId, baseUrl) {
    if (baseUrl) {
      const response = await axios.post(`${baseUrl}/${postId}`);
      return response.data;
    }
    const response = await apiClient.post(`/clear-calculation/${postId}`);
    return response.data;
  },

  /**
   * Update match status for a comment (full_match/partial_match).
   * POST /comments/update
   */
  async updateCommentStatus(postId, commentData) {
    const response = await apiClient.post(`/comments/update`, {
      post_id: postId,
      customer_id: commentData.customer_id || commentData.user_id || commentData.id,
      full_match: commentData.full_match,
      partial_match: commentData.partial_match
    });
    return response.data;
  }
};

