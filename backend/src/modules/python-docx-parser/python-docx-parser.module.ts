import { Module } from '@nestjs/common';
import { PythonDocxParserController } from '../../controllers/python-docx-parser.controller';
import { PythonDocxParserService } from '../../services/python-docx-parser.service';
import { EnhancedDocxParserModule } from '../enhanced-docx-parser/enhanced-docx-parser.module';

@Module({
    imports: [EnhancedDocxParserModule],
    controllers: [PythonDocxParserController],
    providers: [PythonDocxParserService],
    exports: [PythonDocxParserService]
})
export class PythonDocxParserModule { }
