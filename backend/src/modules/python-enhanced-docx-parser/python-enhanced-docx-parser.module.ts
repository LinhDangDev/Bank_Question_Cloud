import { Module } from '@nestjs/common';
import { PythonEnhancedDocxParserController } from '../../controllers/python-enhanced-docx-parser.controller';
import { PythonEnhancedDocxParserService } from '../../services/python-enhanced-docx-parser.service';

/**
 * Python Enhanced DOCX Parser Module
 * Author: Linh Dang Dev
 */
@Module({
    controllers: [PythonEnhancedDocxParserController],
    providers: [PythonEnhancedDocxParserService],
    exports: [PythonEnhancedDocxParserService],
})
export class PythonEnhancedDocxParserModule {}
