import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ExtractionProcessor } from './processors/extraction.processor';
import { ExamService } from '../../services/exam.service';
import { DocxTemplateService } from '../../services/docx-template.service';
import { PdfService } from '../../services/pdf.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { DeThi } from '../../entities/de-thi.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { Phan } from '../../entities/phan.entity';
import { Files } from '../../entities/files.entity';
import { YeuCauRutTrich } from '../../entities/yeu-cau-rut-trich.entity';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'extraction',
        }),
        TypeOrmModule.forFeature([
            CauHoi,
            CauTraLoi,
            DeThi,
            ChiTietDeThi,
            Phan,
            Files,
            YeuCauRutTrich
        ]),
    ],
    providers: [
        ExtractionProcessor,
        ExamService,
        DocxTemplateService,
        PdfService,
    ],
    exports: [
        BullModule,
        ExamService,
        DocxTemplateService,
        PdfService,
    ],
})
export class QueueModule { }
