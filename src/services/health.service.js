import api from './api';

/**
 * System Health & Diagnostics Service
 * Communicates with system monitoring endpoints
 */
export const healthService = {
  /**
   * Fetch live server and database telemetry
   * GET /api/v1/health
   */
  async getHealth() {
    const startTime = performance.now();
    const res = await api.get('/api/v1/health');
    const latency = Math.round(performance.now() - startTime);

    return {
      status: res.data?.server_status || 'online',
      uptimeSeconds: res.data?.uptime_seconds || 0,
      timestamp: res.data?.timestamp || new Date().toISOString(),
      database: {
        connected: res.data?.database?.connected ?? true,
        dbTime: res.data?.database?.db_time,
        dbName: res.data?.database?.db_name || 'cab-booking-db',
      },
      websockets: {
        enabled: res.data?.websockets?.enabled ?? true,
      },
      latencyMs: latency,
      message: res.message,
    };
  },
};

export default healthService;
