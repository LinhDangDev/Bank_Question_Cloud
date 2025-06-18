import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauHoiController } from './cau-hoi.controller';
import { CauHoiService } from './cau-hoi.service';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { CauTraLoiService } from '../cau-tra-loi/cau-tra-loi.service';
import { CauTraLoiModule } from '../cau-tra-loi/cau-tra-loi.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CauHoi, CauTraLoi]),
        CacheModule.register({
            ttl: 300, // 5 minutes
            max: 200, // maximum number of items in cache
        }),
        CauTraLoiModule,
    ],
    controllers: [CauHoiController],
    providers: [CauHoiService],
    exports: [CauHoiService],
})
export class CauHoiModule { }
