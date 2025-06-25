import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Files } from '../../entities/files.entity';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { DocxTemplateService } from '../../services/docx-template.service';
import { PdfService } from '../../services/pdf.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Files]),
        MulterModule.register({
            dest: './uploads',
        }),
    ],
    controllers: [FilesController],
    providers: [FilesService, DocxTemplateService, PdfService],
    exports: [FilesService],
})
export class FilesModule { }
