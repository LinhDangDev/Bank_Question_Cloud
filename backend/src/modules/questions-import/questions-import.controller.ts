import { Controller, Post, Get, UseInterceptors, UploadedFile, Body, Param, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiOperation, ApiBody } from '@nestjs/swagger';
import { QuestionsImportService } from './questions-import.service';
import { PaginationDto } from '../../dto/pagination.dto';
import { MulterFile } from '../../interfaces/multer-file.interface';

@ApiTags('questions-import')
@Controller('questions-import')
export class QuestionsImportController {
    constructor(private readonly questionsImportService: QuestionsImportService) { }

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
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: MulterFile,
        @Body('maPhan') maPhan?: string,
    ) {
        return this.questionsImportService.parseAndSaveQuestions(file, maPhan);
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
