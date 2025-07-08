import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ExamPackageController } from './exam-package.controller';
import { ExamPackageService } from '../../services/exam-package.service';
import { MediaProcessingService } from '../../services/media-processing.service';
import { ContentReplacementService } from '../../services/content-replacement.service';
import { DocxParserService } from '../../services/docx-parser.service';
import { SpacesService } from '../../services/spaces.service';
import { FilesSpacesService } from '../files/files-spaces.service';
import { Files } from '../../entities/files.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import spacesConfig from '../../config/spaces.config';

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
        FilesSpacesService
    ],
    exports: [
        ExamPackageService,
        MediaProcessingService,
        ContentReplacementService
    ]
})
export class ExamPackageModule {}
