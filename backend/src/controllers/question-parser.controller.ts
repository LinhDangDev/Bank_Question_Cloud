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
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocxParserService } from '../services/docx-parser.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { QuestionType } from '../enums/question-type.enum';

// Định nghĩa lại interface để tránh lỗi import
interface ParsedQuestion {
    content: string;
    type: QuestionType;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    mediaFiles?: any[];
    childQuestions?: ParsedQuestion[];
    parentId?: string;
    groupContent?: string;
    fillInBlankAnswers?: string[];
}

// Định nghĩa interface cho kết quả từ service
interface ParseResult {
    questions: ParsedQuestion[];
    errors: string[];
}

@ApiTags('Question Parser')
@Controller('question-parser')
export class QuestionParserController {
    private readonly logger = new Logger(QuestionParserController.name);

    constructor(
        private readonly docxParserService: DocxParserService,
    ) { }

    @Post('parse-docx')
    @ApiOperation({ summary: 'Parse questions from uploaded DOCX file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'DOCX file containing questions',
                },
                uploadMedia: {
                    type: 'boolean',
                    description: 'Whether to upload media files to cloud storage',
                },
                generateThumbnails: {
                    type: 'boolean',
                    description: 'Whether to generate thumbnails for images',
                },
            },
            required: ['file'],
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadDir = path.join(process.cwd(), 'uploads', 'questions', 'temp');
                    fs.mkdirSync(uploadDir, { recursive: true });
                    cb(null, uploadDir);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${uniqueSuffix}-${file.originalname}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.originalname.match(/\.(docx|doc)$/)) {
                    return cb(new BadRequestException('Only DOCX files are allowed'), false);
                }
                cb(null, true);
            },
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB max file size
            },
        }),
    )
    async parseDocx(
        @UploadedFile() file: Express.Multer.File,
        @Body('uploadMedia') uploadMedia?: string,
        @Body('generateThumbnails') generateThumbnails?: string,
    ): Promise<{ success: boolean; questions: ParsedQuestion[]; errors: string[]; stats: any }> {
        try {
            if (!file) {
                throw new BadRequestException('DOCX file is required');
            }

            if (!file.originalname.toLowerCase().endsWith('.docx')) {
                throw new BadRequestException('Only DOCX files are supported');
            }

            const result = await this.docxParserService.processUploadedFile(file, {
                uploadMedia: uploadMedia === 'true',
                generateThumbnails: generateThumbnails === 'true',
            });

            // Cleanup temporary file
            try {
                fs.unlinkSync(file.path);
            } catch (cleanupError) {
                this.logger.warn(`Failed to cleanup temp file: ${cleanupError.message}`);
            }

            return {
                success: true,
                questions: result.questions,
                errors: result.errors,
                stats: {
                    totalQuestions: result.questions.length,
                    singleChoiceQuestions: result.questions.filter(q => q.type === QuestionType.SINGLE_CHOICE).length,
                    groupQuestions: result.questions.filter(q => q.type === QuestionType.GROUP).length,
                    fillInBlankQuestions: result.questions.filter(q => q.type === QuestionType.FILL_IN_BLANK).length,
                }
            };
        } catch (error) {
            this.logger.error(`Failed to parse DOCX: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to parse DOCX: ${error.message}`);
        }
    }
}
