import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";

export default registerAs(
    "database",
    (): TypeOrmModuleOptions => ({
        type: "mssql",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "1433", 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        options: {
            encrypt: false,
            trustServerCertificate: true,
        },
        entities: [join(__dirname, "../**/*.entity{.ts,.js}")],
        migrations: [join(__dirname, "../database/migrations/*{.ts,.js}")],
        synchronize: process.env.NODE_ENV !== "production",
        logging: process.env.NODE_ENV !== "production",
        pool: {
            min: 2,
            max: 10,
        },
    })
);
