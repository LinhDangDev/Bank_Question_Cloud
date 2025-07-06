import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { getCurrentDatabaseEnvironment, getAvailableEnvironments, setDatabaseEnvironment } from './config/database.config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health & Config')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    @ApiOperation({ summary: 'Get application info' })
    @ApiResponse({ status: 200, description: 'Application information' })
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('health')
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({ status: 200, description: 'Application is healthy' })
    async getHealth() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            database: getCurrentDatabaseEnvironment()
        };
    }

    @Get('ready')
    @ApiOperation({ summary: 'Readiness probe' })
    @ApiResponse({ status: 200, description: 'Application is ready' })
    async getReady() {
        return {
            status: 'ready',
            timestamp: new Date().toISOString()
        };
    }

    @Get('live')
    @ApiOperation({ summary: 'Liveness probe' })
    @ApiResponse({ status: 200, description: 'Application is alive' })
    getLive() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            pid: process.pid
        };
    }

    @Get('db-config')
    @ApiOperation({ summary: 'Get database configuration' })
    @ApiResponse({ status: 200, description: 'Database configuration info' })
    getDatabaseConfig() {
        return {
            currentEnvironment: getCurrentDatabaseEnvironment(),
            availableEnvironments: getAvailableEnvironments()
        };
    }

    @Post('db-config/:environment')
    @ApiOperation({ summary: 'Switch database environment' })
    @ApiResponse({ status: 200, description: 'Database environment switched successfully' })
    @ApiResponse({ status: 400, description: 'Invalid environment specified' })
    switchDatabaseEnvironment(@Param('environment') environment: string) {
        try {
            const newEnv = setDatabaseEnvironment(environment);
            return {
                success: true,
                message: `Switched to ${newEnv} database environment. Restart server to apply changes.`,
                environment: newEnv
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                availableEnvironments: getAvailableEnvironments()
            };
        }
    }
}
