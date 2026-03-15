import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, CheckCircle, Database, Network, RefreshCw, Server } from 'lucide-react';
import monitoringService, { SystemHealth } from '@/services/monitoringService';

const MonitoringPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemHealth = async () => {
    try {
      setError(null);
      const data = await monitoringService.refreshSystemHealth();
      setHealth(data);
    } catch (fetchError) {
      console.error('Error fetching system health:', fetchError);
      setError('Unable to load monitoring data right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Runtime-backed health overview for the Question Bank backend.</p>
        </div>
        <Button onClick={fetchSystemHealth} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {health && (
        <>
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
                <div className="text-2xl font-bold">{Math.floor(health.uptime / 3600)}h</div>
                <p className="text-xs text-muted-foreground">
                  {Math.floor((health.uptime % 3600) / 60)}m running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dependency Score</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(health.metrics.dependencies?.dependency_health_score ?? 0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on runtime error rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Score</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(health.metrics.network?.network_efficiency_ratio ?? 0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Driven by runtime request success rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monitoring Stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border p-4">
                  <div className="font-medium">Health probes</div>
                  <div className="text-muted-foreground mt-1">Use `/api/health`, `/api/ready`, and `/api/live` for service checks.</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="font-medium">Metrics endpoint</div>
                  <div className="text-muted-foreground mt-1">Use `/api/metrics` for Prometheus scraping and Grafana dashboards.</div>
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">Recommendations</div>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {health.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MonitoringPage;
