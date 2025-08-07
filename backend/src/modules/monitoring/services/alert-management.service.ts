import { Injectable, Logger } from '@nestjs/common';

export interface Alert {
    id: string;
    type: 'warning' | 'critical' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    source: string;
    acknowledged: boolean;
    resolved: boolean;
}

export interface AlertRule {
    id: string;
    name: string;
    condition: string;
    threshold: number;
    severity: 'warning' | 'critical' | 'info';
    enabled: boolean;
}

@Injectable()
export class AlertManagementService {
    private readonly logger = new Logger(AlertManagementService.name);
    private alerts: Alert[] = [];
    private alertRules: AlertRule[] = [];

    constructor() {
        this.logger.log('Alert management service initialized');
        this.initializeDefaultRules();
    }

    createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): Alert {
        const newAlert: Alert = {
            ...alert,
            id: this.generateAlertId(),
            timestamp: new Date(),
            acknowledged: false,
            resolved: false
        };

        this.alerts.push(newAlert);
        this.logger.warn(`New alert created: ${newAlert.title}`, newAlert);

        return newAlert;
    }

    getAlerts(filters?: { type?: string; acknowledged?: boolean; resolved?: boolean }): Alert[] {
        let filteredAlerts = [...this.alerts];

        if (filters) {
            if (filters.type) {
                filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
            }
            if (filters.acknowledged !== undefined) {
                filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === filters.acknowledged);
            }
            if (filters.resolved !== undefined) {
                filteredAlerts = filteredAlerts.filter(alert => alert.resolved === filters.resolved);
            }
        }

        return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    acknowledgeAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            this.logger.log(`Alert acknowledged: ${alertId}`);
            return true;
        }
        return false;
    }

    resolveAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.acknowledged = true;
            this.logger.log(`Alert resolved: ${alertId}`);
            return true;
        }
        return false;
    }

    getAlertRules(): AlertRule[] {
        return [...this.alertRules];
    }

    addAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
        const newRule: AlertRule = {
            ...rule,
            id: this.generateRuleId()
        };

        this.alertRules.push(newRule);
        this.logger.log(`New alert rule added: ${newRule.name}`);

        return newRule;
    }

    evaluateMetrics(metrics: any): Alert[] {
        const triggeredAlerts: Alert[] = [];

        for (const rule of this.alertRules.filter(r => r.enabled)) {
            if (this.evaluateRule(rule, metrics)) {
                const alert = this.createAlert({
                    type: rule.severity,
                    title: `Alert: ${rule.name}`,
                    message: `Threshold exceeded for ${rule.condition}`,
                    source: 'AlertManagementService'
                });
                triggeredAlerts.push(alert);
            }
        }

        return triggeredAlerts;
    }

    private evaluateRule(rule: AlertRule, metrics: any): boolean {
        try {
            switch (rule.condition) {
                case 'cpu_high':
                    return metrics.cpu?.utilization > rule.threshold;
                case 'memory_high':
                    return metrics.memory?.utilization > rule.threshold;
                case 'error_rate_high':
                    return metrics.requests?.errorRate > rule.threshold;
                default:
                    return false;
            }
        } catch (error) {
            this.logger.error(`Error evaluating rule ${rule.name}:`, error);
            return false;
        }
    }

    private initializeDefaultRules(): void {
        const defaultRules: Omit<AlertRule, 'id'>[] = [
            {
                name: 'High CPU Usage',
                condition: 'cpu_high',
                threshold: 80,
                severity: 'warning',
                enabled: true
            },
            {
                name: 'Critical CPU Usage',
                condition: 'cpu_high',
                threshold: 95,
                severity: 'critical',
                enabled: true
            },
            {
                name: 'High Memory Usage',
                condition: 'memory_high',
                threshold: 85,
                severity: 'warning',
                enabled: true
            },
            {
                name: 'High Error Rate',
                condition: 'error_rate_high',
                threshold: 5,
                severity: 'critical',
                enabled: true
            }
        ];

        defaultRules.forEach(rule => this.addAlertRule(rule));
    }

    private generateAlertId(): string {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateRuleId(): string {
        return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
