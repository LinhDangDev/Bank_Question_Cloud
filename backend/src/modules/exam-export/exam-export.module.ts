import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamExportService } from './exam-export.service';
import { ExamExportController } from './exam-export.controller';
import { DeThi } from '../../entities/de-thi.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { Files } from '../../entities/files.entity';
import { FilesModule } from '../files/files.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DeThi,
            ChiTietDeThi,
            CauHoi,
            CauTraLoi,
            Files
        ]),
        FilesModule
    ],
    controllers: [ExamExportController],
    providers: [ExamExportService],
    exports: [ExamExportService],
})
export class ExamExportModule {}
