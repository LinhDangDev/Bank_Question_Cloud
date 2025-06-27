import { Controller, Post, Get, UseInterceptors, UploadedFile, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiOperation, ApiBody } from '@nestjs/swagger';
import { QuestionsImportService } from './questions-import.service';
import { PaginationDto } from '../../dto/pagination.dto';
import { MulterFile } from '../../interfaces/multer-file.interface';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('questions-import')
@Controller('questions-import')
export class QuestionsImportController {
    constructor(private readonly questionsImportService: QuestionsImportService) {
        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'uploads', 'temp');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Upload and parse Word document with questions' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                maPhan: {
                    type: 'string',
                    nullable: true,
                },
                processImages: {
                    type: 'boolean',
                    default: true,
                },
                limit: {
                    type: 'number',
                    default: 100,
                }
            },
        },
    })
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = path.join(process.cwd(), 'uploads', 'temp');
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = path.extname(file.originalname);
                cb(null, `${uniqueSuffix}${ext}`);
            },
        }),
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB maximum file size
        },
    }))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('maPhan') maPhan?: string,
        @Body('processImages') processImages?: boolean,
        @Body('limit') limit?: number,
    ) {
        if (!file) {
            throw new Error('No file uploaded');
        }

        // Convert Express.Multer.File to our MulterFile interface
        const multerFile: MulterFile = {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            buffer: fs.readFileSync(file.path), // Read file from disk to get buffer
            size: file.size,
            path: file.path // Add path to allow direct file access
        };

        // Pass parsing options to the service
        return this.questionsImportService.parseAndSaveQuestions(
            multerFile,
            maPhan,
            { processImages: Boolean(processImages), limit: limit ? Number(limit) : 100 }
        );
    }

    @Get('preview/:fileId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Preview parsed questions from a previously uploaded file' })
    async previewQuestions(
        @Param('fileId') fileId: string,
        @Query() paginationDto: PaginationDto,
    ) {
        // Extract and provide higher limit from query params
        const limit = paginationDto.limit || 100;

        return this.questionsImportService.getImportedQuestions(fileId, {
            ...paginationDto,
            limit
        });
    }

    @Post('save')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Save previewed questions to approval queue (teacher) or directly to database (admin)' })
    async saveQuestions(
        @Body() payload: {
            fileId: string,
            questionIds: string[],
            maPhan?: string,
            questionMetadata?: any[]  // Accept CLO metadata
        },
        @Request() req: any
    ) {
        const user = req.user;

        // Nếu là teacher, lưu vào bảng chờ duyệt
        if (user.role === 'teacher') {
            return this.questionsImportService.saveQuestionsToApprovalQueue(
                payload.fileId,
                payload.questionIds,
                payload.maPhan,
                payload.questionMetadata,
                user.sub // userId của teacher
            );
        } else {
            // Nếu là admin, lưu trực tiếp vào database
            return this.questionsImportService.saveQuestionsToDatabase(
                payload.fileId,
                payload.questionIds,
                payload.maPhan,
                payload.questionMetadata
            );
        }
    }
}
