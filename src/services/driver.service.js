import api from './api';

/**
 * Driver Operations & Fleet Management Service
 * Manages driver vehicle specs, availability state, telemetry, and trip workflows
 */
export const driverService = {
  /**
   * Fetch current authenticated driver profile and vehicle details
   */
  async getDriverProfile() {
    const response = await api.get('/api/v1/drivers/me');
    return response.data?.driver || response.data;
  },

  /**
   * Update online/offline availability and spatial coordinates
   * @param {Object} payload { is_online, current_latitude, current_longitude }
   */
  async updateStatus(payload) {
    const response = await api.patch('/api/v1/drivers/status', payload);
    return response.data;
  },

  /**
   * Register a new driver profile and vehicle
   * @param {Object} payload { license_number, make, model, plate_number, color, vehicle_category }
   */
  async registerDriver(payload) {
    const response = await api.post('/api/v1/drivers/register', payload);
    return response.data;
  },

  /**
   * Fetch earnings ledger, completed trip counts, and commission payouts
   */
  async getEarnings() {
    const response = await api.get('/api/v1/drivers/earnings');
    return response.data;
  },

  /**
   * Accept an incoming ride opportunity
   * @param {string} rideId
   */
  async acceptRide(rideId) {
    const response = await api.post(`/api/v1/rides/${rideId}/accept`);
    return response.data?.ride || response.data;
  },

  /**
   * Notify system and passenger that driver has arrived at pickup location
   * @param {string} rideId
   */
  async markArrived(rideId) {
    const response = await api.post(`/api/v1/rides/${rideId}/arrive`);
    return response.data?.ride || response.data;
  },

  /**
   * Verify passenger's 4-digit OTP and start the journey
   * @param {string} rideId
   * @param {string} otpCode
   */
  async startRide(rideId, otpCode) {
    const response = await api.post(`/api/v1/rides/${rideId}/start`, { otp_code: otpCode });
    return response.data?.ride || response.data;
  },

  /**
   * Complete trip at final destination and generate final fare settlement
   * @param {string} rideId
   */
  async completeRide(rideId) {
    const response = await api.post(`/api/v1/rides/${rideId}/complete`);
    return response.data?.ride || response.data;
  },

  /**
   * Admin: Fetch paginated list of drivers awaiting verification
   * @param {Object} params { page, limit, search }
   */
  async getPendingDrivers(params = {}) {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.search && params.search.trim()) cleanParams.search = params.search.trim();

    const response = await api.get('/api/v1/drivers/pending', { params: cleanParams });
    return {
      drivers: response.data?.drivers || [],
      meta: response.meta || { page: 1, limit: 10, total: 0, total_pages: 1 },
      message: response.message,
    };
  },

  /**
   * Admin: Fetch all drivers with verification filter, search, and pagination
   * @param {Object} params { is_verified, page, limit, search }
   */
  async getAllDrivers(params = {}) {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
    if (params.is_verified !== undefined && params.is_verified !== 'all' && params.is_verified !== '') {
      cleanParams.is_verified = params.is_verified;
    }

    const response = await api.get('/api/v1/drivers', { params: cleanParams });
    return {
      drivers: response.data?.drivers || [],
      meta: response.meta || { page: 1, limit: 10, total: 0, total_pages: 1 },
      message: response.message,
    };
  },

  /**
   * Admin: Fetch complete driver and vehicle inspection profile
   * Accepts either driver_id or user_id
   * @param {string} id
   */
  async getDriverDetails(id) {
    const response = await api.get(`/api/v1/drivers/${id}`);
    return response.data;
  },

  /**
   * Admin: Update driver verification status (approve or revoke)
   * Accepts either driver_id or user_id
   * @param {string} id
   * @param {boolean} isVerified
   */
  async verifyDriver(id, isVerified = true) {
    const response = await api.patch(`/api/v1/drivers/${id}/verify`, {
      is_verified: isVerified,
    });
    return response.data;
  },
};

export default driverService;

