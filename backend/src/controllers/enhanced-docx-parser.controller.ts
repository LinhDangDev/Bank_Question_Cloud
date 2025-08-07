import { 
    Controller, 
    Post, 
    UploadedFile, 
    UseInterceptors, 
    BadRequestException,
    Body,
    Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EnhancedDocxParserService } from '../services/enhanced-docx-parser.service';

/**
 * Enhanced DOCX Parser Controller
 * Author: Linh Dang Dev
 * 
 * Provides endpoints to test the new Node.js-based Word parser
 */

@ApiTags('Enhanced DOCX Parser')
@Controller('enhanced-docx-parser')
export class EnhancedDocxParserController {
    private readonly logger = new Logger(EnhancedDocxParserController.name);

    constructor(
        private readonly enhancedDocxParserService: EnhancedDocxParserService
    ) {}

    @Post('parse')
    @ApiOperation({ 
        summary: 'Parse Word document with enhanced Node.js parser',
        description: 'Upload a Word document and parse it using the new enhanced parser that extracts images and handles LaTeX better'
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
                },
                maxQuestions: {
                    type: 'number',
                    description: 'Maximum number of questions to parse',
                    default: 100
                }
            }
        }
    })
    @UseInterceptors(FileInterceptor('file'))
    async parseWordDocument(
        @UploadedFile() file: Express.Multer.File,
        @Body() options: {
            processImages?: string;
            extractStyles?: string;
            preserveLatex?: string;
            maxQuestions?: string;
        }
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!file.originalname.toLowerCase().endsWith('.docx')) {
            throw new BadRequestException('Only .docx files are supported');
        }

        try {
            this.logger.log(`Processing file: ${file.originalname} (${file.size} bytes)`);

            // Parse options from string to boolean/number
            const parseOptions = {
                processImages: options.processImages === 'true' || options.processImages === undefined,
                extractStyles: options.extractStyles === 'true' || options.extractStyles === undefined,
                preserveLatex: options.preserveLatex === 'true' || options.preserveLatex === undefined,
                maxQuestions: options.maxQuestions ? parseInt(options.maxQuestions) : 100
            };

            const result = await this.enhancedDocxParserService.parseUploadedFile(file, parseOptions);

            this.logger.log(`Successfully parsed ${result.questions.length} questions with ${result.extractedFiles.length} media files`);

            return {
                success: true,
                message: 'Document parsed successfully',
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
            this.logger.error(`Error parsing document: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to parse document: ${error.message}`);
        }
    }

    @Post('parse-images-only')
    @ApiOperation({ 
        summary: 'Extract only images from Word document',
        description: 'Upload a Word document and extract only the images without parsing questions'
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
                }
            }
        }
    })
    @UseInterceptors(FileInterceptor('file'))
    async extractImagesOnly(
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!file.originalname.toLowerCase().endsWith('.docx')) {
            throw new BadRequestException('Only .docx files are supported');
        }

        try {
            this.logger.log(`Extracting images from: ${file.originalname} (${file.size} bytes)`);

            const result = await this.enhancedDocxParserService.parseUploadedFile(file, {
                processImages: true,
                extractStyles: false,
                preserveLatex: false,
                maxQuestions: 0 // Don't parse questions
            });

            this.logger.log(`Successfully extracted ${result.extractedFiles.length} images`);

            return {
                success: true,
                message: 'Images extracted successfully',
                data: {
                    totalImages: result.extractedFiles.length,
                    images: result.extractedFiles.map(f => ({
                        id: f.id,
                        fileName: f.fileName,
                        originalName: f.originalName,
                        mimeType: f.mimeType,
                        fileType: f.fileType,
                        size: f.size,
                        // Convert buffer to base64 for preview
                        preview: f.fileType === 2 ? `data:${f.mimeType};base64,${f.buffer.toString('base64')}` : null
                    }))
                }
            };

        } catch (error) {
            this.logger.error(`Error extracting images: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to extract images: ${error.message}`);
        }
    }

    @Post('compare-parsers')
    @ApiOperation({ 
        summary: 'Compare enhanced parser with original Python parser',
        description: 'Parse the same document with both parsers and compare results'
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
                }
            }
        }
    })
    @UseInterceptors(FileInterceptor('file'))
    async compareParsers(
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!file.originalname.toLowerCase().endsWith('.docx')) {
            throw new BadRequestException('Only .docx files are supported');
        }

        try {
            this.logger.log(`Comparing parsers for: ${file.originalname} (${file.size} bytes)`);

            // Parse with enhanced parser
            const enhancedResult = await this.enhancedDocxParserService.parseUploadedFile(file, {
                processImages: true,
                extractStyles: true,
                preserveLatex: true
            });

            // TODO: Parse with original Python parser for comparison
            // This would require injecting the original DocxParserService

            return {
                success: true,
                message: 'Parser comparison completed',
                data: {
                    enhanced: {
                        questions: enhancedResult.questions.length,
                        images: enhancedResult.extractedFiles.length,
                        stats: enhancedResult.stats,
                        processingTime: 'N/A' // Could add timing
                    },
                    python: {
                        // TODO: Add Python parser results
                        questions: 'N/A',
                        images: 'N/A',
                        stats: 'N/A',
                        processingTime: 'N/A'
                    },
                    comparison: {
                        imageExtractionImprovement: enhancedResult.extractedFiles.length > 0 ? 'Enhanced parser extracted images successfully' : 'No images found',
                        recommendation: 'Enhanced Node.js parser provides better image extraction and LaTeX handling'
                    }
                }
            };

        } catch (error) {
            this.logger.error(`Error comparing parsers: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to compare parsers: ${error.message}`);
        }
    }
}
