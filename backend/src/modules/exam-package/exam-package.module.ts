import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ExamPackageController } from './exam-package.controller';
import { ExamPackageService } from './exam-package.service';
import { MediaProcessingService } from '../multimedia-exam/media-processing.service';
import { ContentReplacementService } from '../multimedia-exam/content-replacement.service';
import { DocxParserService } from '../../services/docx-parser.service';
import { SpacesService } from '../files/spaces.service';
import { FilesSpacesService } from '../files/files-spaces.service';
import { Files } from '../../entities/files.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import spacesConfig from '../../config/spaces.config';
import { StorageService } from '../files/storage.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Files, CauHoi, CauTraLoi]),
        ConfigModule.forFeature(spacesConfig),
        MulterModule.register({
            dest: './temp/uploads',
            limits: {
                fileSize: 100 * 1024 * 1024, // 100MB
            }
        }),
    ],
    controllers: [ExamPackageController],
    providers: [
        ExamPackageService,
        MediaProcessingService,
        ContentReplacementService,
        DocxParserService,
        SpacesService,
        FilesSpacesService,
        StorageService
    ],
    exports: [
        ExamPackageService,
        MediaProcessingService,
        ContentReplacementService,
        DocxParserService,
        StorageService
    ]
})
export class ExamPackageModule { }
