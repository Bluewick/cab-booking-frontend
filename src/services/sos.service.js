import api from './api';

/**
 * Emergency SOS Safety Service
 * Dispatches high-priority distress alerts to safety monitors, police, and emergency contacts
 */
export const sosService = {
  /**
   * Trigger an emergency SOS distress alert for an active ride
   * @param {Object} payload { ride_id, latitude, longitude }
   */
  async triggerAlert(payload) {
    const response = await api.post('/api/v1/sos/trigger', payload);
    return response.data; // { alert, emergency_contacts_notified }
  },

  /**
   * Fetch active emergency distress alerts (Admin / Safety Dispatcher only)
   */
  async getActiveAlerts() {
    try {
      const response = await api.get('/api/v1/sos/active');
      return response.data?.alerts || response.data || [];
    } catch {
      const response = await api.get('/api/v1/sos/alerts');
      return response.data?.alerts || response.data || [];
    }
  },

  /**
   * Fetch all emergency alerts (Admin / Safety Dispatcher only)
   */
  async getAlerts(_params = { status: 'active' }) {
    return this.getActiveAlerts();
  },

  /**
   * Resolve an emergency distress alert
   * @param {string} alertId
   * @param {string} resolutionNotes
   */
  async resolveAlert(alertId, resolutionNotes = 'Emergency patrol dispatched. Passenger confirmed safe at destination.') {
    try {
      const response = await api.patch(`/api/v1/sos/${alertId}/resolve`, {
        status: 'resolved',
        notes: resolutionNotes,
      });
      return response.data;
    } catch {
      const response = await api.patch(`/api/v1/sos/alerts/${alertId}/resolve`, {
        resolution_notes: resolutionNotes,
      });
      return response.data;
    }
  },
};

export default sosService;
