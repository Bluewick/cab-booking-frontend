import api from './api';

/**
 * Driver Reviews & Passenger Feedback Service
 * Manages 1-5 star driver evaluations, compliments, and ratings ledgers
 */
export const reviewService = {
  /**
   * Submit passenger review & rating for a completed trip
   * @param {Object} payload
   * @param {string} payload.ride_id - ID of completed ride
   * @param {number} payload.rating - 1.0 to 5.0 score
   * @param {string} [payload.comment] - Compliment or descriptive feedback
   * @returns {Promise<{ review: Object, updated_driver_rating: string }>}
   */
  async submitReview(payload) {
    const response = await api.post('/api/v1/reviews', payload);
    return response.data;
  },

  /**
   * Fetch public reviews and ratings for a driver partner
   * @param {string} driverId
   * @param {Object} [params] { page: number, limit: number }
   * @returns {Promise<{ reviews: Array, meta: Object }>}
   */
  async getDriverReviews(driverId, params = { page: 1, limit: 10 }) {
    const response = await api.get(`/api/v1/reviews/driver/${driverId}`, { params });
    return response.data;
  },
};

export default reviewService;
