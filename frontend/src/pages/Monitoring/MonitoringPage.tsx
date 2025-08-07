import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Server,
  Database,
  Network,
  RefreshCw
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  overall_score: number;
  uptime: number;
  last_updated: Date;
}

/**
 * Simple Monitoring Page
 * Author: Linh Dang Dev
 * 
 * Basic monitoring dashboard following AWS Implementation Guide
 */
const MonitoringPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/monitoring/dashboard/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system health...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Real-time system health overview</p>
        </div>
        <Button onClick={fetchSystemHealth} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              {getStatusIcon(health.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.overall_score}%</div>
              <p className={`text-xs ${getStatusColor(health.status)}`}>
                {health.status.toUpperCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(health.uptime / 3600)}h
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.floor((health.uptime % 3600) / 60)}m running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                Connected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">
                All endpoints responding
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AWS CloudWatch Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle>AWS CloudWatch Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Metrics Collection:</span>
              <Badge variant="outline" className="text-green-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Log Aggregation:</span>
              <Badge variant="outline" className="text-green-600">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>X-Ray Tracing:</span>
              <Badge variant="outline" className="text-green-600">Running</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Alarms:</span>
              <Badge variant="outline" className="text-blue-600">Configured</Badge>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800">AWS Monitoring Links:</h4>
            <div className="mt-2 space-y-1 text-sm">
              <div>• CloudWatch Dashboard: <span className="text-blue-600">AWS Console → CloudWatch</span></div>
              <div>• ECS Service Metrics: <span className="text-blue-600">AWS Console → ECS → Services</span></div>
              <div>• RDS Performance: <span className="text-blue-600">AWS Console → RDS → Performance Insights</span></div>
              <div>• X-Ray Service Map: <span className="text-blue-600">AWS Console → X-Ray</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <Activity className="h-6 w-6 mb-2" />
              <span>View Logs</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Server className="h-6 w-6 mb-2" />
              <span>ECS Tasks</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Database className="h-6 w-6 mb-2" />
              <span>DB Status</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <AlertTriangle className="h-6 w-6 mb-2" />
              <span>Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringPage;
