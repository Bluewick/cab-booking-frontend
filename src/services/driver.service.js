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
};

export default driverService;
