import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Files } from '../../entities/files.entity';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FilesSpacesService } from './files-spaces.service';
import { FilesSpacesController } from './files-spaces.controller';
import { FilesUrlService } from './files-url.service';
import { FilesUrlController } from './files-url.controller';
import { SpacesService } from '../../services/spaces.service';
import { MulterModule } from '@nestjs/platform-express';
import { DocxTemplateService } from '../../services/docx-template.service';
import { PdfService } from '../../services/pdf.service';
import spacesConfig from '../../config/spaces.config';
import { memoryStorage } from 'multer';

@Module({
    imports: [
        TypeOrmModule.forFeature([Files]),
        ConfigModule.forFeature(spacesConfig),
        MulterModule.register({
            storage: memoryStorage(),
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB
            },
        }),
    ],
    controllers: [FilesController, FilesSpacesController, FilesUrlController],
    providers: [FilesService, FilesSpacesService, FilesUrlService, SpacesService, DocxTemplateService, PdfService],
    exports: [FilesService, FilesSpacesService, FilesUrlService, SpacesService],
})
export class FilesModule { }
