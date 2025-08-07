import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RealTimeMonitoringService } from '../services/real-time-monitoring.service';
import { AlertManagementService } from '../services/alert-management.service';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    namespace: '/monitoring'
})
export class MonitoringGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MonitoringGateway.name);
    private connectedClients = new Set<string>();
    private metricsInterval: NodeJS.Timeout;

    constructor(
        private readonly realTimeMonitoringService: RealTimeMonitoringService,
        private readonly alertManagementService: AlertManagementService
    ) {}

    afterInit(server: Server) {
        this.logger.log('Monitoring WebSocket Gateway initialized');
        this.startMetricsBroadcast();
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        this.connectedClients.add(client.id);
        
        client.emit('connection-established', {
            message: 'Connected to monitoring gateway',
            clientId: client.id,
            timestamp: new Date()
        });

        const currentMetrics = this.realTimeMonitoringService.getCurrentMetrics();
        if (currentMetrics) {
            client.emit('metrics-update', currentMetrics);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }

    @SubscribeMessage('subscribe-metrics')
    handleSubscribeMetrics(client: Socket, data: any) {
        this.logger.log(`Client ${client.id} subscribed to metrics updates`);
        
        client.join('metrics-subscribers');
        
        client.emit('subscription-confirmed', {
            type: 'metrics',
            status: 'subscribed',
            timestamp: new Date()
        });

        const currentMetrics = this.realTimeMonitoringService.getCurrentMetrics();
        if (currentMetrics) {
            client.emit('metrics-update', currentMetrics);
        }
    }

    @SubscribeMessage('unsubscribe-metrics')
    handleUnsubscribeMetrics(client: Socket, data: any) {
        this.logger.log(`Client ${client.id} unsubscribed from metrics updates`);
        
        client.leave('metrics-subscribers');
        
        client.emit('subscription-confirmed', {
            type: 'metrics',
            status: 'unsubscribed',
            timestamp: new Date()
        });
    }

    @SubscribeMessage('subscribe-alerts')
    handleSubscribeAlerts(client: Socket, data: any) {
        this.logger.log(`Client ${client.id} subscribed to alert updates`);
        
        client.join('alert-subscribers');
        
        client.emit('subscription-confirmed', {
            type: 'alerts',
            status: 'subscribed',
            timestamp: new Date()
        });

        const recentAlerts = this.alertManagementService.getAlerts({ resolved: false });
        if (recentAlerts.length > 0) {
            client.emit('alerts-update', recentAlerts);
        }
    }

    @SubscribeMessage('unsubscribe-alerts')
    handleUnsubscribeAlerts(client: Socket, data: any) {
        this.logger.log(`Client ${client.id} unsubscribed from alert updates`);
        
        client.leave('alert-subscribers');
        
        client.emit('subscription-confirmed', {
            type: 'alerts',
            status: 'unsubscribed',
            timestamp: new Date()
        });
    }

    @SubscribeMessage('get-current-metrics')
    handleGetCurrentMetrics(client: Socket, data: any) {
        const metrics = this.realTimeMonitoringService.getCurrentMetrics();
        
        client.emit('current-metrics', {
            data: metrics,
            timestamp: new Date()
        });
    }

    @SubscribeMessage('get-active-alerts')
    handleGetActiveAlerts(client: Socket, data: any) {
        const alerts = this.alertManagementService.getAlerts({ resolved: false });
        
        client.emit('active-alerts', {
            data: alerts,
            count: alerts.length,
            timestamp: new Date()
        });
    }

    broadcastMetricsUpdate(metrics: any) {
        this.server.to('metrics-subscribers').emit('metrics-update', {
            data: metrics,
            timestamp: new Date()
        });
    }

    broadcastAlert(alert: any) {
        this.server.to('alert-subscribers').emit('new-alert', {
            data: alert,
            timestamp: new Date()
        });
        
        this.logger.warn(`Broadcasting new alert: ${alert.title}`);
    }

    broadcastAlertUpdate(alert: any) {
        this.server.to('alert-subscribers').emit('alert-update', {
            data: alert,
            timestamp: new Date()
        });
    }

    private startMetricsBroadcast() {
        this.metricsInterval = setInterval(() => {
            if (this.connectedClients.size > 0) {
                const metrics = this.realTimeMonitoringService.getCurrentMetrics();
                if (metrics) {
                    this.broadcastMetricsUpdate(metrics);
                }
            }
        }, 5000); // Broadcast every 5 seconds
    }

    onModuleDestroy() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        this.logger.log('Monitoring WebSocket Gateway destroyed');
    }
}
