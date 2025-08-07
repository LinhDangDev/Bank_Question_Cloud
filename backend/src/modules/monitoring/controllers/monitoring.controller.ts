import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RealTimeMonitoringService } from '../services/real-time-monitoring.service';
import { AlertManagementService, Alert, AlertRule } from '../services/alert-management.service';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
    constructor(
        private readonly realTimeMonitoringService: RealTimeMonitoringService,
        private readonly alertManagementService: AlertManagementService
    ) { }

    @Get('metrics/realtime')
    @ApiOperation({ summary: 'Get real-time system metrics' })
    @ApiResponse({ status: 200, description: 'Real-time metrics retrieved successfully' })
    async getRealTimeMetrics() {
        return {
            status: 'success',
            data: this.realTimeMonitoringService.getCurrentMetrics(),
            timestamp: new Date()
        };
    }

    @Post('monitoring/start')
    @ApiOperation({ summary: 'Start real-time monitoring' })
    @ApiResponse({ status: 200, description: 'Monitoring started successfully' })
    async startMonitoring() {
        this.realTimeMonitoringService.startMonitoring();
        return {
            status: 'success',
            message: 'Real-time monitoring started',
            timestamp: new Date()
        };
    }

    @Post('monitoring/stop')
    @ApiOperation({ summary: 'Stop real-time monitoring' })
    @ApiResponse({ status: 200, description: 'Monitoring stopped successfully' })
    async stopMonitoring() {
        this.realTimeMonitoringService.stopMonitoring();
        return {
            status: 'success',
            message: 'Real-time monitoring stopped',
            timestamp: new Date()
        };
    }

    @Get('alerts')
    @ApiOperation({ summary: 'Get system alerts' })
    @ApiQuery({ name: 'type', required: false, description: 'Filter by alert type' })
    @ApiQuery({ name: 'acknowledged', required: false, description: 'Filter by acknowledgment status' })
    @ApiQuery({ name: 'resolved', required: false, description: 'Filter by resolution status' })
    @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
    async getAlerts(
        @Query('type') type?: string,
        @Query('acknowledged') acknowledged?: string,
        @Query('resolved') resolved?: string
    ) {
        const filters: any = {};

        if (type) filters.type = type;
        if (acknowledged !== undefined) filters.acknowledged = acknowledged === 'true';
        if (resolved !== undefined) filters.resolved = resolved === 'true';

        const alerts = this.alertManagementService.getAlerts(filters);

        return {
            status: 'success',
            data: alerts,
            count: alerts.length,
            timestamp: new Date()
        };
    }

    @Put('alerts/:id/acknowledge')
    @ApiOperation({ summary: 'Acknowledge an alert' })
    @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
    @ApiResponse({ status: 404, description: 'Alert not found' })
    async acknowledgeAlert(@Param('id') alertId: string) {
        const success = this.alertManagementService.acknowledgeAlert(alertId);

        if (!success) {
            return {
                status: 'error',
                message: 'Alert not found',
                timestamp: new Date()
            };
        }

        return {
            status: 'success',
            message: 'Alert acknowledged successfully',
            timestamp: new Date()
        };
    }

    @Put('alerts/:id/resolve')
    @ApiOperation({ summary: 'Resolve an alert' })
    @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
    @ApiResponse({ status: 404, description: 'Alert not found' })
    async resolveAlert(@Param('id') alertId: string) {
        const success = this.alertManagementService.resolveAlert(alertId);

        if (!success) {
            return {
                status: 'error',
                message: 'Alert not found',
                timestamp: new Date()
            };
        }

        return {
            status: 'success',
            message: 'Alert resolved successfully',
            timestamp: new Date()
        };
    }

    @Get('alerts/rules')
    @ApiOperation({ summary: 'Get alert rules' })
    @ApiResponse({ status: 200, description: 'Alert rules retrieved successfully' })
    async getAlertRules() {
        const rules = this.alertManagementService.getAlertRules();

        return {
            status: 'success',
            data: rules,
            count: rules.length,
            timestamp: new Date()
        };
    }

    @Post('alerts/rules')
    @ApiOperation({ summary: 'Create new alert rule' })
    @ApiResponse({ status: 201, description: 'Alert rule created successfully' })
    async createAlertRule(@Body() ruleData: any) {
        const rule = this.alertManagementService.addAlertRule(ruleData);

        return {
            status: 'success',
            message: 'Alert rule created successfully',
            data: rule,
            timestamp: new Date()
        };
    }

    @Get('health')
    @ApiOperation({ summary: 'Get monitoring service health status' })
    @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
    async getHealthStatus() {
        return {
            status: 'healthy',
            services: {
                realTimeMonitoring: 'active',
                alertManagement: 'active'
            },
            uptime: process.uptime(),
            timestamp: new Date()
        };
    }
}
