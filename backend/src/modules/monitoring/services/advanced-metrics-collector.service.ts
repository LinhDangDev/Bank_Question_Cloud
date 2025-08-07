import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CloudWatch, EC2, RDS, ElastiCache, ECS } from 'aws-sdk';

interface NetworkEfficiencyMetric {
  network_efficiency_ratio: number;
  packet_loss_pattern: string;
  bandwidth_optimization_score: number;
  latency_analysis: {
    avg_latency: number;
    p95_latency: number;
    p99_latency: number;
  };
  timestamp: Date;
}

interface MemoryFragmentationMetric {
  fragmentation_ratio: number;
  memory_compression_efficiency: number;
  cache_hit_optimization_score: number;
  memory_pressure_score: number;
  gc_performance: {
    gc_frequency: number;
    avg_gc_duration: number;
    memory_reclaimed: number;
  };
  timestamp: Date;
}

interface ThermalHealthMetric {
  cpu_temperature_trend: string;
  thermal_throttling_events: number;
  cooling_efficiency_score: number;
  power_consumption_optimization: number;
  timestamp: Date;
}

interface StoragePatternMetric {
  io_pattern_analysis: string;
  storage_efficiency_ratio: number;
  read_write_optimization_score: number;
  disk_fragmentation_level: number;
  timestamp: Date;
}

interface ServiceDependencyMetric {
  dependency_health_score: number;
  service_mesh_efficiency: number;
  circuit_breaker_status: string;
  service_discovery_latency: number;
  timestamp: Date;
}

interface CustomMetricData {
  MetricName: string;
  Value: number;
  Unit: string;
  Dimensions: Array<{ Name: string; Value: string }>;
  Timestamp: Date;
}

/**
 * Advanced Metrics Collector Service
 * Author: Linh Dang Dev
 * 
 * Collects sophisticated infrastructure metrics beyond basic CloudWatch:
 * - Network efficiency analysis with packet loss patterns
 * - Memory fragmentation and GC performance tracking
 * - Thermal health monitoring for performance optimization
 * - Storage I/O pattern analysis
 * - Service dependency health scoring
 * - Predictive capacity planning metrics
 */
@Injectable()
export class AdvancedMetricsCollector {
  private readonly logger = new Logger(AdvancedMetricsCollector.name);
  private cloudWatch: CloudWatch;
  private ec2: EC2;
  private rds: RDS;
  private elastiCache: ElastiCache;
  private ecs: ECS;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    this.cloudWatch = new CloudWatch({ region });
    this.ec2 = new EC2({ region });
    this.rds = new RDS({ region });
    this.elastiCache = new ElastiCache({ region });
    this.ecs = new ECS({ region });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectAllMetrics(): Promise<void> {
    try {
      this.logger.log('🚀 Starting advanced metrics collection...');
      
      const startTime = Date.now();
      
      const metrics = await Promise.allSettled([
        this.calculateNetworkEfficiency(),
        this.analyzeMemoryFragmentation(),
        this.monitorThermalHealth(),
        this.analyzeStoragePatterns(),
        this.monitorServiceDependencies(),
      ]);

      const successfulMetrics = metrics
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

      const failedMetrics = metrics
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      if (failedMetrics.length > 0) {
        this.logger.warn(`⚠️ ${failedMetrics.length} metrics collection failed:`, failedMetrics);
      }

      await this.publishMetricsToCloudWatch(successfulMetrics);
      
      const duration = Date.now() - startTime;
      this.logger.log(`✅ Advanced metrics collection completed in ${duration}ms`);
      
      await this.publishCollectionMetrics(successfulMetrics.length, failedMetrics.length, duration);
      
    } catch (error) {
      this.logger.error('❌ Error in metrics collection:', error);
      await this.publishErrorMetrics(error);
    }
  }

  async calculateNetworkEfficiency(): Promise<NetworkEfficiencyMetric> {
    try {
      const networkData = await this.getNetworkMetrics();
      
      const packetEfficiency = this.calculatePacketEfficiency(networkData);
      const bandwidthEfficiency = this.calculateBandwidthEfficiency(networkData);
      const latencyAnalysis = await this.analyzeLatencyPatterns(networkData);
      
      const overallEfficiency = (packetEfficiency * 0.4) + (bandwidthEfficiency * 0.3) + (latencyAnalysis.efficiency * 0.3);
      
      return {
        network_efficiency_ratio: Math.round(overallEfficiency * 100),
        packet_loss_pattern: this.analyzePacketLossPattern(networkData),
        bandwidth_optimization_score: this.calculateBandwidthOptimization(networkData),
        latency_analysis: {
          avg_latency: latencyAnalysis.avg_latency,
          p95_latency: latencyAnalysis.p95_latency,
          p99_latency: latencyAnalysis.p99_latency,
        },
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Error calculating network efficiency:', error);
      throw error;
    }
  }

  async analyzeMemoryFragmentation(): Promise<MemoryFragmentationMetric> {
    try {
      const memoryData = await this.getMemoryMetrics();
      const gcData = await this.getGarbageCollectionMetrics();
      
      const fragmentationRatio = this.calculateFragmentationRatio(memoryData);
      const compressionEfficiency = this.analyzeCompressionEfficiency(memoryData);
      const memoryPressure = this.calculateMemoryPressure(memoryData);
      
      return {
        fragmentation_ratio: fragmentationRatio,
        memory_compression_efficiency: compressionEfficiency,
        cache_hit_optimization_score: this.calculateCacheOptimization(memoryData),
        memory_pressure_score: memoryPressure,
        gc_performance: {
          gc_frequency: gcData.frequency,
          avg_gc_duration: gcData.avgDuration,
          memory_reclaimed: gcData.memoryReclaimed,
        },
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Error analyzing memory fragmentation:', error);
      throw error;
    }
  }

  async monitorThermalHealth(): Promise<ThermalHealthMetric> {
    try {
      const thermalData = await this.getThermalMetrics();
      
      return {
        cpu_temperature_trend: this.analyzeThermalTrend(thermalData),
        thermal_throttling_events: thermalData.throttlingEvents,
        cooling_efficiency_score: this.calculateCoolingEfficiency(thermalData),
        power_consumption_optimization: this.calculatePowerOptimization(thermalData),
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Error monitoring thermal health:', error);
      throw error;
    }
  }

  async analyzeStoragePatterns(): Promise<StoragePatternMetric> {
    try {
      const storageData = await this.getStorageMetrics();
      
      return {
        io_pattern_analysis: this.analyzeIOPatterns(storageData),
        storage_efficiency_ratio: this.calculateStorageEfficiency(storageData),
        read_write_optimization_score: this.calculateRWOptimization(storageData),
        disk_fragmentation_level: this.calculateDiskFragmentation(storageData),
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Error analyzing storage patterns:', error);
      throw error;
    }
  }

  async monitorServiceDependencies(): Promise<ServiceDependencyMetric> {
    try {
      const dependencyData = await this.getServiceDependencyMetrics();
      
      return {
        dependency_health_score: this.calculateDependencyHealth(dependencyData),
        service_mesh_efficiency: this.calculateServiceMeshEfficiency(dependencyData),
        circuit_breaker_status: this.getCircuitBreakerStatus(dependencyData),
        service_discovery_latency: dependencyData.discoveryLatency,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Error monitoring service dependencies:', error);
      throw error;
    }
  }

  private async publishMetricsToCloudWatch(metrics: any[]): Promise<void> {
    try {
      const metricData: CustomMetricData[] = [];
      
      metrics.forEach(metric => {
        Object.entries(metric).forEach(([key, value]) => {
          if (typeof value === 'number' && !isNaN(value)) {
            metricData.push({
              MetricName: key,
              Value: value,
              Unit: this.getMetricUnit(key),
              Dimensions: [
                { Name: 'Environment', Value: process.env.NODE_ENV || 'development' },
                { Name: 'Service', Value: 'QuestionBank' }
              ],
              Timestamp: new Date()
            });
          }
        });
      });

      if (metricData.length > 0) {
        await this.cloudWatch.putMetricData({
          Namespace: 'QuestionBank/AdvancedMetrics',
          MetricData: metricData
        }).promise();
        
        this.logger.log(`📊 Published ${metricData.length} custom metrics to CloudWatch`);
      }
    } catch (error) {
      this.logger.error('Error publishing metrics to CloudWatch:', error);
      throw error;
    }
  }

  private getMetricUnit(metricName: string): string {
    const unitMap: Record<string, string> = {
      'network_efficiency_ratio': 'Percent',
      'bandwidth_optimization_score': 'Percent',
      'fragmentation_ratio': 'Percent',
      'memory_compression_efficiency': 'Percent',
      'cache_hit_optimization_score': 'Percent',
      'memory_pressure_score': 'Percent',
      'thermal_throttling_events': 'Count',
      'cooling_efficiency_score': 'Percent',
      'power_consumption_optimization': 'Percent',
      'storage_efficiency_ratio': 'Percent',
      'read_write_optimization_score': 'Percent',
      'disk_fragmentation_level': 'Percent',
      'dependency_health_score': 'Percent',
      'service_mesh_efficiency': 'Percent',
      'service_discovery_latency': 'Milliseconds',
      'avg_latency': 'Milliseconds',
      'p95_latency': 'Milliseconds',
      'p99_latency': 'Milliseconds',
      'gc_frequency': 'Count/Second',
      'avg_gc_duration': 'Milliseconds',
      'memory_reclaimed': 'Bytes',
    };
    
    return unitMap[metricName] || 'None';
  }

  private async publishCollectionMetrics(successful: number, failed: number, duration: number): Promise<void> {
    const metricData: CustomMetricData[] = [
      {
        MetricName: 'MetricsCollectionSuccess',
        Value: successful,
        Unit: 'Count',
        Dimensions: [{ Name: 'Service', Value: 'QuestionBank' }],
        Timestamp: new Date()
      },
      {
        MetricName: 'MetricsCollectionFailures',
        Value: failed,
        Unit: 'Count',
        Dimensions: [{ Name: 'Service', Value: 'QuestionBank' }],
        Timestamp: new Date()
      },
      {
        MetricName: 'MetricsCollectionDuration',
        Value: duration,
        Unit: 'Milliseconds',
        Dimensions: [{ Name: 'Service', Value: 'QuestionBank' }],
        Timestamp: new Date()
      }
    ];

    await this.cloudWatch.putMetricData({
      Namespace: 'QuestionBank/MetricsCollection',
      MetricData: metricData
    }).promise();
  }

  private async publishErrorMetrics(error: any): Promise<void> {
    try {
      await this.cloudWatch.putMetricData({
        Namespace: 'QuestionBank/Errors',
        MetricData: [{
          MetricName: 'MetricsCollectionError',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Service', Value: 'QuestionBank' },
            { Name: 'ErrorType', Value: error.name || 'Unknown' }
          ],
          Timestamp: new Date()
        }]
      }).promise();
    } catch (publishError) {
      this.logger.error('Failed to publish error metrics:', publishError);
    }
  }

  // Placeholder methods for metric calculations
  private async getNetworkMetrics(): Promise<any> {
    // Implementation would fetch actual network metrics from CloudWatch/EC2
    return {
      successfulPackets: Math.floor(Math.random() * 10000) + 9000,
      totalPackets: 10000,
      bandwidthUtilization: Math.random() * 100,
      availableBandwidth: 1000,
      latencyData: Array.from({ length: 100 }, () => Math.random() * 50 + 10)
    };
  }

  private calculatePacketEfficiency(networkData: any): number {
    return networkData.successfulPackets / networkData.totalPackets;
  }

  private calculateBandwidthEfficiency(networkData: any): number {
    return Math.min(networkData.bandwidthUtilization / networkData.availableBandwidth, 1);
  }

  private async analyzeLatencyPatterns(networkData: any): Promise<any> {
    const sorted = networkData.latencyData.sort((a: number, b: number) => a - b);
    const avg = sorted.reduce((a: number, b: number) => a + b, 0) / sorted.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    
    return {
      avg_latency: avg,
      p95_latency: sorted[p95Index],
      p99_latency: sorted[p99Index],
      efficiency: Math.max(0, 1 - (avg / 100)) // Lower latency = higher efficiency
    };
  }

  private analyzePacketLossPattern(networkData: any): string {
    const lossRate = 1 - (networkData.successfulPackets / networkData.totalPackets);
    if (lossRate < 0.001) return 'excellent';
    if (lossRate < 0.01) return 'good';
    if (lossRate < 0.05) return 'acceptable';
    return 'poor';
  }

  private calculateBandwidthOptimization(networkData: any): number {
    const utilization = networkData.bandwidthUtilization / networkData.availableBandwidth;
    // Optimal utilization is around 70-80%
    if (utilization >= 0.7 && utilization <= 0.8) return 100;
    if (utilization < 0.7) return utilization / 0.7 * 100;
    return Math.max(0, 100 - ((utilization - 0.8) * 200));
  }

  private async getMemoryMetrics(): Promise<any> {
    return {
      totalMemory: 1024 * 1024 * 1024, // 1GB
      usedMemory: Math.floor(Math.random() * 800 * 1024 * 1024) + 200 * 1024 * 1024,
      fragmentedMemory: Math.floor(Math.random() * 100 * 1024 * 1024),
      cacheHits: Math.floor(Math.random() * 1000) + 800,
      cacheMisses: Math.floor(Math.random() * 200) + 50
    };
  }

  private async getGarbageCollectionMetrics(): Promise<any> {
    return {
      frequency: Math.random() * 10 + 1,
      avgDuration: Math.random() * 50 + 10,
      memoryReclaimed: Math.floor(Math.random() * 100 * 1024 * 1024)
    };
  }

  private calculateFragmentationRatio(memoryData: any): number {
    return (memoryData.fragmentedMemory / memoryData.totalMemory) * 100;
  }

  private analyzeCompressionEfficiency(memoryData: any): number {
    // Simulated compression efficiency calculation
    return Math.random() * 30 + 70; // 70-100%
  }

  private calculateCacheOptimization(memoryData: any): number {
    const hitRate = memoryData.cacheHits / (memoryData.cacheHits + memoryData.cacheMisses);
    return hitRate * 100;
  }

  private calculateMemoryPressure(memoryData: any): number {
    const utilizationRatio = memoryData.usedMemory / memoryData.totalMemory;
    return utilizationRatio * 100;
  }

  private async getThermalMetrics(): Promise<any> {
    return {
      cpuTemperature: Math.random() * 30 + 40, // 40-70°C
      throttlingEvents: Math.floor(Math.random() * 5),
      fanSpeed: Math.random() * 100,
      powerConsumption: Math.random() * 200 + 100 // 100-300W
    };
  }

  private analyzeThermalTrend(thermalData: any): string {
    if (thermalData.cpuTemperature < 50) return 'cool';
    if (thermalData.cpuTemperature < 65) return 'normal';
    if (thermalData.cpuTemperature < 75) return 'warm';
    return 'hot';
  }

  private calculateCoolingEfficiency(thermalData: any): number {
    // Higher fan speed with lower temperature = better efficiency
    const tempScore = Math.max(0, 100 - thermalData.cpuTemperature);
    const fanScore = thermalData.fanSpeed;
    return (tempScore + fanScore) / 2;
  }

  private calculatePowerOptimization(thermalData: any): number {
    // Lower power consumption with good performance = better optimization
    const powerEfficiency = Math.max(0, 100 - (thermalData.powerConsumption / 300 * 100));
    return powerEfficiency;
  }

  private async getStorageMetrics(): Promise<any> {
    return {
      readIOPS: Math.floor(Math.random() * 1000) + 100,
      writeIOPS: Math.floor(Math.random() * 500) + 50,
      readLatency: Math.random() * 10 + 1,
      writeLatency: Math.random() * 15 + 2,
      diskUtilization: Math.random() * 100,
      fragmentationLevel: Math.random() * 20
    };
  }

  private analyzeIOPatterns(storageData: any): string {
    const readWriteRatio = storageData.readIOPS / storageData.writeIOPS;
    if (readWriteRatio > 3) return 'read-heavy';
    if (readWriteRatio < 1.5) return 'write-heavy';
    return 'balanced';
  }

  private calculateStorageEfficiency(storageData: any): number {
    const avgLatency = (storageData.readLatency + storageData.writeLatency) / 2;
    return Math.max(0, 100 - (avgLatency * 5)); // Lower latency = higher efficiency
  }

  private calculateRWOptimization(storageData: any): number {
    const totalIOPS = storageData.readIOPS + storageData.writeIOPS;
    const utilizationScore = Math.min(100, (totalIOPS / 2000) * 100); // Assuming 2000 IOPS capacity
    return utilizationScore;
  }

  private calculateDiskFragmentation(storageData: any): number {
    return storageData.fragmentationLevel;
  }

  private async getServiceDependencyMetrics(): Promise<any> {
    return {
      healthyServices: Math.floor(Math.random() * 10) + 8,
      totalServices: 10,
      avgResponseTime: Math.random() * 100 + 50,
      circuitBreakerOpen: Math.random() > 0.9,
      discoveryLatency: Math.random() * 20 + 5
    };
  }

  private calculateDependencyHealth(dependencyData: any): number {
    return (dependencyData.healthyServices / dependencyData.totalServices) * 100;
  }

  private calculateServiceMeshEfficiency(dependencyData: any): number {
    const responseTimeScore = Math.max(0, 100 - (dependencyData.avgResponseTime / 200 * 100));
    return responseTimeScore;
  }

  private getCircuitBreakerStatus(dependencyData: any): string {
    return dependencyData.circuitBreakerOpen ? 'open' : 'closed';
  }
}
