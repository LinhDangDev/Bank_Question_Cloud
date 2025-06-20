import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeThi } from '../../entities/de-thi.entity';
import { DeThiController } from './de-thi.controller';
import { DeThiService } from './de-thi.service';
import { ExamService } from '../../services/exam.service';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { Phan } from '../../entities/phan.entity';
import { Files } from '../../entities/files.entity';
import { DocxTemplateService } from '../../services/docx-template.service';
import { PdfService } from '../../services/pdf.service';

@Module({
    imports: [TypeOrmModule.forFeature([DeThi, CauHoi, CauTraLoi, ChiTietDeThi, Phan, Files])],
    controllers: [DeThiController],
    providers: [DeThiService, ExamService, DocxTemplateService, PdfService],
    exports: [DeThiService],
})
export class DeThiModule { }
