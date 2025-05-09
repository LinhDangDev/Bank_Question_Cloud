import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { CauHoiModule } from './modules/cau-hoi/cau-hoi.module';
import { CauTraLoiModule } from './modules/cau-tra-loi/cau-tra-loi.module';
import { ChiTietDeThiModule } from './modules/chi-tiet-de-thi/chi-tiet-de-thi.module';
import { DeThiModule } from './modules/de-thi/de-thi.module';

@Module({
    imports: [
        TypeOrmModule.forRoot(typeOrmConfig),
        CauHoiModule,
        CauTraLoiModule,
        ChiTietDeThiModule,
        DeThiModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
