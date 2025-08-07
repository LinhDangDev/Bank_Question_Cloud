import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Body,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MulterFile } from '../interfaces/multer-file.interface';
import { PythonEnhancedDocxParserService } from '../services/python-enhanced-docx-parser.service';

/**
 * Python Enhanced DOCX Parser Controller
 * Uses the new Python parser with improved answer recognition
 * Author: Linh Dang Dev
 */
@ApiTags('Python Enhanced DOCX Parser')
@Controller('python-enhanced-docx-parser')
export class PythonEnhancedDocxParserController {
    private readonly logger = new Logger(PythonEnhancedDocxParserController.name);

    constructor(
        private readonly pythonEnhancedDocxParserService: PythonEnhancedDocxParserService,
    ) {}

    @Post('upload')
    @ApiOperation({ 
        summary: 'Parse Word document using enhanced Python parser',
        description: 'Upload a DOCX file and parse questions using the new Python parser with improved answer recognition'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'DOCX file to parse'
                },
                processImages: {
                    type: 'boolean',
                    default: true,
                    description: 'Process and extract images'
                },
                extractStyles: {
                    type: 'boolean',
                    default: true,
                    description: 'Extract detailed style information'
                },
                preserveLatex: {
                    type: 'boolean',
                    default: true,
                    description: 'Preserve LaTeX math expressions'
                },
                maxQuestions: {
                    type: 'number',
                    default: 100,
                    description: 'Maximum number of questions to parse'
                }
            },
            required: ['file']
        }
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: MulterFile,
        @Body('processImages') processImages: string = 'true',
        @Body('extractStyles') extractStyles: string = 'true',
        @Body('preserveLatex') preserveLatex: string = 'true',
        @Body('maxQuestions') maxQuestions: string = '100'
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!file.originalname.toLowerCase().endsWith('.docx')) {
            throw new BadRequestException('Only .docx files are supported');
        }

        this.logger.log(`Received file: ${file.originalname} (${file.size} bytes)`);

        const options = {
            processImages: processImages === 'true',
            extractStyles: extractStyles === 'true',
            preserveLatex: preserveLatex === 'true',
            maxQuestions: maxQuestions ? parseInt(maxQuestions) : 100
        };

        try {
            const result = await this.pythonEnhancedDocxParserService.parseUploadedFile(file, options);

            this.logger.log(`Successfully parsed document with ${result.questions.length} questions`);

            return {
                success: result.success,
                message: result.success 
                    ? `Successfully parsed ${result.questions.length} questions`
                    : 'Failed to parse document',
                data: {
                    questions: result.questions,
                    stats: result.stats,
                    filePath: result.filePath
                },
                errors: result.errors || []
            };
        } catch (error) {
            this.logger.error(`Error parsing document: ${error.message}`, error.stack);
            
            return {
                success: false,
                message: 'Failed to parse document',
                data: {
                    questions: [],
                    stats: {
                        totalQuestions: 0,
                        groupQuestions: 0,
                        singleQuestions: 0,
                        fillInBlankQuestions: 0,
                        hasLatex: 0,
                        correctAnswersFound: 0
                    },
                    filePath: null
                },
                errors: [error.message]
            };
        }
    }

    @Post('test')
    @ApiOperation({ 
        summary: 'Test Python parser with sample file',
        description: 'Test the Python parser functionality'
    })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async testParser(
        @UploadedFile() file: MulterFile
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded for testing');
        }

        this.logger.log(`Testing parser with file: ${file.originalname}`);

        try {
            const result = await this.pythonEnhancedDocxParserService.parseUploadedFile(file, {
                processImages: true,
                extractStyles: true,
                preserveLatex: true,
                maxQuestions: 10 // Limit for testing
            });

            return {
                success: result.success,
                message: 'Test completed',
                data: {
                    questionsFound: result.questions.length,
                    stats: result.stats,
                    sampleQuestions: result.questions.slice(0, 3), // Show first 3 questions
                    errors: result.errors || []
                }
            };
        } catch (error) {
            this.logger.error(`Test failed: ${error.message}`, error.stack);
            
            return {
                success: false,
                message: 'Test failed',
                data: {
                    questionsFound: 0,
                    error: error.message
                }
            };
        }
    }
}
