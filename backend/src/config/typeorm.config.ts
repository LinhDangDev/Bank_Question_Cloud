import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try to load .env file explicitly with better logging
const envPath = path.resolve(__dirname, '../../.env');
console.log(`Looking for .env file at: ${envPath}`);
console.log(`File exists: ${fs.existsSync(envPath)}`);

if (fs.existsSync(envPath)) {
    console.log(`Loading database config from ${envPath}`);
    dotenv.config({ path: envPath });
} else {
    console.warn('No .env file found for database config, using default environment variables');
    dotenv.config();
}

// Extract environment variables with defaults
const {
    DB_HOST = 'localhost',
    DB_PORT = '1433',
    DB_USERNAME = 'sa',
    DB_PASSWORD,
    DB_DATABASE = 'question_bank',
    DB_ENV = 'local', // 'local' or 'server'
    SERVER_DB_HOST,
    SERVER_DB_PORT,
    SERVER_DB_USERNAME,
    SERVER_DB_PASSWORD,
    SERVER_DB_DATABASE,
} = process.env;

// Log all database config values (except password)
console.log('Database config values:', {
    DB_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_DATABASE,
    SERVER_DB_HOST,
    SERVER_DB_PORT,
    SERVER_DB_USERNAME,
    SERVER_DB_DATABASE
});

// Set host and other settings based on DB_ENV
let host = DB_HOST;
let port = parseInt(DB_PORT, 10);
let username = DB_USERNAME;
let password = DB_PASSWORD;
let database = DB_DATABASE;

// If DB_ENV is set to 'server', use server settings
if (DB_ENV === 'server' && SERVER_DB_HOST) {
    console.log('Using server database configuration');
    host = SERVER_DB_HOST;
    port = SERVER_DB_PORT ? parseInt(SERVER_DB_PORT, 10) : port;
    username = SERVER_DB_USERNAME || username;
    password = SERVER_DB_PASSWORD || password;
    database = SERVER_DB_DATABASE || database;
} else {
    console.log('Using local database configuration');
}

// Better error handling for missing password
if (!password) {
    console.error('ERROR: Database password is required in environment variables');
    console.error('Please make sure your .env file has DB_PASSWORD set');
    console.error('Current database config:', { host, port, username, database });
}

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'mssql',
    host,
    port,
    username,
    password,
    database,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: process.env.NODE_ENV !== 'production', // Only enable in development
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
    logging: process.env.NODE_ENV !== 'production',
};
