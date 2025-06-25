import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, Param, Delete, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { ApiTags, ApiConsumes, ApiOperation, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Response } from 'express';
import { createReadStream } from 'fs';

// Define MulterFile interface for type safety
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

@ApiTags('files')
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    @Post('upload')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Upload a file associated with a question or answer' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                maCauHoi: {
                    type: 'string',
                    nullable: true,
                },
                maCauTraLoi: {
                    type: 'string',
                    nullable: true,
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: MulterFile,
        @Body('maCauHoi') maCauHoi?: string,
        @Body('maCauTraLoi') maCauTraLoi?: string,
    ) {
        return this.filesService.create(file, maCauHoi, maCauTraLoi);
    }

    @Get('question/:maCauHoi')
    @ApiOperation({ summary: 'Get all files for a specific question' })
    async getQuestionFiles(@Param('maCauHoi') maCauHoi: string) {
        return this.filesService.findByCauHoi(maCauHoi);
    }

    @Get('answer/:maCauTraLoi')
    @ApiOperation({ summary: 'Get all files for a specific answer' })
    async getAnswerFiles(@Param('maCauTraLoi') maCauTraLoi: string) {
        return this.filesService.findByCauTraLoi(maCauTraLoi);
    }

    @Delete(':maFile')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Delete a file' })
    async deleteFile(@Param('maFile') maFile: string) {
        return this.filesService.delete(maFile);
    }

    @Post('generate-pdf')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Generate a PDF from content' })
    async generatePdfFromContent(
        @Body('title') title: string,
        @Body('content') content: string,
        @Body('showAnswers') showAnswers: boolean = false,
        @Res({ passthrough: true }) res: Response,
    ) {
        const pdfPath = await this.filesService.generatePdfFromContent(title, content, showAnswers);
        const file = createReadStream(pdfPath);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
        });

        return new StreamableFile(file);
    }

    @Post('generate-docx')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Generate a DOCX from content' })
    async generateDocxFromContent(
        @Body('title') title: string,
        @Body('content') content: string,
        @Body('showAnswers') showAnswers: boolean = false,
        @Res({ passthrough: true }) res: Response,
    ) {
        const docxPath = await this.filesService.generateDocxFromContent(title, content, showAnswers);
        const file = createReadStream(docxPath);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.docx"`,
        });

        return new StreamableFile(file);
    }
}
