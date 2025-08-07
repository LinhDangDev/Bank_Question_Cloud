import { Module } from '@nestjs/common';
import { EnhancedDocxWasmParserService } from '../../services/enhanced-docx-wasm-parser.service';
import { EnhancedDocxParserService } from '../../services/enhanced-docx-parser.service';
import { SpacesService } from '../../services/spaces.service';
import { EnhancedDocxWasmParserController } from '../../controllers/enhanced-docx-wasm-parser.controller';
import { EnhancedDocxParserController } from '../../controllers/enhanced-docx-parser.controller';

@Module({
    providers: [
        EnhancedDocxWasmParserService,
        EnhancedDocxParserService,
        SpacesService
    ],
    controllers: [
        EnhancedDocxWasmParserController,
        EnhancedDocxParserController
    ],
    exports: [
        EnhancedDocxWasmParserService,
        EnhancedDocxParserService
    ],
})
export class EnhancedDocxParserModule { }
