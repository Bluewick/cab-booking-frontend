import api from './api';

/**
 * Customer Support & Dispute Desk Service
 * Connects with support ticket creation, retrieval, and administrative resolution endpoints
 */
export const supportService = {
  /**
   * Submit a new customer support ticket
   * POST /api/v1/support
   * @param {Object} payload { ride_id, category, subject, description }
   */
  async createTicket(payload) {
    const response = await api.post('/api/v1/support', payload);
    return response.data;
  },

  /**
   * Fetch current user's submitted support tickets
   * GET /api/v1/support/my
   */
  async getMyTickets() {
    const response = await api.get('/api/v1/support/my');
    return response.data?.tickets || [];
  },

  /**
   * Fetch all tickets for administrative triage
   * Attempts GET /api/v1/support, falls back to GET /api/v1/support/my
   */
  async getAllTickets() {
    try {
      const response = await api.get('/api/v1/support');
      return response.data?.tickets || response.data || [];
    } catch {
      const response = await api.get('/api/v1/support/my');
      return response.data?.tickets || [];
    }
  },

  /**
   * Fetch individual support ticket details
   * GET /api/v1/support/:id
   * @param {string} ticketId
   */
  async getTicketById(ticketId) {
    const response = await api.get(`/api/v1/support/${ticketId}`);
    return response.data;
  },

  /**
   * Update support ticket status and administrative response
   * PATCH /api/v1/support/:id
   * @param {string} ticketId
   * @param {Object} updateData { status: 'resolved' | 'in_progress' | 'closed', admin_response: string }
   */
  async updateTicket(ticketId, updateData) {
    const response = await api.patch(`/api/v1/support/${ticketId}`, updateData);
    return response.data;
  },
};

export default supportService;
