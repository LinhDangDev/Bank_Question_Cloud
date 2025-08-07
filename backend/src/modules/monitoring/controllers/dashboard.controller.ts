import { Controller, Get, Query, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdvancedMetricsCollector } from '../services/advanced-metrics-collector.service';
import { PredictiveAnalyticsService, PredictionResult } from '../services/predictive-analytics.service';

interface DashboardMetrics {
    networkEfficiency: any;
    memoryFragmentation: any;
    thermalHealth: any;
    storagePatterns: any;
    serviceDependencies: any;
    timestamp: Date;
    systemHealth: {
        overall_score: number;
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
    };
}

interface CapacityPlanningData {
    predictions: any[];
    recommendations: Array<string | {
        action: string;
        reason: string;
        timeline: string;
        impact: string;
    }>;
    costOptimization: {
        currentMonthlyCost: number;
        projectedMonthlyCost: number;
        potentialSavings: number;
    };
    scalingActions: Array<{
        service: string;
        action: string;
        timeframe: string;
        priority: 'low' | 'medium' | 'high';
    }>;
}

interface AnomalyReport {
    anomalies: any[];
    summary: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    trends: {
        increasing: string[];
        decreasing: string[];
        stable: string[];
    };
}

/**
 * Infrastructure Monitoring Dashboard Controller
 * Author: Linh Dang Dev
 *
 * Provides comprehensive dashboard APIs for:
 * - Real-time infrastructure metrics
 * - Predictive analytics and capacity planning
 * - Anomaly detection and alerting
 * - Performance optimization recommendations
 * - Cost analysis and optimization
 * - System health monitoring
 */
@ApiTags('Infrastructure Monitoring Dashboard')
@Controller('monitoring/dashboard')
export class DashboardController {
    constructor(
        private readonly metricsCollector: AdvancedMetricsCollector,
        private readonly predictiveService: PredictiveAnalyticsService
    ) { }

    @Get('metrics/current')
    @ApiOperation({
        summary: 'Get current comprehensive infrastructure metrics',
        description: 'Returns real-time metrics including network efficiency, memory fragmentation, thermal health, storage patterns, and service dependencies'
    })
    @ApiResponse({
        status: 200,
        description: 'Current infrastructure metrics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                networkEfficiency: { type: 'object' },
                memoryFragmentation: { type: 'object' },
                thermalHealth: { type: 'object' },
                storagePatterns: { type: 'object' },
                serviceDependencies: { type: 'object' },
                systemHealth: { type: 'object' },
                timestamp: { type: 'string', format: 'date-time' }
            }
        }
    })
    async getCurrentMetrics(): Promise<DashboardMetrics> {
        try {
            const [
                networkEfficiency,
                memoryFragmentation,
                thermalHealth,
                storagePatterns,
                serviceDependencies
            ] = await Promise.all([
                this.metricsCollector.calculateNetworkEfficiency(),
                this.metricsCollector.analyzeMemoryFragmentation(),
                this.metricsCollector.monitorThermalHealth(),
                this.metricsCollector.analyzeStoragePatterns(),
                this.metricsCollector.monitorServiceDependencies()
            ]);

            const systemHealth = this.calculateOverallSystemHealth({
                networkEfficiency,
                memoryFragmentation,
                thermalHealth,
                storagePatterns,
                serviceDependencies
            });

            return {
                networkEfficiency,
                memoryFragmentation,
                thermalHealth,
                storagePatterns,
                serviceDependencies,
                systemHealth,
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Failed to retrieve current metrics: ${error.message}`);
        }
    }

    @Get('analytics/predictions')
    @ApiOperation({
        summary: 'Get predictive analytics for capacity planning',
        description: 'Returns capacity predictions, scaling recommendations, and cost optimization analysis'
    })
    @ApiQuery({ name: 'timeframe', required: false, description: 'Prediction timeframe (1h, 24h, 7d, 30d)', example: '24h' })
    @ApiQuery({ name: 'services', required: false, description: 'Comma-separated list of services to analyze', example: 'ecs-service,rds-instance' })
    @ApiResponse({
        status: 200,
        description: 'Predictive analytics data retrieved successfully'
    })
    async getPredictiveAnalytics(
        @Query('timeframe') timeframe: string = '24h',
        @Query('services') services?: string
    ): Promise<CapacityPlanningData> {
        try {
            // Mock historical data - in real implementation, this would come from CloudWatch or database
            const serviceList = services ? services.split(',') : ['ecs-service', 'rds-instance', 'elasticache-cluster'];
            const mockHistoricalData = this.generateMockHistoricalData(serviceList, timeframe);

            const predictions = await this.predictiveService.predictCapacityNeeds(mockHistoricalData);

            const costOptimization = this.calculateCostOptimization(predictions);
            const scalingActions = this.generateScalingActions(predictions);
            const recommendations = this.generateRecommendations(predictions);

            return {
                predictions,
                recommendations,
                costOptimization,
                scalingActions
            };
        } catch (error) {
            throw new Error(`Failed to generate predictive analytics: ${error.message}`);
        }
    }

    @Get('anomalies')
    @ApiOperation({
        summary: 'Get anomaly detection report',
        description: 'Returns detected anomalies with severity levels and recommended actions'
    })
    @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity level', example: 'high' })
    @ApiResponse({
        status: 200,
        description: 'Anomaly detection report retrieved successfully'
    })
    async getAnomalies(@Query('severity') severity?: string): Promise<AnomalyReport> {
        try {
            // Mock current metrics and historical data
            const currentMetrics = await this.getCurrentMetricsForAnomalyDetection();
            const historicalData = this.generateMockHistoricalDataForAnomalies();

            const allAnomalies = await this.predictiveService.detectAnomalies(currentMetrics, historicalData);

            const filteredAnomalies = severity
                ? allAnomalies.filter(anomaly => anomaly.severity === severity)
                : allAnomalies;

            const summary = this.generateAnomalySummary(allAnomalies);
            const trends = this.analyzeTrends(historicalData);

            return {
                anomalies: filteredAnomalies,
                summary,
                trends
            };
        } catch (error) {
            throw new Error(`Failed to retrieve anomalies: ${error.message}`);
        }
    }

    @Get('health')
    @ApiOperation({
        summary: 'Get overall system health dashboard',
        description: 'Returns comprehensive system health status with alerts and recommendations'
    })
    @ApiResponse({
        status: 200,
        description: 'System health dashboard retrieved successfully'
    })
    async getSystemHealth() {
        try {
            const metrics = await this.getCurrentMetrics();
            const anomalies = await this.getAnomalies();
            const predictions = await this.getPredictiveAnalytics();

            return {
                status: metrics.systemHealth.status,
                overall_score: metrics.systemHealth.overall_score,
                uptime: process.uptime(),
                metrics: {
                    network: metrics.networkEfficiency,
                    memory: metrics.memoryFragmentation,
                    thermal: metrics.thermalHealth,
                    storage: metrics.storagePatterns,
                    dependencies: metrics.serviceDependencies
                },
                alerts: this.generateAlerts(anomalies.anomalies),
                recommendations: predictions.recommendations,
                cost_optimization: predictions.costOptimization,
                last_updated: new Date()
            };
        } catch (error) {
            throw new Error(`Failed to retrieve system health: ${error.message}`);
        }
    }

    @Get('performance/trends')
    @ApiOperation({
        summary: 'Get performance trend analysis',
        description: 'Returns historical performance trends and pattern analysis'
    })
    @ApiQuery({ name: 'period', required: false, description: 'Analysis period (1d, 7d, 30d)', example: '7d' })
    @ApiResponse({
        status: 200,
        description: 'Performance trends retrieved successfully'
    })
    async getPerformanceTrends(@Query('period') period: string = '7d') {
        try {
            const historicalData = this.generateMockHistoricalData(['cpu_utilization', 'memory_utilization', 'network_latency'], period);

            const trends = {};
            for (const [metric, data] of Object.entries(historicalData)) {
                const analysis = await this.predictiveService.analyzeCapacityTrends(data, metric);
                trends[metric] = {
                    trend: analysis.trend,
                    confidence: analysis.confidence,
                    predicted_value: analysis.predictedValue,
                    current_value: analysis.currentValue,
                    seasonal_pattern: analysis.seasonalPattern,
                    anomaly_score: analysis.anomalyScore,
                    recommendation: analysis.recommendedAction
                };
            }

            return {
                period,
                trends,
                summary: this.generateTrendSummary(trends),
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Failed to retrieve performance trends: ${error.message}`);
        }
    }

    @Post('alerts/configure')
    @ApiOperation({
        summary: 'Configure monitoring alerts',
        description: 'Configure custom alert thresholds and notification settings'
    })
    async configureAlerts(@Body() alertConfig: any) {
        try {
            // Implementation would save alert configuration to database
            return {
                success: true,
                message: 'Alert configuration updated successfully',
                config: alertConfig,
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Failed to configure alerts: ${error.message}`);
        }
    }

    @Get('reports/capacity/:service')
    @ApiOperation({
        summary: 'Get detailed capacity report for specific service',
        description: 'Returns comprehensive capacity analysis for a specific service'
    })
    async getServiceCapacityReport(@Param('service') service: string) {
        try {
            const historicalData = this.generateMockHistoricalData([service], '30d');
            const analysis = await this.predictiveService.analyzeCapacityTrends(historicalData[service], service);

            return {
                service,
                current_capacity: this.getCurrentServiceCapacity(service),
                utilization_analysis: analysis,
                scaling_recommendations: this.generateServiceScalingRecommendations(service, analysis),
                cost_analysis: this.generateServiceCostAnalysis(service),
                performance_metrics: this.getServicePerformanceMetrics(service),
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(`Failed to generate capacity report for ${service}: ${error.message}`);
        }
    }

    // Private helper methods
    private calculateOverallSystemHealth(metrics: any): any {
        const scores = [
            metrics.networkEfficiency.network_efficiency_ratio,
            100 - metrics.memoryFragmentation.fragmentation_ratio,
            metrics.thermalHealth.cooling_efficiency_score,
            metrics.storagePatterns.storage_efficiency_ratio,
            metrics.serviceDependencies.dependency_health_score
        ];

        const overall_score = scores.reduce((a, b) => a + b, 0) / scores.length;

        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        const issues: string[] = [];

        if (overall_score < 50) {
            status = 'critical';
            issues.push('Multiple systems showing poor performance');
        } else if (overall_score < 75) {
            status = 'warning';
            issues.push('Some systems need attention');
        }

        // Check individual metrics for specific issues
        if (metrics.networkEfficiency.network_efficiency_ratio < 70) {
            issues.push('Network efficiency below optimal levels');
        }
        if (metrics.memoryFragmentation.fragmentation_ratio > 30) {
            issues.push('High memory fragmentation detected');
        }
        if (metrics.thermalHealth.thermal_throttling_events > 0) {
            issues.push('Thermal throttling events detected');
        }

        return { overall_score: Math.round(overall_score), status, issues };
    }

    private generateMockHistoricalData(services: string[], timeframe: string): Record<string, number[]> {
        const dataPoints = this.getDataPointsForTimeframe(timeframe);
        const data: Record<string, number[]> = {};

        services.forEach(service => {
            data[service] = Array.from({ length: dataPoints }, (_, i) => {
                const baseValue = 50 + Math.sin(i / 10) * 20; // Seasonal pattern
                const noise = (Math.random() - 0.5) * 10; // Random noise
                const trend = i * 0.1; // Slight upward trend
                return Math.max(0, Math.min(100, baseValue + noise + trend));
            });
        });

        return data;
    }

    private getDataPointsForTimeframe(timeframe: string): number {
        const timeframeMap: Record<string, number> = {
            '1h': 12,   // 5-minute intervals
            '24h': 288, // 5-minute intervals
            '7d': 168,  // Hourly intervals
            '30d': 720  // Hourly intervals
        };
        return timeframeMap[timeframe] || 288;
    }

    private calculateCostOptimization(predictions: any[]): any {
        const currentMonthlyCost = predictions.reduce((sum, p) => sum + p.costImpact.currentCost, 0);
        const projectedMonthlyCost = predictions.reduce((sum, p) => sum + p.costImpact.predictedCost, 0);
        const potentialSavings = Math.max(0, currentMonthlyCost - projectedMonthlyCost);

        return {
            currentMonthlyCost: Math.round(currentMonthlyCost),
            projectedMonthlyCost: Math.round(projectedMonthlyCost),
            potentialSavings: Math.round(potentialSavings)
        };
    }

    private generateScalingActions(predictions: any[]): any[] {
        return predictions
            .filter(p => p.recommendedScaling.action !== 'maintain')
            .map(p => ({
                service: p.service,
                action: p.recommendedScaling.action,
                timeframe: p.recommendedScaling.timeframe,
                priority: this.determinePriority(p.recommendedScaling.confidence, p.predictedDemand)
            }));
    }

    private determinePriority(confidence: number, demand: number): 'low' | 'medium' | 'high' {
        if (confidence > 0.8 && demand > 80) return 'high';
        if (confidence > 0.6 && demand > 60) return 'medium';
        return 'low';
    }

    private generateRecommendations(predictions: any[]): string[] {
        const recommendations: string[] = [];

        predictions.forEach(p => {
            if (p.recommendedScaling.action === 'scale_up') {
                recommendations.push(`Scale up ${p.service} to handle predicted ${p.predictedDemand}% demand`);
            } else if (p.recommendedScaling.action === 'scale_down') {
                recommendations.push(`Consider scaling down ${p.service} to optimize costs`);
            }
        });

        if (recommendations.length === 0) {
            recommendations.push('All services are optimally configured');
        }

        return recommendations;
    }

    private async getCurrentMetricsForAnomalyDetection(): Promise<Record<string, number>> {
        // Mock current metrics - in real implementation, this would fetch from CloudWatch
        return {
            cpu_utilization: Math.random() * 100,
            memory_utilization: Math.random() * 100,
            network_latency: Math.random() * 200 + 10,
            error_rate: Math.random() * 5,
            disk_io: Math.random() * 1000
        };
    }

    private generateMockHistoricalDataForAnomalies(): Record<string, number[]> {
        const metrics = ['cpu_utilization', 'memory_utilization', 'network_latency', 'error_rate', 'disk_io'];
        const data: Record<string, number[]> = {};

        metrics.forEach(metric => {
            data[metric] = Array.from({ length: 100 }, () => {
                const baseValue = metric === 'network_latency' ? 50 : 60;
                const range = metric === 'error_rate' ? 2 : 20;
                return baseValue + (Math.random() - 0.5) * range;
            });
        });

        return data;
    }

    private generateAnomalySummary(anomalies: any[]): any {
        const summary = {
            total: anomalies.length,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };

        anomalies.forEach(anomaly => {
            summary[anomaly.severity]++;
        });

        return summary;
    }

    private analyzeTrends(historicalData: Record<string, number[]>): any {
        const trends = {
            increasing: [] as string[],
            decreasing: [] as string[],
            stable: [] as string[]
        };

        Object.entries(historicalData).forEach(([metric, data]) => {
            const recent = data.slice(-10);
            const older = data.slice(-20, -10);

            const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
            const olderAvg = older.reduce((a, b) => a + b) / older.length;

            const threshold = 5; // 5% threshold
            if (recentAvg > olderAvg + threshold) {
                trends.increasing.push(metric);
            } else if (recentAvg < olderAvg - threshold) {
                trends.decreasing.push(metric);
            } else {
                trends.stable.push(metric);
            }
        });

        return trends;
    }

    private generateAlerts(anomalies: any[]): any[] {
        return anomalies
            .filter(anomaly => ['high', 'critical'].includes(anomaly.severity))
            .map(anomaly => ({
                id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                severity: anomaly.severity,
                metric: anomaly.metric,
                message: `${anomaly.metric} anomaly detected: ${anomaly.value} (expected: ${anomaly.expectedRange.min}-${anomaly.expectedRange.max})`,
                actions: anomaly.recommendedActions,
                timestamp: new Date()
            }));
    }

    private generateTrendSummary(trends: any): any {
        const increasing = Object.entries(trends).filter(([, trend]: [string, any]) => trend.trend === 'increasing').length;
        const decreasing = Object.entries(trends).filter(([, trend]: [string, any]) => trend.trend === 'decreasing').length;
        const stable = Object.entries(trends).filter(([, trend]: [string, any]) => trend.trend === 'stable').length;

        return {
            total_metrics: Object.keys(trends).length,
            increasing_trends: increasing,
            decreasing_trends: decreasing,
            stable_trends: stable,
            overall_health: stable > increasing + decreasing ? 'good' : 'needs_attention'
        };
    }

    private getCurrentServiceCapacity(service: string): any {
        // Mock implementation
        return {
            current_instances: 2,
            max_instances: 10,
            cpu_limit: '1 vCPU',
            memory_limit: '2 GB',
            utilization: Math.random() * 100
        };
    }

    private generateServiceScalingRecommendations(service: string, analysis: any): any[] {
        const recommendations: Array<{
            action: string;
            reason: string;
            timeline: string;
            impact: string;
        }> = [];

        if (analysis.trend === 'increasing' && analysis.predictedValue > 80) {
            recommendations.push({
                action: 'scale_up',
                reason: 'Predicted high utilization',
                timeline: 'within 24 hours',
                impact: 'prevent performance degradation'
            });
        }

        return recommendations;
    }

    private generateServiceCostAnalysis(service: string): any {
        return {
            current_monthly_cost: Math.floor(Math.random() * 500) + 100,
            cost_per_hour: Math.floor(Math.random() * 5) + 1,
            optimization_potential: Math.floor(Math.random() * 30) + 10
        };
    }

    private getServicePerformanceMetrics(service: string): any {
        return {
            avg_response_time: Math.floor(Math.random() * 100) + 50,
            error_rate: Math.random() * 2,
            throughput: Math.floor(Math.random() * 1000) + 500,
            availability: 99.9 + Math.random() * 0.1
        };
    }
}
