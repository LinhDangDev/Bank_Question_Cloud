import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultimediaExamController } from './multimedia-exam.controller';
import { MultimediaExamService } from './multimedia-exam.service';
import { DeThi } from '../../entities/de-thi.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { Phan } from '../../entities/phan.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { Files } from '../../entities/files.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DeThi,
            ChiTietDeThi,
            Phan,
            CauHoi,
            CauTraLoi,
            Files
        ])
    ],
    controllers: [MultimediaExamController],
    providers: [MultimediaExamService],
    exports: [MultimediaExamService]
})
export class MultimediaExamModule { }
