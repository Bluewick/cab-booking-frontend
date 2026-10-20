import api from './api';

/**
 * Authentication Service
 * Communicates with /api/v1/auth endpoints
 */
export const authService = {
  /**
   * Register a new user (rider or driver)
   * @param {Object} payload { email, password, full_name, phone_number, role }
   */
  async register(payload) {
    const response = await api.post('/api/v1/auth/register', payload);
    return response.data; // { user, token }
  },

  /**
   * Login with email and password
   * @param {Object} credentials { email, password }
   */
  async login(credentials) {
    const response = await api.post('/api/v1/auth/login', credentials);
    return response.data; // { user, token }
  },

  /**
   * Synchronize a Clerk authenticated user with the backend database
   * @param {Object} clerkUser { clerk_id, email, full_name, phone_number, avatar_url, role }
   */
  async syncClerk(clerkUser) {
    const response = await api.post('/api/v1/auth/sync-clerk', clerkUser);
    return response.data; // { user, token }
  },
};

export default authService;
