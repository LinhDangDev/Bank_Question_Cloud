import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    Logger,
    Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PythonDocxParserService } from '../services/python-docx-parser.service';
import { MulterFile } from '../interfaces/multer-file.interface';

@ApiTags('Python DOCX Parser')
@Controller('python-docx-parser')
export class PythonDocxParserController {
    private readonly logger = new Logger(PythonDocxParserController.name);

    constructor(
        private readonly pythonDocxParserService: PythonDocxParserService
    ) { }

    @Post('parse')
    @ApiOperation({
        summary: 'Parse Word document with Python for better answer recognition',
        description: 'Upload a Word document and parse it using Python for answer recognition and Node.js for image extraction'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Word document file (.docx)'
                },
                processImages: {
                    type: 'boolean',
                    description: 'Whether to extract images from the document',
                    default: true
                },
                extractStyles: {
                    type: 'boolean',
                    description: 'Whether to extract style information',
                    default: true
                },
                preserveLatex: {
                    type: 'boolean',
                    description: 'Whether to preserve LaTeX expressions',
                    default: true
                }
            }
        }
    })
    @UseInterceptors(FileInterceptor('file'))
    async parseWordDocument(
        @UploadedFile() file: MulterFile,
        @Body() options: {
            processImages?: string;
            extractStyles?: string;
            preserveLatex?: string;
        }
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!file.originalname.toLowerCase().endsWith('.docx')) {
            throw new BadRequestException('Only .docx files are supported');
        }

        try {
            this.logger.log(`Processing file with Python parser: ${file.originalname} (${file.size} bytes)`);

            // Parse options
            const parseOptions = {
                processImages: options.processImages === 'true' || options.processImages === undefined,
                extractStyles: options.extractStyles === 'true' || options.extractStyles === undefined,
                preserveLatex: options.preserveLatex === 'true' || options.preserveLatex === undefined
            };

            const result = await this.pythonDocxParserService.processUploadedFile(file, parseOptions);

            this.logger.log(`Successfully parsed ${result.questions.length} questions with Python parser`);

            return {
                success: true,
                message: 'Document parsed successfully with Python',
                parsingEngine: 'python',
                data: {
                    questions: result.questions,
                    stats: result.stats,
                    extractedFiles: result.extractedFiles.map(f => ({
                        id: f.id,
                        fileName: f.fileName,
                        originalName: f.originalName,
                        mimeType: f.mimeType,
                        fileType: f.fileType,
                        size: f.size
                    })),
                    filePath: result.filePath
                }
            };
        } catch (error) {
            this.logger.error(`Error parsing document with Python: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to parse document: ${error.message}`);
        }
    }

    @Post('test')
    @ApiOperation({
        summary: 'Test Python execution',
        description: 'Tests if Python can be executed from Node.js'
    })
    async testPythonExecution() {
        try {
            this.logger.log('Testing Python execution');

            const result = await this.pythonDocxParserService.testPythonExecution();

            return {
                success: true,
                message: 'Python execution test completed',
                data: result
            };
        } catch (error) {
            this.logger.error(`Error testing Python execution: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to execute Python: ${error.message}`);
        }
    }
}
