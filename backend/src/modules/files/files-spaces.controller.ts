import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseInterceptors,
    UploadedFile,
    Body,
    UseGuards,
    HttpStatus,
    HttpCode
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { FilesSpacesService } from './files-spaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

@ApiTags('files-spaces')
@Controller('files-spaces')
export class FilesSpacesController {
    constructor(private readonly filesSpacesService: FilesSpacesService) { }

    @Post('upload')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Upload file to DigitalOcean Spaces' })
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
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        schema: {
            type: 'object',
            properties: {
                MaFile: { type: 'string' },
                TenFile: { type: 'string' },
                LoaiFile: { type: 'number' },
                publicUrl: { type: 'string' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: MulterFile,
        @Body('maCauHoi') maCauHoi?: string,
        @Body('maCauTraLoi') maCauTraLoi?: string,
    ) {
        return await this.filesSpacesService.uploadFile(file, maCauHoi, maCauTraLoi);
    }

    @Get('url/:maFile')
    @ApiOperation({ summary: 'Get public URL for a file' })
    @ApiResponse({
        status: 200,
        description: 'File URL retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                url: { type: 'string' },
            },
        },
    })
    async getFileUrl(@Param('maFile') maFile: string) {
        const url = await this.filesSpacesService.getFileUrl(maFile);
        return { url };
    }

    @Get('question/:maCauHoi')
    @ApiOperation({ summary: 'Get all files for a question with public URLs' })
    @ApiResponse({
        status: 200,
        description: 'Files retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    MaFile: { type: 'string' },
                    TenFile: { type: 'string' },
                    LoaiFile: { type: 'number' },
                    publicUrl: { type: 'string' },
                },
            },
        },
    })
    async getQuestionFiles(@Param('maCauHoi') maCauHoi: string) {
        return await this.filesSpacesService.getFilesByQuestion(maCauHoi);
    }

    @Get('answer/:maCauTraLoi')
    @ApiOperation({ summary: 'Get all files for an answer with public URLs' })
    @ApiResponse({
        status: 200,
        description: 'Files retrieved successfully',
    })
    async getAnswerFiles(@Param('maCauTraLoi') maCauTraLoi: string) {
        return await this.filesSpacesService.getFilesByAnswer(maCauTraLoi);
    }

    @Delete(':maFile')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Delete a file from Spaces and database' })
    @ApiResponse({
        status: 204,
        description: 'File deleted successfully',
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteFile(@Param('maFile') maFile: string) {
        await this.filesSpacesService.deleteFile(maFile);
    }

    @Post('migrate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Migrate existing files to Spaces format' })
    @ApiResponse({
        status: 200,
        description: 'Migration completed',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'number' },
                failed: { type: 'number' },
                errors: { type: 'array', items: { type: 'string' } },
            },
        },
    })
    async migrateFiles() {
        return await this.filesSpacesService.migrateExistingFiles();
    }
}
