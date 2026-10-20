import api from './api';

/**
 * Ride Management & Dispatch Service
 * Handles ride requests, real-time lifecycle inspections, and cancellations
 */
export const rideService = {
  /**
   * Request a new ride with pickup, stops, dropoff, vehicle category, and optional promo code
   * @param {Object} payload
   */
  async requestRide(payload) {
    const response = await api.post('/api/v1/rides/request', payload);
    return response.data; // { ride, nearby_drivers_count, dispatch_candidates }
  },

  /**
   * Fetch complete ride details by ID (including driver, vehicle, and route waypoints)
   * @param {string} rideId
   */
  async getRideById(rideId) {
    const response = await api.get(`/api/v1/rides/${rideId}`);
    return response.data?.ride || response.data;
  },

  /**
   * Cancel an active ride request or assigned trip
   * @param {string} rideId
   * @param {string} reason
   */
  async cancelRide(rideId, reason = 'User opted to cancel') {
    const response = await api.post(`/api/v1/rides/${rideId}/cancel`, { reason });
    return response.data;
  },

  /**
   * Retrieve historical trips with pagination
   * @param {Object} params { page, limit }
   */
  async getRideHistory(params = { page: 1, limit: 10 }) {
    const response = await api.get('/api/v1/rides/history', { params });
    return response.data; // { rides, total, page, limit }
  },

  /**
   * Fetch active ride if one is currently in progress for the logged-in user
   */
  async getActiveRide() {
    try {
      const history = await this.getRideHistory({ page: 1, limit: 10 });
      const activeStatuses = [
        'requested',
        'searching',
        'driver_assigned',
        'accepted',
        'assigned',
        'arrived',
        'in_progress',
      ];
      const active = history?.rides?.find((r) => activeStatuses.includes(r.status));
      return active || null;
    } catch {
      return null;
    }
  },
};

export default rideService;
