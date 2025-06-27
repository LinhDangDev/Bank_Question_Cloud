import { Controller, Get, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { getCurrentDatabaseEnvironment, setDatabaseEnvironment, getAvailableEnvironments } from '../config/database.config';

@Controller('db-config')
export class DbConfigController {
    // Get current database environment and available options
    @Get()
    getCurrentDbConfig() {
        try {
            const current = getCurrentDatabaseEnvironment();
            const available = getAvailableEnvironments();

            return {
                current,
                available,
                message: `Currently using ${current.toUpperCase()} database environment`
            };
        } catch (error) {
            throw new HttpException('Failed to get database configuration', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Switch to a specific database environment
    @Post(':env')
    switchDbEnvironment(@Param('env') env: string) {
        try {
            const available = getAvailableEnvironments();

            if (!available.includes(env)) {
                throw new HttpException(
                    `Invalid environment: ${env}. Available options: ${available.join(', ')}`,
                    HttpStatus.BAD_REQUEST
                );
            }

            setDatabaseEnvironment(env);

            return {
                success: true,
                message: `Database environment switched to ${env.toUpperCase()}. You need to restart the server for changes to take effect.`
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to switch database environment', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
