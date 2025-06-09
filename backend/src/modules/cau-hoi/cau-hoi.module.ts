import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauHoiController } from './cau-hoi.controller';
import { CauHoiService } from './cau-hoi.service';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([CauHoi, CauTraLoi]),
    ],
    controllers: [CauHoiController],
    providers: [CauHoiService],
    exports: [CauHoiService],
})
export class CauHoiModule { }
