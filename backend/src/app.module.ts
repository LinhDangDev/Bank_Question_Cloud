import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MonHocModule } from './modules/mon-hoc/mon-hoc.module';
import { CauHoiModule } from './modules/cau-hoi/cau-hoi.module';
import { PhanModule } from './modules/phan/phan.module';
import { CauTraLoiModule } from './modules/cau-tra-loi/cau-tra-loi.module';
import { KhoaModule } from './modules/khoa/khoa.module';
import { CLOModule } from './modules/clo/clo.module';
import { DeThiModule } from './modules/de-thi/de-thi.module';
import { ChiTietDeThiModule } from './modules/chi-tiet-de-thi/chi-tiet-de-thi.module';
import { FilesModule } from './modules/files/files.module';
import { YeuCauRutTrichModule } from './modules/yeu-cau-rut-trich/yeu-cau-rut-trich.module';
import { QueueModule } from './modules/queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuestionsImportModule } from './modules/questions-import/questions-import.module';
import { CauHoiChoDuyetModule } from './modules/cau-hoi-cho-duyet/cau-hoi-cho-duyet.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import databaseConfig from './config/database.config';
import { DbConfigController } from './utils/db-env-switcher';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: path.resolve(__dirname, '..', '.env'),
            load: [databaseConfig],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
                const dbConfig = configService.get('database');
                if (!dbConfig) {
                    throw new Error('Database configuration is missing');
                }
                return dbConfig as TypeOrmModuleOptions;
            },
            inject: [ConfigService],
        }),
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT) || 6379,
                password: process.env.REDIS_PASSWORD,
            },
        }),
        MonHocModule,
        CauHoiModule,
        PhanModule,
        CauTraLoiModule,
        KhoaModule,
        CLOModule,
        DeThiModule,
        ChiTietDeThiModule,
        FilesModule,
        YeuCauRutTrichModule,
        QueueModule,
        AuthModule,
        QuestionsImportModule,
        CauHoiChoDuyetModule,
        UsersModule,
        NotificationModule,
        AuditLogModule,
    ],
    controllers: [AppController, DbConfigController],
    providers: [AppService],
})
export class AppModule { }
