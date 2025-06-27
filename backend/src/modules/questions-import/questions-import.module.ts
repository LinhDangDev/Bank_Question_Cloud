import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { QuestionsImportController } from './questions-import.controller';
import { QuestionsImportService } from './questions-import.service';
import { DocxParserService } from '../../services/docx-parser.service';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { CauHoiChoDuyet } from '../../entities/cau-hoi-cho-duyet.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([CauHoi, CauTraLoi, CauHoiChoDuyet]),
        MulterModule.register({
            dest: './uploads/temp',
        }),
    ],
    controllers: [QuestionsImportController],
    providers: [QuestionsImportService, DocxParserService],
    exports: [QuestionsImportService],
})
export class QuestionsImportModule { }
