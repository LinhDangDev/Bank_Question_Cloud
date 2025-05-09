import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const {
    DB_HOST = 'localhost',
    DB_PORT = '1433',
    DB_USERNAME = 'sa',
    DB_PASSWORD,
    DB_DATABASE = 'question_bank',
} = process.env;

if (!DB_PASSWORD) {
    throw new Error('DB_PASSWORD is required in environment variables');
}

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'mssql',
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: false, // Tắt tự động sync schema
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
    logging: true,
};
