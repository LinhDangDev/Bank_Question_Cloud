import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getRuntimeMetricsSnapshot } from '../../../monitoring-metrics';

@Injectable()
export class RealTimeMonitoringService {
    private readonly logger = new Logger(RealTimeMonitoringService.name);
    private isMonitoring = false;
    private metrics: any = {};

    constructor() {
        this.logger.log('Real-time monitoring service initialized');
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async collectRealTimeMetrics() {
        if (!this.isMonitoring) {
            return;
        }

        try {
            this.logger.debug('Collecting real-time metrics...');

            this.metrics = getRuntimeMetricsSnapshot();
            this.logger.debug('Real-time metrics collected successfully');
        } catch (error) {
            this.logger.error('Failed to collect real-time metrics', error);
        }
    }

    startMonitoring() {
        this.isMonitoring = true;
        this.logger.log('Real-time monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        this.logger.log('Real-time monitoring stopped');
    }

    getCurrentMetrics() {
        if (!this.metrics || Object.keys(this.metrics).length === 0) {
            this.metrics = getRuntimeMetricsSnapshot();
        }

        return this.metrics;
    }
}
