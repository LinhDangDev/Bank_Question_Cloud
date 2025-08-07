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
    HttpCode,
    BadRequestException
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
        // Validate GUID format
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(maFile)) {
            throw new BadRequestException('Invalid file ID format');
        }

        const url = await this.filesSpacesService.getFileUrl(maFile);
        return { url };
    }

    @Get('test-upload')
    @ApiOperation({ summary: 'Test upload endpoint' })
    async testUpload() {
        return {
            message: 'Upload endpoint is working',
            timestamp: new Date().toISOString()
        };
    }

    @Post('upload-editor-image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Upload image for TinyMCE editor' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Image uploaded successfully for editor',
        schema: {
            type: 'object',
            properties: {
                location: { type: 'string', description: 'Public URL of uploaded image' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadEditorImage(@UploadedFile() file: MulterFile) {
        try {
            console.log('📸 TinyMCE upload request received:', {
                hasFile: !!file,
                filename: file?.originalname,
                mimetype: file?.mimetype,
                size: file?.size
            });

            if (!file) {
                throw new BadRequestException('No file provided');
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                console.error('❌ Invalid file type:', file.mimetype, 'Allowed:', allowedTypes);
                throw new BadRequestException(`Only image files are allowed (JPEG, PNG, GIF, WebP). Received: ${file.mimetype}`);
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new BadRequestException('File size must be less than 5MB');
            }

            console.log('📤 Uploading to Spaces...');
            const result = await this.filesSpacesService.uploadFile(file);

            const publicUrl = (result as any).publicUrl;
            console.log('✅ Upload successful:', publicUrl);

            // Return in format expected by TinyMCE
            return {
                location: publicUrl
            };
        } catch (error) {
            console.error('❌ TinyMCE upload error:', error);
            throw error;
        }
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
