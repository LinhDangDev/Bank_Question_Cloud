import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot(typeOrmConfig),
        KhoaModule,
        CauHoiModule,
        CauTraLoiModule,
        DeThiModule,
        ChiTietDeThiModule,
        AuthModule,
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
