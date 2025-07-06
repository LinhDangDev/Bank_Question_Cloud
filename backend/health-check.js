/**
 * Simple health check endpoint for monitoring
 * Can be used by Digital Ocean health checks, load balancers, etc.
 */

const express = require('express');
const sql = require('mssql');

// Health check configuration
const healthConfig = {
    server: process.env.SERVER_DB_HOST || '103.173.226.35',
    port: parseInt(process.env.SERVER_DB_PORT || '1433'),
    user: process.env.SERVER_DB_USERNAME || 'sa',
    password: process.env.SERVER_DB_PASSWORD || 'Pass123@',
    database: process.env.SERVER_DB_DATABASE || 'question_bank',
    options: {
        encrypt: process.env.SERVER_DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.SERVER_DB_TRUST_SERVER_CERTIFICATE !== 'false',
        enableArithAbort: true,
    },
    pool: {
        max: 1,
        min: 0,
        idleTimeoutMillis: 30000
    },
    connectionTimeout: 5000,
    requestTimeout: 5000
};

/**
 * Comprehensive health check function
 */
async function performHealthCheck() {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
            database: { status: 'unknown', message: '', responseTime: 0 },
            memory: { status: 'unknown', message: '', usage: 0 },
            disk: { status: 'unknown', message: '', available: 0 }
        }
    };

    // Database connectivity check
    try {
        const startTime = Date.now();
        const pool = await sql.connect(healthConfig);
        
        // Simple query to test database
        await pool.request().query('SELECT 1 as test');
        
        const responseTime = Date.now() - startTime;
        
        health.checks.database = {
            status: 'healthy',
            message: 'Database connection successful',
            responseTime: responseTime,
            host: healthConfig.server,
            database: healthConfig.database
        };
        
        await pool.close();
        
    } catch (error) {
        health.status = 'unhealthy';
        health.checks.database = {
            status: 'unhealthy',
            message: error.message,
            responseTime: 0,
            host: healthConfig.server,
            database: healthConfig.database
        };
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    const memoryLimitMB = 512; // Adjust based on your container limits

    if (memoryUsageMB < memoryLimitMB * 0.8) {
        health.checks.memory = {
            status: 'healthy',
            message: 'Memory usage normal',
            usage: Math.round(memoryUsageMB),
            limit: memoryLimitMB
        };
    } else {
        health.status = 'degraded';
        health.checks.memory = {
            status: 'warning',
            message: 'High memory usage',
            usage: Math.round(memoryUsageMB),
            limit: memoryLimitMB
        };
    }

    // Disk space check (simplified)
    try {
        const fs = require('fs');
        const stats = fs.statSync('./');
        health.checks.disk = {
            status: 'healthy',
            message: 'Disk accessible',
            available: 'unknown'
        };
    } catch (error) {
        health.status = 'unhealthy';
        health.checks.disk = {
            status: 'unhealthy',
            message: 'Disk access error',
            available: 0
        };
    }

    return health;
}

/**
 * Express middleware for health check endpoint
 */
function createHealthCheckMiddleware() {
    return async (req, res) => {
        try {
            const health = await performHealthCheck();
            
            // Set appropriate HTTP status code
            let statusCode = 200;
            if (health.status === 'unhealthy') {
                statusCode = 503; // Service Unavailable
            } else if (health.status === 'degraded') {
                statusCode = 200; // Still OK, but with warnings
            }
            
            res.status(statusCode).json(health);
            
        } catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                checks: {
                    database: { status: 'unknown', message: 'Health check failed' },
                    memory: { status: 'unknown', message: 'Health check failed' },
                    disk: { status: 'unknown', message: 'Health check failed' }
                }
            });
        }
    };
}

/**
 * Simple health check (for basic monitoring)
 */
function createSimpleHealthCheck() {
    return (req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    };
}

/**
 * Readiness probe (for Kubernetes/container orchestration)
 */
function createReadinessProbe() {
    return async (req, res) => {
        try {
            // Quick database connectivity check
            const pool = await sql.connect(healthConfig);
            await pool.request().query('SELECT 1');
            await pool.close();
            
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    };
}

/**
 * Liveness probe (for Kubernetes/container orchestration)
 */
function createLivenessProbe() {
    return (req, res) => {
        // Simple check that the process is running
        res.status(200).json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            pid: process.pid
        });
    };
}

module.exports = {
    performHealthCheck,
    createHealthCheckMiddleware,
    createSimpleHealthCheck,
    createReadinessProbe,
    createLivenessProbe
};
