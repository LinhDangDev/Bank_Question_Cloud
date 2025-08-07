import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface PredictionResult {
    metric: string;
    currentValue: number;
    predictedValue: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    recommendedAction: string;
    timeToThreshold?: number;
    seasonalPattern?: string;
    anomalyScore?: number;
}

interface CapacityPrediction {
    service: string;
    currentCapacity: number;
    predictedDemand: number;
    recommendedScaling: {
        action: 'scale_up' | 'scale_down' | 'maintain';
        targetCapacity: number;
        timeframe: string;
        confidence: number;
    };
    costImpact: {
        currentCost: number;
        predictedCost: number;
        savings?: number;
    };
}

interface AnomalyDetection {
    metric: string;
    value: number;
    expectedRange: { min: number; max: number };
    anomalyScore: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    possibleCauses: string[];
    recommendedActions: string[];
}

interface SeasonalPattern {
    pattern: 'daily' | 'weekly' | 'monthly' | 'none';
    peakHours?: number[];
    peakDays?: string[];
    seasonalityStrength: number;
    nextPeakPrediction?: Date;
}

/**
 * Predictive Analytics Service
 * Author: Linh Dang Dev
 *
 * Advanced analytics service providing:
 * - Machine learning-based capacity predictions
 * - Anomaly detection with root cause analysis
 * - Seasonal pattern recognition
 * - Cost optimization recommendations
 * - Performance trend analysis
 * - Auto-scaling recommendations
 */
@Injectable()
export class PredictiveAnalyticsService {
    private readonly logger = new Logger(PredictiveAnalyticsService.name);

    async analyzeCapacityTrends(metricHistory: number[], metricName: string = 'cpu_utilization'): Promise<PredictionResult> {
        try {
            this.logger.log(`🔍 Analyzing capacity trends for ${metricName}`);

            if (metricHistory.length < 5) {
                throw new Error('Insufficient data for trend analysis. Need at least 5 data points.');
            }

            const trend = this.calculateTrend(metricHistory);
            const prediction = this.linearRegression(metricHistory);
            const seasonality = this.detectSeasonalPattern(metricHistory);
            const anomalyScore = this.calculateAnomalyScore(metricHistory);

            const result: PredictionResult = {
                metric: metricName,
                currentValue: metricHistory[metricHistory.length - 1],
                predictedValue: prediction.nextValue,
                trend: trend,
                confidence: prediction.confidence,
                recommendedAction: this.generateRecommendation(trend, prediction.nextValue, metricName),
                timeToThreshold: this.calculateTimeToThreshold(metricHistory, prediction.slope),
                seasonalPattern: seasonality.pattern,
                anomalyScore: anomalyScore
            };

            this.logger.log(`📊 Trend analysis completed: ${trend} trend with ${(prediction.confidence * 100).toFixed(1)}% confidence`);
            return result;

        } catch (error) {
            this.logger.error('Error analyzing capacity trends:', error);
            throw error;
        }
    }

    async predictCapacityNeeds(serviceMetrics: Record<string, number[]>): Promise<CapacityPrediction[]> {
        try {
            this.logger.log('🎯 Predicting capacity needs for all services');

            const predictions: CapacityPrediction[] = [];

            for (const [service, metrics] of Object.entries(serviceMetrics)) {
                const prediction = await this.analyzeCapacityTrends(metrics, service);
                const currentCapacity = this.getCurrentCapacity(service);
                const costAnalysis = this.analyzeCostImpact(service, prediction.predictedValue, currentCapacity);

                predictions.push({
                    service,
                    currentCapacity,
                    predictedDemand: prediction.predictedValue,
                    recommendedScaling: this.generateScalingRecommendation(prediction, currentCapacity),
                    costImpact: costAnalysis
                });
            }

            this.logger.log(`📈 Generated capacity predictions for ${predictions.length} services`);
            return predictions;

        } catch (error) {
            this.logger.error('Error predicting capacity needs:', error);
            throw error;
        }
    }

    async detectAnomalies(currentMetrics: Record<string, number>, historicalData: Record<string, number[]>): Promise<AnomalyDetection[]> {
        try {
            this.logger.log('🚨 Detecting anomalies in current metrics');

            const anomalies: AnomalyDetection[] = [];

            for (const [metric, currentValue] of Object.entries(currentMetrics)) {
                const historical = historicalData[metric];
                if (!historical || historical.length < 10) continue;

                const expectedRange = this.calculateExpectedRange(historical);
                const anomalyScore = this.calculateMetricAnomalyScore(currentValue, historical);

                if (anomalyScore > 0.7) { // Threshold for anomaly detection
                    const severity = this.determineSeverity(anomalyScore, metric);

                    anomalies.push({
                        metric,
                        value: currentValue,
                        expectedRange,
                        anomalyScore,
                        severity,
                        possibleCauses: this.identifyPossibleCauses(metric, currentValue, expectedRange),
                        recommendedActions: this.generateAnomalyActions(metric, severity, currentValue)
                    });
                }
            }

            this.logger.log(`⚠️ Detected ${anomalies.length} anomalies`);
            return anomalies;

        } catch (error) {
            this.logger.error('Error detecting anomalies:', error);
            throw error;
        }
    }

    async analyzeSeasonalPatterns(metricHistory: number[], timestamps: Date[]): Promise<SeasonalPattern> {
        try {
            if (metricHistory.length !== timestamps.length) {
                throw new Error('Metric history and timestamps must have the same length');
            }

            const hourlyPattern = this.analyzeHourlyPattern(metricHistory, timestamps);
            const dailyPattern = this.analyzeDailyPattern(metricHistory, timestamps);
            const weeklyPattern = this.analyzeWeeklyPattern(metricHistory, timestamps);

            const patterns = [
                { type: 'daily' as const, strength: hourlyPattern.strength, data: hourlyPattern },
                { type: 'weekly' as const, strength: dailyPattern.strength, data: dailyPattern },
                { type: 'monthly' as const, strength: weeklyPattern.strength, data: weeklyPattern }
            ];

            const strongestPattern = patterns.reduce((prev, current) =>
                current.strength > prev.strength ? current : prev
            );

            if (strongestPattern.strength < 0.3) {
                return { pattern: 'none', seasonalityStrength: 0 };
            }

            return {
                pattern: strongestPattern.type,
                peakHours: strongestPattern.type === 'daily' ? strongestPattern.data.peakHours : undefined,
                peakDays: strongestPattern.type === 'weekly' ? strongestPattern.data.peakDays : undefined,
                seasonalityStrength: strongestPattern.strength,
                nextPeakPrediction: this.predictNextPeak(strongestPattern.type, strongestPattern.data)
            };

        } catch (error) {
            this.logger.error('Error analyzing seasonal patterns:', error);
            throw error;
        }
    }

    private calculateTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
        if (data.length < 2) return 'stable';

        const windowSize = Math.min(5, Math.floor(data.length / 2));
        const recent = data.slice(-windowSize);
        const older = data.slice(-windowSize * 2, -windowSize);

        if (older.length === 0) return 'stable';

        const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b) / older.length;

        const threshold = this.calculateDynamicThreshold(data);

        if (recentAvg > olderAvg + threshold) return 'increasing';
        if (recentAvg < olderAvg - threshold) return 'decreasing';
        return 'stable';
    }

    private calculateDynamicThreshold(data: number[]): number {
        const stdDev = this.calculateStandardDeviation(data);
        const mean = data.reduce((a, b) => a + b) / data.length;

        // Threshold is 10% of mean or 1 standard deviation, whichever is smaller
        return Math.min(mean * 0.1, stdDev);
    }

    private calculateStandardDeviation(data: number[]): number {
        const mean = data.reduce((a, b) => a + b) / data.length;
        const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b) / squaredDiffs.length;
        return Math.sqrt(avgSquaredDiff);
    }

    private linearRegression(data: number[]): { nextValue: number; confidence: number; slope: number } {
        const n = data.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = data;

        const sumX = x.reduce((a, b) => a + b);
        const sumY = y.reduce((a, b) => a + b);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const nextValue = slope * n + intercept;

        // Calculate R-squared for confidence
        const yMean = sumY / n;
        const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const residualSumSquares = y.reduce((sum, yi, i) => {
            const predicted = slope * i + intercept;
            return sum + Math.pow(yi - predicted, 2);
        }, 0);

        const rSquared = 1 - (residualSumSquares / totalSumSquares);
        const confidence = Math.max(0.1, Math.min(0.95, rSquared));

        return {
            nextValue: Math.max(0, nextValue),
            confidence,
            slope
        };
    }

    private generateRecommendation(trend: string, predictedValue: number, metricName: string): string {
        const recommendations: Record<string, Record<string, string>> = {
            cpu_utilization: {
                increasing: predictedValue > 80 ? 'Scale up immediately - CPU utilization approaching critical levels' : 'Monitor closely - CPU trend increasing',
                decreasing: predictedValue < 30 ? 'Consider scaling down to optimize costs' : 'Current capacity appears sufficient',
                stable: 'Maintain current configuration - metrics are stable'
            },
            memory_utilization: {
                increasing: predictedValue > 85 ? 'Increase memory allocation or scale horizontally' : 'Monitor memory usage patterns',
                decreasing: predictedValue < 40 ? 'Consider reducing memory allocation to save costs' : 'Memory usage is optimal',
                stable: 'Memory configuration is well-sized for current workload'
            },
            network_latency: {
                increasing: 'Investigate network bottlenecks and consider CDN or edge optimization',
                decreasing: 'Network performance is improving - maintain current configuration',
                stable: 'Network performance is consistent'
            }
        };

        return recommendations[metricName]?.[trend] || `Monitor ${metricName} - trend is ${trend}`;
    }

    private calculateTimeToThreshold(data: number[], slope: number): number | undefined {
        if (slope <= 0) return undefined;

        const currentValue = data[data.length - 1];
        const threshold = 80; // Assuming 80% as critical threshold

        if (currentValue >= threshold) return 0;

        const timeToThreshold = (threshold - currentValue) / slope;
        return Math.max(0, timeToThreshold);
    }

    private detectSeasonalPattern(data: number[]): { pattern: string; strength: number } {
        if (data.length < 24) return { pattern: 'none', strength: 0 };

        // Simple autocorrelation for daily pattern (assuming hourly data)
        const dailyCorrelation = this.calculateAutocorrelation(data, 24);
        const weeklyCorrelation = data.length >= 168 ? this.calculateAutocorrelation(data, 168) : 0;

        if (dailyCorrelation > 0.5) return { pattern: 'daily', strength: dailyCorrelation };
        if (weeklyCorrelation > 0.4) return { pattern: 'weekly', strength: weeklyCorrelation };

        return { pattern: 'none', strength: 0 };
    }

    private calculateAutocorrelation(data: number[], lag: number): number {
        if (data.length <= lag) return 0;

        const n = data.length - lag;
        const mean = data.reduce((a, b) => a + b) / data.length;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (data[i] - mean) * (data[i + lag] - mean);
        }

        for (let i = 0; i < data.length; i++) {
            denominator += Math.pow(data[i] - mean, 2);
        }

        return denominator === 0 ? 0 : numerator / denominator;
    }

    private calculateAnomalyScore(data: number[]): number {
        if (data.length < 3) return 0;

        const recent = data[data.length - 1];
        const historical = data.slice(0, -1);
        const mean = historical.reduce((a, b) => a + b) / historical.length;
        const stdDev = this.calculateStandardDeviation(historical);

        if (stdDev === 0) return 0;

        const zScore = Math.abs(recent - mean) / stdDev;
        return Math.min(1, zScore / 3); // Normalize to 0-1 scale
    }

    private getCurrentCapacity(service: string): number {
        // Mock implementation - in real scenario, this would query actual service capacity
        const capacityMap: Record<string, number> = {
            'ecs-service': 2,
            'rds-instance': 1,
            'elasticache-cluster': 1,
            'lambda-function': 100
        };

        return capacityMap[service] || 1;
    }

    private analyzeCostImpact(service: string, predictedDemand: number, currentCapacity: number): any {
        // Mock cost analysis - in real scenario, this would use AWS Pricing API
        const costPerUnit: Record<string, number> = {
            'ecs-service': 50, // $50 per task per month
            'rds-instance': 100, // $100 per instance per month
            'elasticache-cluster': 75, // $75 per node per month
            'lambda-function': 0.0001 // $0.0001 per request
        };

        const unitCost = costPerUnit[service] || 50;
        const currentCost = currentCapacity * unitCost;
        const recommendedCapacity = Math.ceil(predictedDemand / 70); // Assuming 70% target utilization
        const predictedCost = recommendedCapacity * unitCost;

        return {
            currentCost,
            predictedCost,
            savings: currentCost > predictedCost ? currentCost - predictedCost : undefined
        };
    }

    private generateScalingRecommendation(prediction: PredictionResult, currentCapacity: number): any {
        const targetUtilization = 70; // 70% target utilization
        const requiredCapacity = Math.ceil(prediction.predictedValue / targetUtilization);

        let action: 'scale_up' | 'scale_down' | 'maintain' = 'maintain';
        let targetCapacity = currentCapacity;

        if (requiredCapacity > currentCapacity) {
            action = 'scale_up';
            targetCapacity = requiredCapacity;
        } else if (requiredCapacity < currentCapacity && prediction.confidence > 0.7) {
            action = 'scale_down';
            targetCapacity = requiredCapacity;
        }

        return {
            action,
            targetCapacity,
            timeframe: prediction.timeToThreshold ? `${Math.ceil(prediction.timeToThreshold)} time units` : 'immediate',
            confidence: prediction.confidence
        };
    }

    private calculateExpectedRange(historical: number[]): { min: number; max: number } {
        const mean = historical.reduce((a, b) => a + b) / historical.length;
        const stdDev = this.calculateStandardDeviation(historical);

        return {
            min: mean - 2 * stdDev,
            max: mean + 2 * stdDev
        };
    }

    private calculateMetricAnomalyScore(currentValue: number, historical: number[]): number {
        const expectedRange = this.calculateExpectedRange(historical);

        if (currentValue >= expectedRange.min && currentValue <= expectedRange.max) {
            return 0; // Normal value
        }

        const mean = historical.reduce((a, b) => a + b) / historical.length;
        const stdDev = this.calculateStandardDeviation(historical);

        if (stdDev === 0) return currentValue === mean ? 0 : 1;

        const zScore = Math.abs(currentValue - mean) / stdDev;
        return Math.min(1, zScore / 4); // Normalize to 0-1 scale
    }

    private determineSeverity(anomalyScore: number, metric: string): 'low' | 'medium' | 'high' | 'critical' {
        const criticalMetrics = ['cpu_utilization', 'memory_utilization', 'error_rate'];
        const isCritical = criticalMetrics.includes(metric);

        if (anomalyScore >= 0.9) return 'critical';
        if (anomalyScore >= 0.8) return isCritical ? 'critical' : 'high';
        if (anomalyScore >= 0.7) return isCritical ? 'high' : 'medium';
        return 'low';
    }

    private identifyPossibleCauses(metric: string, currentValue: number, expectedRange: any): string[] {
        const causes: Record<string, string[]> = {
            cpu_utilization: currentValue > expectedRange.max
                ? ['High traffic load', 'Inefficient algorithms', 'Resource contention', 'Memory leaks causing CPU spikes']
                : ['Reduced traffic', 'Performance optimizations', 'Caching improvements'],
            memory_utilization: currentValue > expectedRange.max
                ? ['Memory leaks', 'Large dataset processing', 'Inefficient caching', 'Increased concurrent users']
                : ['Memory optimization', 'Reduced data processing', 'Garbage collection improvements'],
            network_latency: currentValue > expectedRange.max
                ? ['Network congestion', 'DNS resolution issues', 'Database query slowdowns', 'Third-party API delays']
                : ['Network optimization', 'CDN improvements', 'Database query optimization'],
            error_rate: currentValue > expectedRange.max
                ? ['Application bugs', 'Database connectivity issues', 'Third-party service failures', 'Configuration errors']
                : ['Bug fixes deployed', 'Improved error handling', 'Infrastructure stability improvements']
        };

        return causes[metric] || ['Unknown cause - requires investigation'];
    }

    private generateAnomalyActions(metric: string, severity: string, currentValue: number): string[] {
        const actions: Record<string, Record<string, string[]>> = {
            cpu_utilization: {
                critical: ['Scale up immediately', 'Investigate CPU-intensive processes', 'Enable auto-scaling', 'Alert on-call team'],
                high: ['Monitor closely', 'Prepare for scaling', 'Review recent deployments'],
                medium: ['Schedule performance review', 'Monitor trends'],
                low: ['Log for analysis', 'Continue monitoring']
            },
            memory_utilization: {
                critical: ['Scale up memory', 'Investigate memory leaks', 'Restart services if necessary', 'Alert development team'],
                high: ['Monitor memory patterns', 'Review memory allocation', 'Check for memory leaks'],
                medium: ['Schedule memory optimization review', 'Monitor garbage collection'],
                low: ['Continue monitoring', 'Log for trend analysis']
            },
            error_rate: {
                critical: ['Immediate investigation required', 'Check application logs', 'Verify database connectivity', 'Alert development team'],
                high: ['Review recent deployments', 'Check error logs', 'Monitor user impact'],
                medium: ['Schedule error analysis', 'Review error patterns'],
                low: ['Log for analysis', 'Monitor trends']
            }
        };

        return actions[metric]?.[severity] || ['Investigate anomaly', 'Monitor closely', 'Review system logs'];
    }

    private analyzeHourlyPattern(data: number[], timestamps: Date[]): any {
        // Group data by hour of day
        const hourlyData: Record<number, number[]> = {};

        timestamps.forEach((timestamp, index) => {
            const hour = timestamp.getHours();
            if (!hourlyData[hour]) hourlyData[hour] = [];
            hourlyData[hour].push(data[index]);
        });

        // Calculate average for each hour
        const hourlyAverages: Record<number, number> = {};
        for (const [hour, values] of Object.entries(hourlyData)) {
            hourlyAverages[parseInt(hour)] = values.reduce((a, b) => a + b) / values.length;
        }

        // Find peak hours (top 25% of hours)
        const sortedHours = Object.entries(hourlyAverages)
            .sort(([, a], [, b]) => b - a)
            .map(([hour]) => parseInt(hour));

        const peakHours = sortedHours.slice(0, Math.ceil(sortedHours.length * 0.25));

        // Calculate pattern strength (coefficient of variation)
        const values = Object.values(hourlyAverages);
        const mean = values.reduce((a, b) => a + b) / values.length;
        const stdDev = this.calculateStandardDeviation(values);
        const strength = stdDev / mean; // Higher variation = stronger pattern

        return {
            peakHours,
            strength: Math.min(1, strength),
            hourlyAverages
        };
    }

    private analyzeDailyPattern(data: number[], timestamps: Date[]): any {
        // Group data by day of week
        const dailyData: Record<number, number[]> = {};

        timestamps.forEach((timestamp, index) => {
            const day = timestamp.getDay(); // 0 = Sunday, 1 = Monday, etc.
            if (!dailyData[day]) dailyData[day] = [];
            dailyData[day].push(data[index]);
        });

        const dailyAverages: Record<number, number> = {};
        for (const [day, values] of Object.entries(dailyData)) {
            dailyAverages[parseInt(day)] = values.reduce((a, b) => a + b) / values.length;
        }

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const sortedDays = Object.entries(dailyAverages)
            .sort(([, a], [, b]) => b - a)
            .map(([day]) => dayNames[parseInt(day)]);

        const peakDays = sortedDays.slice(0, Math.ceil(sortedDays.length * 0.3));

        const values = Object.values(dailyAverages);
        const mean = values.reduce((a, b) => a + b) / values.length;
        const stdDev = this.calculateStandardDeviation(values);
        const strength = stdDev / mean;

        return {
            peakDays,
            strength: Math.min(1, strength),
            dailyAverages
        };
    }

    private analyzeWeeklyPattern(data: number[], timestamps: Date[]): any {
        // For weekly pattern, we'd need more sophisticated analysis
        // This is a simplified version
        const weeklyData: Record<number, number[]> = {};

        timestamps.forEach((timestamp, index) => {
            const week = Math.floor(timestamp.getTime() / (7 * 24 * 60 * 60 * 1000));
            if (!weeklyData[week]) weeklyData[week] = [];
            weeklyData[week].push(data[index]);
        });

        const weeklyAverages = Object.values(weeklyData).map(values =>
            values.reduce((a, b) => a + b) / values.length
        );

        if (weeklyAverages.length < 2) {
            return { strength: 0 };
        }

        const mean = weeklyAverages.reduce((a, b) => a + b) / weeklyAverages.length;
        const stdDev = this.calculateStandardDeviation(weeklyAverages);
        const strength = stdDev / mean;

        return {
            strength: Math.min(1, strength),
            weeklyAverages
        };
    }

    private predictNextPeak(patternType: string, patternData: any): Date | undefined {
        const now = new Date();

        if (patternType === 'daily' && patternData.peakHours) {
            const nextPeakHour = patternData.peakHours[0];
            const nextPeak = new Date(now);
            nextPeak.setHours(nextPeakHour, 0, 0, 0);

            if (nextPeak <= now) {
                nextPeak.setDate(nextPeak.getDate() + 1);
            }

            return nextPeak;
        }

        if (patternType === 'weekly' && patternData.peakDays) {
            // Implementation for weekly peak prediction
            // This would require more complex logic
        }

        return undefined;
    }
}
