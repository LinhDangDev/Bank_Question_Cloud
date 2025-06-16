import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { KhoaModule } from './modules/khoa/khoa.module';
import { CauHoiModule } from './modules/cau-hoi/cau-hoi.module';
import { CauTraLoiModule } from './modules/cau-tra-loi/cau-tra-loi.module';
import { DeThiModule } from './modules/de-thi/de-thi.module';
import { ChiTietDeThiModule } from './modules/chi-tiet-de-thi/chi-tiet-de-thi.module';
import { AuthModule } from './modules/auth/auth.module';
import { SkipAuthMiddleware } from './middleware/skip-auth.middleware';
import { MonHocModule } from './modules/mon-hoc/mon-hoc.module';
import { PhanModule } from './modules/phan/phan.module';
import { CLOModule } from './modules/clo/clo.module';
import { YeuCauRutTrichModule } from './modules/yeu-cau-rut-trich/yeu-cau-rut-trich.module';
import { QueueModule } from './modules/queue/queue.module';
import { CacheModule } from '@nestjs/cache-manager';
import { FilesModule } from './modules/files/files.module';
import { QuestionsImportModule } from './modules/questions-import/questions-import.module';


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot(typeOrmConfig),
        BullModule.forRoot({
            redis: {
                host: 'localhost',
                port: 6379,
            },
        }),
        CacheModule.register({
            isGlobal: true,
            ttl: 60 * 5, // 5 minutes
        }),
        KhoaModule,
        MonHocModule,
        PhanModule,
        CLOModule,
        CauHoiModule,
        CauTraLoiModule,
        DeThiModule,
        ChiTietDeThiModule,
        AuthModule,
        YeuCauRutTrichModule,
        QueueModule,
        FilesModule,
        QuestionsImportModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(SkipAuthMiddleware)
            .forRoutes('*');
    }
}
