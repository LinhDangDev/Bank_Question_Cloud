import { api } from './api';

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  overall_score: number;
  uptime: number;
  metrics: {
    network: any;
    memory: any;
    storage: any;
    dependencies: any;
  };
  alerts: Array<{
    id: string;
    severity: string;
    message: string;
    timestamp: Date;
  }>;
  recommendations: string[];
  last_updated: Date;
}

/**
 * Simple Monitoring Service
 * Author: Linh Dang Dev
 * 
 * Basic monitoring service following AWS Implementation Guide
 */
class MonitoringService {
  private baseUrl = '/api/monitoring/dashboard';

  /**
   * Get system health overview
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await api.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw new Error('Failed to fetch system health');
    }
  }

  /**
   * Get current metrics
   */
  async getCurrentMetrics(): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}/metrics/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching current metrics:', error);
      throw new Error('Failed to fetch current metrics');
    }
  }

  /**
   * Trigger manual health check
   */
  async triggerHealthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`${this.baseUrl}/health/check`);
      return response.data;
    } catch (error) {
      console.error('Error triggering health check:', error);
      throw new Error('Failed to trigger health check');
    }
  }
}

export const monitoringService = new MonitoringService();
export default monitoringService;
