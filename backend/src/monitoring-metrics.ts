import os from 'os';

interface HttpMetricsState {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTimeMs: number;
}

const httpMetricsState: HttpMetricsState = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTimeMs: 0,
};

export function recordHttpRequest(statusCode: number, durationMs: number) {
  httpMetricsState.totalRequests += 1;
  httpMetricsState.totalResponseTimeMs += durationMs;

  if (statusCode >= 200 && statusCode < 400) {
    httpMetricsState.successfulRequests += 1;
    return;
  }

  httpMetricsState.failedRequests += 1;
}

export function getHttpMetricsSnapshot() {
  const averageResponseTime =
    httpMetricsState.totalRequests > 0
      ? httpMetricsState.totalResponseTimeMs / httpMetricsState.totalRequests
      : 0;

  const errorRate =
    httpMetricsState.totalRequests > 0
      ? (httpMetricsState.failedRequests / httpMetricsState.totalRequests) * 100
      : 0;

  return {
    totalRequests: httpMetricsState.totalRequests,
    successfulRequests: httpMetricsState.successfulRequests,
    failedRequests: httpMetricsState.failedRequests,
    averageResponseTime,
    errorRate,
  };
}

export function getRuntimeMetricsSnapshot() {
  const memoryUsage = process.memoryUsage();
  const totalSystemMemory = os.totalmem();
  const freeSystemMemory = os.freemem();
  const cpuCount = Math.max(os.cpus().length, 1);
  const loadAverage = os.loadavg();
  const cpuUtilization = Math.min((loadAverage[0] / cpuCount) * 100, 100);
  const memoryUtilization = Math.min((memoryUsage.rss / totalSystemMemory) * 100, 100);

  return {
    timestamp: new Date(),
    cpu: {
      utilization: Number(cpuUtilization.toFixed(2)),
      loadAverage1m: Number(loadAverage[0].toFixed(2)),
      coreCount: cpuCount,
    },
    memory: {
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      availableSystemMemory: freeSystemMemory,
      totalSystemMemory,
      utilization: Number(memoryUtilization.toFixed(2)),
    },
    system: {
      uptime: process.uptime(),
      platform: os.platform(),
      hostname: os.hostname(),
      nodeVersion: process.version,
    },
    requests: getHttpMetricsSnapshot(),
  };
}

export function renderPrometheusMetrics() {
  const runtime = getRuntimeMetricsSnapshot();
  const lines = [
    '# HELP question_bank_process_uptime_seconds Node.js process uptime in seconds.',
    '# TYPE question_bank_process_uptime_seconds gauge',
    `question_bank_process_uptime_seconds ${runtime.system.uptime}`,
    '# HELP question_bank_process_resident_memory_bytes Resident set size in bytes.',
    '# TYPE question_bank_process_resident_memory_bytes gauge',
    `question_bank_process_resident_memory_bytes ${runtime.memory.rss}`,
    '# HELP question_bank_process_heap_used_bytes Node.js heap used in bytes.',
    '# TYPE question_bank_process_heap_used_bytes gauge',
    `question_bank_process_heap_used_bytes ${runtime.memory.heapUsed}`,
    '# HELP question_bank_process_heap_total_bytes Node.js heap total in bytes.',
    '# TYPE question_bank_process_heap_total_bytes gauge',
    `question_bank_process_heap_total_bytes ${runtime.memory.heapTotal}`,
    '# HELP question_bank_system_memory_utilization_percent Process RSS as percentage of total system memory.',
    '# TYPE question_bank_system_memory_utilization_percent gauge',
    `question_bank_system_memory_utilization_percent ${runtime.memory.utilization}`,
    '# HELP question_bank_system_cpu_load_percent 1 minute load average as percentage of CPU cores.',
    '# TYPE question_bank_system_cpu_load_percent gauge',
    `question_bank_system_cpu_load_percent ${runtime.cpu.utilization}`,
    '# HELP question_bank_http_requests_total Total number of HTTP requests handled.',
    '# TYPE question_bank_http_requests_total counter',
    `question_bank_http_requests_total ${runtime.requests.totalRequests}`,
    '# HELP question_bank_http_requests_success_total Total number of successful HTTP requests.',
    '# TYPE question_bank_http_requests_success_total counter',
    `question_bank_http_requests_success_total ${runtime.requests.successfulRequests}`,
    '# HELP question_bank_http_requests_failed_total Total number of failed HTTP requests.',
    '# TYPE question_bank_http_requests_failed_total counter',
    `question_bank_http_requests_failed_total ${runtime.requests.failedRequests}`,
    '# HELP question_bank_http_request_duration_average_milliseconds Average HTTP response time in milliseconds.',
    '# TYPE question_bank_http_request_duration_average_milliseconds gauge',
    `question_bank_http_request_duration_average_milliseconds ${runtime.requests.averageResponseTime}`,
    '# HELP question_bank_http_error_rate_percent HTTP error rate percentage.',
    '# TYPE question_bank_http_error_rate_percent gauge',
    `question_bank_http_error_rate_percent ${runtime.requests.errorRate}`,
  ];

  return `${lines.join('\n')}\n`;
}
