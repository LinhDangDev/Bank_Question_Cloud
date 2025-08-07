import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamWordExportController } from './exam-word-export.controller';
import { ExamWordExportService } from './exam-word-export.service';
import { DeThi } from '../../entities/de-thi.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { DocxTemplateService } from '../../services/docx-template.service';
import { PythonExamWordExportService } from '../../services/python-exam-word-export.service';

/**
 * Module for exam Word export functionality
 * Author: Linh Dang Dev
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([
            DeThi,
            ChiTietDeThi,
            CauHoi,
            CauTraLoi
        ])
    ],
    controllers: [ExamWordExportController],
    providers: [
        ExamWordExportService,
        DocxTemplateService,
        PythonExamWordExportService
    ],
    exports: [ExamWordExportService]
})
export class ExamWordExportModule { }
