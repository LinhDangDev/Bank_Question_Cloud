import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { getCurrentDatabaseEnvironment, getAvailableEnvironments, setDatabaseEnvironment } from './config/database.config';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('db-config')
    getDatabaseConfig() {
        return {
            currentEnvironment: getCurrentDatabaseEnvironment(),
            availableEnvironments: getAvailableEnvironments()
        };
    }

    @Post('db-config/:environment')
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
