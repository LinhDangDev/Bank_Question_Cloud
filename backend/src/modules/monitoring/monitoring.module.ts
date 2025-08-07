import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AdvancedMetricsCollector } from './services/advanced-metrics-collector.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import { RealTimeMonitoringService } from './services/real-time-monitoring.service';
import { AlertManagementService } from './services/alert-management.service';
import { MonitoringController } from './controllers/monitoring.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { MonitoringGateway } from './gateways/monitoring.gateway';

/**
 * Infrastructure Monitoring Module
 * Author: Linh Dang Dev
 * 
 * Provides comprehensive monitoring capabilities:
 * - Advanced metrics collection from AWS services
 * - Predictive analytics for capacity planning
 * - Real-time monitoring with WebSocket updates
 * - Intelligent alerting system
 * - Performance optimization recommendations
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  controllers: [
    MonitoringController,
    DashboardController,
  ],
  providers: [
    AdvancedMetricsCollector,
    PredictiveAnalyticsService,
    RealTimeMonitoringService,
    AlertManagementService,
    MonitoringGateway,
  ],
  exports: [
    AdvancedMetricsCollector,
    PredictiveAnalyticsService,
    RealTimeMonitoringService,
    AlertManagementService,
  ],
})
export class MonitoringModule {}
