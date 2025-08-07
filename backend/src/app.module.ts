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
import { IntegrationModule } from './modules/integration/integration.module';
import { ExamExportModule } from './modules/exam-export/exam-export.module';
import { WordMultimediaModule } from './modules/word-import/word-multimedia.module';
import { MultimediaExamModule } from './modules/multimedia-exam/multimedia-exam.module';
import { ExamPackageModule } from './modules/exam-package/exam-package.module';
import { EnhancedDocxParserModule } from './modules/enhanced-docx-parser/enhanced-docx-parser.module';
import { QuestionParserModule } from './modules/question-parser/question-parser.module';
import { PythonEnhancedDocxParserModule } from './modules/python-enhanced-docx-parser/python-enhanced-docx-parser.module';
import { ExamWordExportModule } from './modules/exam-word-export/exam-word-export.module';
import { PythonDocxParserModule } from './modules/python-docx-parser/python-docx-parser.module';
import databaseConfig from './config/database.config';
import { DbConfigController } from './utils/db-env-switcher';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                path.resolve(process.cwd(), '.env'),
                path.resolve(__dirname, '..', '.env'),
                path.resolve(__dirname, '../..', '.env')
            ],
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
        IntegrationModule,
        ExamExportModule,
        WordMultimediaModule,
        MultimediaExamModule,
        ExamPackageModule,
        EnhancedDocxParserModule,
        QuestionParserModule,
        PythonDocxParserModule,
        PythonEnhancedDocxParserModule,
        ExamWordExportModule,
    ],
    controllers: [AppController, DbConfigController],
    providers: [AppService],
})
export class AppModule { }
