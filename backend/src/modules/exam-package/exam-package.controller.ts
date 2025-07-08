import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,
    UseGuards,
    Logger,
    BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExamPackageService } from '../../services/exam-package.service';
import { UploadExamPackageDto, ExamPackageUploadResponseDto } from '../../dto/exam-package.dto';
import { MulterFile } from '../../interfaces/multer-file.interface';
import * as fs from 'fs';

@ApiTags('Exam Package')
@Controller('exam-packages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamPackageController {
    private readonly logger = new Logger(ExamPackageController.name);

    constructor(private readonly examPackageService: ExamPackageService) { }

    @Post('upload')
    @Roles('admin', 'teacher')
    @ApiOperation({
        summary: 'Upload and process exam package (ZIP file with Word document and media files)',
        description: `
        Upload a ZIP file containing:
        - One Word document (.docx) with questions
        - Optional audio folder with audio files (.mp3, .wav, .m4a)
        - Optional images folder with image files (.jpg, .png, .gif, .bmp)

        The system will:
        - Extract and parse the Word document
        - Upload audio files to Digital Ocean Spaces
        - Convert images to WebP format and upload to Digital Ocean Spaces
        - Replace local media paths with full URLs
        - Detect underline formatting to set HoanVi values
        `
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Exam package upload',
        type: UploadExamPackageDto,
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'ZIP file containing Word document and media files'
                },
                maPhan: {
                    type: 'string',
                    description: 'Section ID to assign questions to'
                },
                processImages: {
                    type: 'boolean',
                    description: 'Whether to process and convert images to WebP',
                    default: true
                },
                processAudio: {
                    type: 'boolean',
                    description: 'Whether to process audio files',
                    default: true
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of questions to process',
                    default: 100
                },
                saveToDatabase: {
                    type: 'boolean',
                    description: 'Whether to save processed questions to database',
                    default: false
                }
            },
            required: ['file']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Exam package processed successfully',
        type: ExamPackageUploadResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - Invalid file format or structure'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing JWT token'
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient permissions'
    })
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 100 * 1024 * 1024, // 100MB limit for ZIP files
        },
        fileFilter: (req, file, callback) => {
            if (!file.originalname.toLowerCase().endsWith('.zip')) {
                return callback(new BadRequestException('Only ZIP files are allowed'), false);
            }
            callback(null, true);
        }
    }))
    async uploadExamPackage(
        @UploadedFile() file: Express.Multer.File,
        @Body('maPhan') maPhan?: string,
        @Body('processImages') processImages?: string,
        @Body('processAudio') processAudio?: string,
        @Body('limit') limit?: string,
        @Body('saveToDatabase') saveToDatabase?: string
    ): Promise<ExamPackageUploadResponseDto> {
        if (!file) {
            throw new BadRequestException('No ZIP file provided');
        }

        // Validate file type
        if (!file.originalname.toLowerCase().endsWith('.zip')) {
            throw new BadRequestException('Only ZIP files are allowed');
        }

        // Validate file size
        if (file.size > 100 * 1024 * 1024) {
            throw new BadRequestException('File size exceeds 100MB limit');
        }

        // Validate maPhan if saveToDatabase is true
        if (saveToDatabase === 'true' && !maPhan) {
            throw new BadRequestException('maPhan is required when saveToDatabase is true');
        }

        this.logger.log(`Processing exam package upload: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        try {
            // Convert Express.Multer.File to MulterFile interface
            const multerFile: MulterFile = {
                fieldname: file.fieldname,
                originalname: file.originalname,
                encoding: file.encoding,
                mimetype: file.mimetype,
                buffer: fs.readFileSync(file.path),
                size: file.size,
                path: file.path
            };

            // Parse options
            const options = {
                processImages: processImages !== 'false', // Default true
                processAudio: processAudio !== 'false',   // Default true
                limit: limit ? parseInt(limit, 10) : 100,
                saveToDatabase: saveToDatabase === 'true' // Default false
            };

            // Process the exam package
            const result = await this.examPackageService.processExamPackage(
                multerFile,
                maPhan,
                options
            );

            // Clean up uploaded file
            try {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (cleanupError) {
                this.logger.warn(`Failed to cleanup uploaded file: ${cleanupError.message}`);
            }

            // Determine processing status
            let status: 'success' | 'partial' | 'failed' = 'success';
            if (result.errors.length > 0) {
                status = result.warnings.length > 0 ? 'partial' : 'failed';
            } else if (result.warnings.length > 0) {
                status = 'partial';
            }

            const response: ExamPackageUploadResponseDto = {
                packageId: result.packageId,
                questionCount: result.statistics.totalQuestions,
                mediaFileCount: result.statistics.totalMediaFiles,
                audioFileCount: result.statistics.audioFilesProcessed,
                imageFileCount: result.statistics.imageFilesProcessed,
                status,
                errors: result.errors.length > 0 ? result.errors : undefined,
                warnings: result.warnings.length > 0 ? result.warnings : undefined
            };

            this.logger.log(`Successfully processed exam package: ${result.packageId}`);
            this.logger.log(`Statistics: ${JSON.stringify(result.statistics, null, 2)}`);

            return response;

        } catch (error) {
            this.logger.error(`Failed to process exam package: ${error.message}`, error.stack);

            // Clean up uploaded file on error
            try {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (cleanupError) {
                this.logger.warn(`Failed to cleanup uploaded file after error: ${cleanupError.message}`);
            }

            throw new BadRequestException(`Failed to process exam package: ${error.message}`);
        }
    }

    @Post('validate')
    @Roles('admin', 'teacher')
    @ApiOperation({
        summary: 'Validate exam package structure without processing',
        description: 'Upload and validate ZIP file structure without actually processing the content'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Exam package validation',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'ZIP file to validate'
                }
            },
            required: ['file']
        }
    })
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 100 * 1024 * 1024, // 100MB limit
        },
        fileFilter: (req, file, callback) => {
            if (!file.originalname.toLowerCase().endsWith('.zip')) {
                return callback(new BadRequestException('Only ZIP files are allowed'), false);
            }
            callback(null, true);
        }
    }))
    async validateExamPackage(
        @UploadedFile() file: Express.Multer.File
    ): Promise<{
        valid: boolean;
        structure: {
            hasWordDocument: boolean;
            wordDocumentName?: string;
            audioFiles: string[];
            imageFiles: string[];
            totalFiles: number;
        };
        errors: string[];
        warnings: string[];
    }> {
        if (!file) {
            throw new BadRequestException('No ZIP file provided');
        }

        this.logger.log(`Validating exam package: ${file.originalname}`);

        try {
            // Convert to MulterFile
            const multerFile: MulterFile = {
                fieldname: file.fieldname,
                originalname: file.originalname,
                encoding: file.encoding,
                mimetype: file.mimetype,
                buffer: fs.readFileSync(file.path),
                size: file.size,
                path: file.path
            };

            // This would need to be implemented in ExamPackageService
            // For now, return a basic validation response
            const response = {
                valid: true,
                structure: {
                    hasWordDocument: true,
                    wordDocumentName: 'example.docx',
                    audioFiles: [],
                    imageFiles: [],
                    totalFiles: 1
                },
                errors: [],
                warnings: []
            };

            // Clean up uploaded file
            try {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (cleanupError) {
                this.logger.warn(`Failed to cleanup uploaded file: ${cleanupError.message}`);
            }

            return response;

        } catch (error) {
            this.logger.error(`Failed to validate exam package: ${error.message}`, error.stack);

            // Clean up uploaded file on error
            try {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (cleanupError) {
                this.logger.warn(`Failed to cleanup uploaded file after error: ${cleanupError.message}`);
            }

            throw new BadRequestException(`Failed to validate exam package: ${error.message}`);
        }
    }
}
