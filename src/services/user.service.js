import api from './api';

/**
 * User & Emergency Contact Service
 * Communicates with /api/v1/users endpoints
 */
export const userService = {
  /**
   * Fetch current authenticated user's profile
   */
  async getMe() {
    const response = await api.get('/api/v1/users/me');
    return response.data; // user object
  },

  /**
   * Update current user's profile
   * @param {Object} updates { full_name, phone_number, avatar_url }
   */
  async updateMe(updates) {
    const response = await api.patch('/api/v1/users/me', updates);
    return response.data; // updated user
  },

  /**
   * Fetch list of emergency contacts registered by user
   */
  async getEmergencyContacts() {
    const response = await api.get('/api/v1/users/emergency-contacts');
    return response.data?.contacts || [];
  },

  /**
   * Register a new emergency contact for SOS alerts
   * @param {Object} contact { contact_name, phone_number, relationship }
   */
  async addEmergencyContact(contact) {
    const response = await api.post('/api/v1/users/emergency-contacts', contact);
    return response.data;
  },

  /**
   * Remove an emergency contact
   * @param {string} contactId
   */
  async deleteEmergencyContact(contactId) {
    const response = await api.delete(`/api/v1/users/emergency-contacts/${contactId}`);
    return response;
  },
};

export default userService;
