import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";
import * as fs from "fs";
import * as path from "path";

// Database environment profiles with configuration from .env
const environments: Record<string, any> = {
    local: {
        type: "mssql",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || '1433', 10),
        username: process.env.DB_USERNAME || "sa",
        password: process.env.DB_PASSWORD || "Cntt15723@",
        database: process.env.DB_DATABASE || "question_bank",
        options: {
            enableArithAbort: true,
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
            requestTimeout: 60000, // 60 seconds
            connectionTimeout: 30000, // 30 seconds
        }
    },
    server: {
        type: "mssql",
        host: process.env.SERVER_DB_HOST || "103.173.226.35",
        port: parseInt(process.env.SERVER_DB_PORT || "1433", 10),
        username: process.env.SERVER_DB_USERNAME || "sa",
        password: process.env.SERVER_DB_PASSWORD || "Pass123@",
        database: process.env.SERVER_DB_DATABASE || "question_bank",
        options: {
            encrypt: process.env.SERVER_DB_ENCRYPT === 'true',
            trustServerCertificate: process.env.SERVER_DB_TRUST_SERVER_CERTIFICATE !== 'false',
            requestTimeout: 60000, // 60 seconds
            connectionTimeout: 30000, // 30 seconds
        }
    },
};

// Get current active environment from DB_ENV or fallback to local
const getActiveEnvironment = (): string => {
    // Get from process.env first
    const envFromEnvVar = process.env.DB_ENV;
    if (envFromEnvVar && environments[envFromEnvVar]) {
        return envFromEnvVar;
    }

    // Check if DB_ENV_FILE exists and read from it
    const envFilePath = path.join(__dirname, "../../db_env.txt");

    if (fs.existsSync(envFilePath)) {
        const savedEnv = fs.readFileSync(envFilePath, "utf8").trim();
        if (savedEnv && environments[savedEnv]) {
            return savedEnv;
        }
    }

    // Force to local for development
    return "local";
};

// Export for external use
export const getCurrentDatabaseEnvironment = (): string => getActiveEnvironment();

// Change database environment and save to file
export const setDatabaseEnvironment = (env: string): string => {
    if (!environments[env]) {
        throw new Error(`Invalid database environment: ${env}. Available options: ${Object.keys(environments).join(", ")}`);
    }

    const envFilePath = path.join(__dirname, "../../db_env.txt");
    fs.writeFileSync(envFilePath, env, "utf8");
    return env;
};

// Get available environments
export const getAvailableEnvironments = (): string[] => Object.keys(environments);

export default registerAs(
    "database",
    (): TypeOrmModuleOptions => {
        const activeEnv = getActiveEnvironment();
        const envConfig = environments[activeEnv];

        // Log the configuration
        console.log(`[Database] Using ${activeEnv} environment:`, {
            host: envConfig.host,
            port: envConfig.port,
            database: envConfig.database,
            authType: 'sql',
            username: envConfig.username
        });

        // Build the configuration based on environment
        const config = {
            type: envConfig.type,
            host: envConfig.host,
            port: envConfig.port,
            username: envConfig.username,
            password: envConfig.password,
            database: envConfig.database,
            entities: [join(__dirname, "../**/*.entity{.ts,.js}")],
            migrations: [join(__dirname, "../database/migrations/*{.ts,.js}")],
            synchronize: false,
            logging: process.env.NODE_ENV !== "production",
            pool: {
                min: 2,
                max: 50,
            },
            options: envConfig.options
        };

        return config as TypeOrmModuleOptions;
    }
);
