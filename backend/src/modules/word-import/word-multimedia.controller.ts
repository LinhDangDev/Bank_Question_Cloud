import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Body,
    BadRequestException,
    UseGuards,
    HttpCode,
    ParseUUIDPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WordMultimediaService, WordImportResult } from './word-multimedia.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface WordUploadDto {
    maCauHoi?: string;
    maCauTraLoi?: string;
    extractOnly?: boolean; // Chỉ extract, không upload
}

interface DownloadAudioDto {
    url: string;
    fileName: string;
    maCauHoi?: string;
    maCauTraLoi?: string;
}

@Controller('word-import')
@UseGuards(JwtAuthGuard)
export class WordMultimediaController {
    constructor(
        private readonly wordMultimediaService: WordMultimediaService
    ) { }

    /**
     * Upload Word file và extract multimedia
     * POST /word-import/upload-with-media
     */
    @Post('upload-with-media')
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB limit
        },
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(docx)$/)) {
                return callback(new BadRequestException('Only .docx files are allowed'), false);
            }
            callback(null, true);
        },
    }))
    async uploadWordWithMedia(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: WordUploadDto
    ): Promise<WordImportResult> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        try {
            const result = await this.wordMultimediaService.processWordWithMultimedia(
                file.buffer,
                body.maCauHoi,
                body.maCauTraLoi
            );

            return result;

        } catch (error) {
            throw new BadRequestException(`Word processing failed: ${error.message}`);
        }
    }

    /**
     * Chỉ extract multimedia từ Word, không upload
     * POST /word-import/extract-media
     */
    @Post('extract-media')
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB limit
        },
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(docx)$/)) {
                return callback(new BadRequestException('Only .docx files are allowed'), false);
            }
            callback(null, true);
        },
    }))
    async extractMediaOnly(
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        try {
            const extractedMedia = await this.wordMultimediaService.extractMultimediaFromWord(file.buffer);

            return {
                totalFiles: extractedMedia.length,
                files: extractedMedia.map(media => ({
                    fileName: media.fileName,
                    originalName: media.originalName,
                    fileType: media.fileType,
                    mimeType: media.mimeType,
                    size: media.buffer.length
                }))
            };

        } catch (error) {
            throw new BadRequestException(`Media extraction failed: ${error.message}`);
        }
    }

    /**
     * Download audio từ URL và lưu vào Spaces
     * POST /word-import/download-audio
     */
    @Post('download-audio')
    @HttpCode(200)
    async downloadAudio(@Body() body: DownloadAudioDto) {
        if (!body.url || !body.fileName) {
            throw new BadRequestException('URL and fileName are required');
        }

        try {
            const result = await this.wordMultimediaService.downloadAndSaveAudio(
                body.url,
                body.fileName,
                body.maCauHoi,
                body.maCauTraLoi
            );

            return {
                success: true,
                file: result
            };
        } catch (error) {
            throw new BadRequestException(`Failed to download audio: ${error.message}`);
        }
    }

    /**
     * Test endpoint để check Word file structure
     * POST /word-import/analyze
     */
    @Post('analyze')
    @UseInterceptors(FileInterceptor('file'))
    async analyzeWordFile(
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        try {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(file.buffer);
            const entries = zip.getEntries();

            const structure = entries.map(entry => ({
                name: entry.entryName,
                size: entry.header.size,
                isDirectory: entry.isDirectory,
                isMedia: entry.entryName.includes('media') || entry.entryName.includes('embeddings')
            }));

            return {
                fileName: file.originalname,
                fileSize: file.size,
                totalEntries: entries.length,
                structure: structure.filter(item => item.isMedia || item.name.includes('word/')),
                mediaFiles: structure.filter(item => item.isMedia)
            };

        } catch (error) {
            throw new BadRequestException(`File analysis failed: ${error.message}`);
        }
    }
}
