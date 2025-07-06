import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { FilesUrlService, FileUrlResponse } from './files-url.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('files-url')
export class FilesUrlController {
    constructor(private readonly filesUrlService: FilesUrlService) { }

    /**
     * Lấy URL của file theo MaFile - PUBLIC (không cần auth)
     * GET /files-url/:maFile
     */
    @Get(':maFile')
    async getFileUrl(@Param('maFile') maFile: string): Promise<FileUrlResponse> {
        return this.filesUrlService.getFileUrl(maFile);
    }

    /**
     * Lấy tất cả files của một câu hỏi - PUBLIC (không cần auth)
     * GET /files-url/question/:maCauHoi
     */
    @Get('question/:maCauHoi')
    async getQuestionFiles(@Param('maCauHoi') maCauHoi: string): Promise<FileUrlResponse[]> {
        return this.filesUrlService.getQuestionFiles(maCauHoi);
    }

    /**
     * Lấy tất cả files của một câu trả lời - PUBLIC (không cần auth)
     * GET /files-url/answer/:maCauTraLoi
     */
    @Get('answer/:maCauTraLoi')
    async getAnswerFiles(@Param('maCauTraLoi') maCauTraLoi: string): Promise<FileUrlResponse[]> {
        return this.filesUrlService.getAnswerFiles(maCauTraLoi);
    }

    /**
     * Lấy thống kê files - CẦN AUTH
     * GET /files-url/stats
     */
    @Get('stats/overview')
    @UseGuards(JwtAuthGuard)
    async getFilesStats() {
        return this.filesUrlService.getFilesStats();
    }

    /**
     * Kiểm tra file có tồn tại trên Spaces không - PUBLIC (không cần auth)
     * GET /files-url/:maFile/exists
     */
    @Get(':maFile/exists')
    async checkFileExists(@Param('maFile') maFile: string): Promise<{ exists: boolean }> {
        const exists = await this.filesUrlService.checkFileExists(maFile);
        return { exists };
    }
}
