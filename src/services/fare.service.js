import api from './api';

/**
 * Fare Calculation & Promo Codes Service
 * Communicates with /api/v1/fares endpoints
 */
export const fareService = {
  /**
   * Estimate ride fares across vehicle categories with multi-stop waypoints
   * @param {Object} payload { pickup, stops, dropoff, vehicle_category }
   */
  async estimateFare(payload) {
    const response = await api.post('/api/v1/fares/estimate', payload);
    return response.data; // { route: { distance_km, duration_minutes, total_waypoints }, estimates: [...] }
  },

  /**
   * Validate and apply a promotional discount code
   * @param {Object} payload { code, order_amount }
   */
  async applyPromo(payload) {
    const response = await api.post('/api/v1/fares/apply-promo', payload);
    return response.data; // { promo_id, code, description, discount_applied, original_fare, final_fare }
  },
};

export default fareService;
