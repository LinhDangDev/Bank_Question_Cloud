import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CauHoiChoDuyetController } from './cau-hoi-cho-duyet.controller';
import { CauHoiChoDuyetService } from './cau-hoi-cho-duyet.service';
import { CauHoiChoDuyet } from '../../entities/cau-hoi-cho-duyet.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([CauHoiChoDuyet, CauHoi, CauTraLoi])
    ],
    controllers: [CauHoiChoDuyetController],
    providers: [CauHoiChoDuyetService],
    exports: [CauHoiChoDuyetService],
})
export class CauHoiChoDuyetModule {}
