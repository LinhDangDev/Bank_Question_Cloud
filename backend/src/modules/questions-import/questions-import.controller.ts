import { Controller, Post, Get, UseInterceptors, UploadedFile, Body, Param, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiOperation, ApiBody } from '@nestjs/swagger';
import { QuestionsImportService } from './questions-import.service';
import { PaginationDto } from '../../dto/pagination.dto';
import { MulterFile } from '../../interfaces/multer-file.interface';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

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
    }))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('maPhan') maPhan?: string,
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
            size: file.size
        };

        return this.questionsImportService.parseAndSaveQuestions(multerFile, maPhan);
    }

    @Get('preview/:fileId')
    @ApiOperation({ summary: 'Preview parsed questions from a previously uploaded file' })
    async previewQuestions(
        @Param('fileId') fileId: string,
        @Query() paginationDto: PaginationDto,
    ) {
        return this.questionsImportService.getImportedQuestions(fileId, paginationDto);
    }

    @Post('save')
    @ApiOperation({ summary: 'Save previewed questions to the database' })
    async saveQuestions(
        @Body() payload: { fileId: string, questionIds: string[], maPhan?: string }
    ) {
        return this.questionsImportService.saveQuestionsToDatabase(
            payload.fileId,
            payload.questionIds,
            payload.maPhan
        );
    }
}
