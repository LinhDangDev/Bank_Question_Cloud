import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Server,
  Database,
  Network,
  HardDrive,
  Cpu,
  MemoryStick,
  Thermometer,
  DollarSign,
  RefreshCw
} from 'lucide-react';

interface DashboardMetrics {
  networkEfficiency: any;
  memoryFragmentation: any;
  thermalHealth: any;
  storagePatterns: any;
  serviceDependencies: any;
  systemHealth: {
    overall_score: number;
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
  };
  timestamp: Date;
}

interface AnomalyData {
  anomalies: Array<{
    metric: string;
    value: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendedActions: string[];
  }>;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Infrastructure Monitoring Dashboard
 * Author: Linh Dang Dev
 * 
 * Comprehensive monitoring dashboard featuring:
 * - Real-time infrastructure metrics visualization
 * - Predictive analytics and capacity planning
 * - Anomaly detection with severity indicators
 * - Performance trend analysis
 * - Cost optimization recommendations
 * - Interactive charts and alerts
 */
const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyData | null>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [metricsResponse, anomaliesResponse, predictionsResponse] = await Promise.all([
        fetch('/api/monitoring/dashboard/metrics/current'),
        fetch('/api/monitoring/dashboard/anomalies'),
        fetch('/api/monitoring/dashboard/analytics/predictions')
      ]);

      const [metricsData, anomaliesData, predictionsData] = await Promise.all([
        metricsResponse.json(),
        anomaliesResponse.json(),
        predictionsResponse.json()
      ]);

      setMetrics(metricsData);
      setAnomalies(anomaliesData);
      setPredictions(predictionsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generateMockChartData = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      cpu: Math.floor(Math.random() * 40) + 30,
      memory: Math.floor(Math.random() * 30) + 40,
      network: Math.floor(Math.random() * 20) + 10,
      storage: Math.floor(Math.random() * 25) + 15
    }));
  };

  const chartData = generateMockChartData();
  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Infrastructure Monitoring</h1>
          <p className="text-gray-600">Real-time system health and performance analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}</span>
          </Button>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              {getStatusIcon(metrics.systemHealth.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.systemHealth.overall_score}%</div>
              <p className={`text-xs ${getStatusColor(metrics.systemHealth.status)}`}>
                {metrics.systemHealth.status.toUpperCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Efficiency</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.networkEfficiency.network_efficiency_ratio}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.networkEfficiency.packet_loss_pattern} packet loss
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Health</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(100 - metrics.memoryFragmentation.fragmentation_ratio).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.memoryFragmentation.cache_hit_optimization_score.toFixed(1)}% cache efficiency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Dependencies</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.serviceDependencies.dependency_health_score}%</div>
              <p className="text-xs text-muted-foreground">
                Circuit breaker: {metrics.serviceDependencies.circuit_breaker_status}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {metrics && metrics.systemHealth.issues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>System Issues Detected:</strong>
            <ul className="mt-2 list-disc list-inside">
              {metrics.systemHealth.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                    <Line type="monotone" dataKey="network" stroke="#ffc658" name="Network %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Current Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'CPU', value: metrics?.networkEfficiency.network_efficiency_ratio || 65, color: '#8884d8' },
                    { name: 'Memory', value: 100 - (metrics?.memoryFragmentation.fragmentation_ratio || 25), color: '#82ca9d' },
                    { name: 'Storage', value: metrics?.storagePatterns.storage_efficiency_ratio || 78, color: '#ffc658' },
                    { name: 'Network', value: metrics?.networkEfficiency.bandwidth_optimization_score || 82, color: '#ff7300' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Thermometer className="h-5 w-5" />
                    <span>Thermal Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Temperature Trend:</span>
                      <Badge variant="outline">{metrics.thermalHealth.cpu_temperature_trend}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Throttling Events:</span>
                      <span>{metrics.thermalHealth.thermal_throttling_events}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cooling Efficiency:</span>
                      <span>{metrics.thermalHealth.cooling_efficiency_score}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HardDrive className="h-5 w-5" />
                    <span>Storage Patterns</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>I/O Pattern:</span>
                      <Badge variant="outline">{metrics.storagePatterns.io_pattern_analysis}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <span>{metrics.storagePatterns.storage_efficiency_ratio}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fragmentation:</span>
                      <span>{metrics.storagePatterns.disk_fragmentation_level}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5" />
                    <span>Memory Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Fragmentation:</span>
                      <span>{metrics.memoryFragmentation.fragmentation_ratio.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compression:</span>
                      <span>{metrics.memoryFragmentation.memory_compression_efficiency.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GC Frequency:</span>
                      <span>{metrics.memoryFragmentation.gc_performance.gc_frequency.toFixed(1)}/s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="memory" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="network" stackId="1" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          {anomalies && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{anomalies.summary.total}</div>
                    <p className="text-sm text-muted-foreground">Total Anomalies</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">{anomalies.summary.critical}</div>
                    <p className="text-sm text-muted-foreground">Critical</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">{anomalies.summary.high}</div>
                    <p className="text-sm text-muted-foreground">High</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{anomalies.summary.medium}</div>
                    <p className="text-sm text-muted-foreground">Medium</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{anomalies.summary.low}</div>
                    <p className="text-sm text-muted-foreground">Low</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {anomalies.anomalies.map((anomaly, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{anomaly.metric}</CardTitle>
                        <Badge className={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><strong>Current Value:</strong> {anomaly.value}</p>
                        <div>
                          <strong>Recommended Actions:</strong>
                          <ul className="mt-1 list-disc list-inside">
                            {anomaly.recommendedActions.map((action, actionIndex) => (
                              <li key={actionIndex}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {predictions && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Capacity Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictions.predictions?.map((prediction: any, index: number) => (
                      <div key={index} className="border rounded p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">{prediction.service}</h4>
                          <Badge variant={prediction.recommendedScaling.action === 'scale_up' ? 'destructive' : 'default'}>
                            {prediction.recommendedScaling.action.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Current:</span> {prediction.currentCapacity}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Predicted:</span> {prediction.predictedDemand.toFixed(1)}%
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target:</span> {prediction.recommendedScaling.targetCapacity}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence:</span> {(prediction.recommendedScaling.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {predictions.recommendations?.map((recommendation: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <TrendingUp className="h-4 w-4 mt-0.5 text-blue-600" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          {predictions && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Current Monthly Cost</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${predictions.costOptimization?.currentMonthlyCost || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Projected Monthly Cost</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${predictions.costOptimization?.projectedMonthlyCost || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    <span>Potential Savings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${predictions.costOptimization?.potentialSavings || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;
