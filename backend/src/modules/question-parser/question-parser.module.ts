import { Module } from '@nestjs/common';
import { QuestionParserController } from '../../controllers/question-parser.controller';
import { DocxParserService } from '../../services/docx-parser.service';
import { StorageService } from '../files/storage.service';
import { ContentReplacementService } from '../multimedia-exam/content-replacement.service';
import { MediaProcessingService } from '../multimedia-exam/media-processing.service';
import { SpacesService } from '../files/spaces.service';
import { ConfigModule } from '@nestjs/config';
import spacesConfig from '../../config/spaces.config';

@Module({
    imports: [
        ConfigModule.forFeature(spacesConfig),
    ],
    controllers: [QuestionParserController],
    providers: [
        DocxParserService,
        StorageService,
        ContentReplacementService,
        MediaProcessingService,
        SpacesService
    ],
    exports: [DocxParserService]
})
export class QuestionParserModule { }
